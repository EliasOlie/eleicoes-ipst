import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { ensureSchema } from '@/lib/election-rules';

/**
 * Mesa entrega a cédula de papel a um membro conferido.
 * O membro passa a constar como "já votou" — não consegue mais votar pelo celular,
 * e a apuração compara cédulas de papel ENTREGUES x APURADAS.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Sessão da Mesa expirada. Entre novamente.' }, { status: 401 });
    }

    const { memberId } = await req.json();
    const id = Number(memberId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 });
    }

    await ensureSchema(sql);

    const [config] = await sql`SELECT voting_open FROM election_config WHERE id = 1`;
    if (!config?.voting_open) {
      return NextResponse.json(
        { error: 'A votação ainda não foi liberada. Libere o quórum antes de entregar cédulas.' },
        { status: 409 }
      );
    }

    // Atômico: só marca se está conferido e ainda não votou (app ou papel)
    const marked = await sql`
      UPDATE members
      SET has_voted = true, voted_on_paper = true
      WHERE id = ${id} AND checked_in = true AND has_voted = false
      RETURNING id
    `;
    if (marked.length === 0) {
      const [m] = await sql`SELECT checked_in, has_voted FROM members WHERE id = ${id}`;
      const error = !m
        ? 'Membro não encontrado.'
        : !m.checked_in
        ? 'Confira a presença do membro no livro antes de entregar a cédula.'
        : 'Este membro já votou (pelo celular ou em papel).';
      return NextResponse.json({ error }, { status: 409 });
    }

    const [counts] = await sql`
      SELECT
        (SELECT count(*)::int FROM members WHERE voted_on_paper) AS handed,
        (SELECT count(*)::int FROM votes WHERE receipt LIKE 'PAPEL-%') AS counted
    `;

    await publishElectionEvent({
      type: 'PAPER_HANDED',
      memberId: id,
      paperHanded: counts.handed,
      paperCounted: counts.counted,
    });

    return NextResponse.json({ success: true, paperHanded: counts.handed, paperCounted: counts.counted });
  } catch (err) {
    console.error('Error handing paper ballot:', err);
    return NextResponse.json({ error: 'Erro ao registrar entrega da cédula' }, { status: 500 });
  }
}
