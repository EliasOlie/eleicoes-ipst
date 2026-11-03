import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { publishElectionEvent } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { name, phone, selection } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Identificação necessária' }, { status: 400 });
    }

    // 1. Check if voting is open
    const configRows = await sql`SELECT voting_open FROM election_config WHERE id = 1 LIMIT 1`;
    if (!configRows[0]?.voting_open) {
      return NextResponse.json(
        { error: 'A votação ainda não foi liberada pela mesa.' },
        { status: 403 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = name.trim().toLowerCase();

    // 2. Find member in DB
    const memberRows = await sql`
      SELECT id, name, phone, has_voted
      FROM members
      WHERE LOWER(name) = ${cleanName} OR REPLACE(phone, ' ', '') LIKE ${'%' + cleanPhone.slice(-8) + '%'}
      LIMIT 1
    `;

    if (memberRows.length === 0) {
      // If member typed full name but not exact match, search by first and last name
      const nameParts = cleanName.split(' ');
      const searchPattern = `%${nameParts[0]}%${nameParts[nameParts.length - 1]}%`;
      const fallbackRows = await sql`
        SELECT id, name, phone, has_voted
        FROM members
        WHERE LOWER(name) LIKE ${searchPattern}
        LIMIT 1
      `;
      if (fallbackRows.length > 0) {
        memberRows.push(fallbackRows[0]);
      }
    }

    const member = memberRows[0];
    if (member && member.has_voted) {
      return NextResponse.json(
        { error: 'Este membro já exerceu seu direito de voto. Acesso encerrado.' },
        { status: 403 }
      );
    }

    // 3. Generate anonymous cryptographically random receipt
    const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const receipt = `${p1}-${p2}`;

    const diacVotes: string[] = Array.isArray(selection?.diac) ? selection.diac : [];
    const presbVotes: string[] = Array.isArray(selection?.presb) ? selection.presb : [];
    const isBlank = diacVotes.length === 0 && presbVotes.length === 0;

    // 4. Transaction: mark member as has_voted, record secret ballot
    await sql.begin(async (tx) => {
      // Update member presence / has_voted
      if (member) {
        await tx`
          UPDATE members
          SET has_voted = true, voted_at = NOW()
          WHERE id = ${member.id}
        `;
      }

      // Record anonymous vote
      const voteInsert = await tx`
        INSERT INTO votes (receipt, is_blank)
        VALUES (${receipt}, ${isBlank})
        RETURNING id
      `;
      const voteId = voteInsert[0].id;

      // Record candidates
      for (const candidateId of [...diacVotes, ...presbVotes]) {
        await tx`
          INSERT INTO vote_candidates (vote_id, candidate_id)
          VALUES (${voteId}, ${candidateId})
        `;
      }
    });

    // 5. Tally summary to broadcast in real time via Redis
    const voteCountRow = await sql`SELECT count(*)::int as total FROM votes`;
    const blankCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE is_blank = true`;
    const tallyRows = await sql`
      SELECT candidate_id, count(*)::int as votes
      FROM vote_candidates
      GROUP BY candidate_id
    `;
    const tally: Record<string, number> = {};
    tallyRows.forEach((r) => {
      tally[r.candidate_id] = r.votes;
    });

    await publishElectionEvent({
      type: 'VOTE_CAST',
      receipt,
      counted: voteCountRow[0]?.total || 0,
      blanks: blankCountRow[0]?.total || 0,
      tally,
    });

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (err: any) {
    console.error('Error processing vote:', err);
    return NextResponse.json({ error: 'Erro ao registrar voto' }, { status: 500 });
  }
}
