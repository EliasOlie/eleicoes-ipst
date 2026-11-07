import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ensureSchema } from '@/lib/election-rules';

export async function GET() {
  try {
    const isAdmin = !!(await getAdminSession());

    // 1. Config
    const configRows = await sql`SELECT * FROM election_config WHERE id = 1 LIMIT 1`;
    const config = configRows[0] || {
      voting_open: false,
      published_quorum: 0,
      published_at: '',
      vagas_diac: 5,
      vagas_presb: 5,
      total_comungantes: 300,
    };

    // 2. Candidates
    const candidates = await sql`
      SELECT id, role, name, weight
      FROM candidates
      WHERE active = true
      ORDER BY role, name ASC
    `;

    // 3. Members
    await ensureSchema(sql);
    const members = await sql`
      SELECT id, name, phone, checked_in, checked_at, has_voted, voted_on_paper
      FROM members
      ORDER BY name ASC
    `;
    const [paperRow] = await sql`
      SELECT count(*)::int AS total FROM votes WHERE receipt LIKE 'PAPEL-%'
    `;
    const paperHanded = members.filter((m) => m.voted_on_paper).length;

    // 4. Votes & Tally
    const voteCountRow = await sql`SELECT count(*)::int as total FROM votes`;
    const blankCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE is_blank = true`;
    const nullCountRow = await sql`SELECT count(*)::int as total FROM votes WHERE is_null = true`;
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
      // Nome/telefone só para a Mesa autenticada (LGPD). O público recebe
      // apenas o necessário para contadores e para o eleitor saber se foi conferido.
      members: members.map((m) =>
        isAdmin
          ? {
              id: m.id,
              name: m.name,
              phone: m.phone,
              checked: m.checked_in,
              time: m.checked_at,
              hasVoted: m.has_voted,
              votedOnPaper: m.voted_on_paper,
            }
          : { id: m.id, checked: m.checked_in, hasVoted: m.has_voted }
      ),
      paperHanded,
      paperCounted: paperRow?.total || 0,
      counted: voteCountRow[0]?.total || 0,
      blanks: blankCountRow[0]?.total || 0,
      nulls: nullCountRow[0]?.total || 0,
      tally,
    });
  } catch (err: any) {
    console.error('Error fetching election state:', err);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}
