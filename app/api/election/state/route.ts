import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // 1. Config
    const configRows = await sql`SELECT * FROM election_config WHERE id = 1 LIMIT 1`;
    const config = configRows[0] || {
      voting_open: false,
      published_quorum: 77,
      published_at: '19:45',
      vagas_diac: 3,
      vagas_presb: 2,
      total_comungantes: 214,
    };

    // 2. Candidates
    const candidates = await sql`
      SELECT id, role, name, weight
      FROM candidates
      WHERE active = true
      ORDER BY role, name ASC
    `;

    // 3. Members
    const members = await sql`
      SELECT id, name, phone, checked_in, checked_at, has_voted
      FROM members
      ORDER BY name ASC
    `;

    // 4. Votes & Tally
    const voteCountRow = await sql`SELECT count(*)::int as total FROM votes`;
    const blankCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE is_blank = true`;
    const tallyRows = await sql`
      SELECT candidate_id, count(*)::int as votes
      FROM vote_candidates
      GROUP BY candidate_id
    `;

    const tally: Record<string, number> = {};
    candidates.forEach((c) => {
      tally[c.id] = 0;
    });
    tallyRows.forEach((r) => {
      tally[r.candidate_id] = r.votes;
    });

    return NextResponse.json({
      config: {
        votingOpen: config.voting_open,
        published: config.published_quorum,
        publishedAt: config.published_at,
        vagasDiac: config.vagas_diac,
        vagasPresb: config.vagas_presb,
        totalComungantes: config.total_comungantes,
      },
      candidates: {
        diac: candidates
          .filter((c) => c.role === 'diac')
          .map((c) => [c.id, c.name, Number(c.weight)]),
        presb: candidates
          .filter((c) => c.role === 'presb')
          .map((c) => [c.id, c.name, Number(c.weight)]),
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        phone: m.phone,
        checked: m.checked_in,
        time: m.checked_at,
        hasVoted: m.has_voted,
      })),
      counted: voteCountRow[0]?.total || 0,
      blanks: blankCountRow[0]?.total || 0,
      tally,
    });
  } catch (err: any) {
    console.error('Error fetching election state:', err);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}
