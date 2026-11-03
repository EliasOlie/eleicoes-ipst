import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Mesa e Escrutinadores' }, { status: 401 });
    }

    const { selection } = await req.json();

    const diacVotes: string[] = Array.isArray(selection?.diac) ? selection.diac : [];
    const presbVotes: string[] = Array.isArray(selection?.presb) ? selection.presb : [];
    const isBlank = diacVotes.length === 0 && presbVotes.length === 0;

    let receipt = '';

    await sql.begin(async (tx) => {
      // 1. Get next sequential paper receipt
      const paperCountRow = await tx`
        SELECT count(*)::int as total FROM votes WHERE receipt LIKE 'PAPEL-%'
      `;
      const nextNum = (paperCountRow[0]?.total || 0) + 1;
      receipt = `PAPEL-${String(nextNum).padStart(3, '0')}`;

      // 2. Insert vote
      const voteInsert = await tx`
        INSERT INTO votes (receipt, is_blank)
        VALUES (${receipt}, ${isBlank})
        RETURNING id
      `;
      const voteId = voteInsert[0].id;

      // 3. Insert candidate selections
      for (const candidateId of [...diacVotes, ...presbVotes]) {
        await tx`
          INSERT INTO vote_candidates (vote_id, candidate_id)
          VALUES (${voteId}, ${candidateId})
        `;
      }
    });

    // 4. Compute updated tallies
    const voteCountRow = await sql`SELECT count(*)::int as total FROM votes`;
    const blankCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE is_blank = true`;
    const paperCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE receipt LIKE 'PAPEL-%'`;
    const tallyRows = await sql`
      SELECT candidate_id, count(*)::int as votes
      FROM vote_candidates
      GROUP BY candidate_id
    `;

    const tally: Record<string, number> = {};
    tallyRows.forEach((r) => {
      tally[r.candidate_id] = r.votes;
    });

    // 5. Broadcast in real time
    await publishElectionEvent({
      type: 'VOTE_CAST',
      counted: voteCountRow[0]?.total || 0,
      blanks: blankCountRow[0]?.total || 0,
      tally,
    });

    return NextResponse.json({
      success: true,
      receipt,
      totalCounted: voteCountRow[0]?.total || 0,
      paperCount: paperCountRow[0]?.total || 0,
      blanks: blankCountRow[0]?.total || 0,
    });
  } catch (err: any) {
    console.error('Error recording paper vote:', err);
    return NextResponse.json({ error: 'Erro ao registrar cédula de papel' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const paperVotes = await sql`
      SELECT v.id, v.receipt, v.is_blank, v.created_at,
             ARRAY_AGG(vc.candidate_id) FILTER (WHERE vc.candidate_id IS NOT NULL) as candidate_ids
      FROM votes v
      LEFT JOIN vote_candidates vc ON v.id = vc.vote_id
      WHERE v.receipt LIKE 'PAPEL-%'
      GROUP BY v.id
      ORDER BY v.id DESC
    `;

    return NextResponse.json({
      success: true,
      paperVotes: paperVotes.map((p) => ({
        id: p.id,
        receipt: p.receipt,
        isBlank: p.is_blank,
        createdAt: p.created_at,
        candidateIds: p.candidate_ids || [],
      })),
      totalPaper: paperVotes.length,
    });
  } catch (err: any) {
    console.error('Error fetching paper votes:', err);
    return NextResponse.json({ error: 'Erro ao buscar cédulas de papel' }, { status: 500 });
  }
}
