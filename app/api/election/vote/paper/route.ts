import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { SelectionError, computeTally, ensureSchema, validateSelection } from '@/lib/election-rules';

class PaperLimitError extends Error {}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Mesa e Escrutinadores' }, { status: 401 });
    }

    const { selection, nullBallot } = await req.json();

    await ensureSchema(sql);

    // Cédula nula (anulada pela Mesa): sem votos para ninguém, mas conta como
    // cédula apurada — entra na base dos 50%+1.
    const isNull = nullBallot === true;
    const { diac: diacVotes, presb: presbVotes } = isNull
      ? { diac: [] as string[], presb: [] as string[] }
      : await validateSelection(sql, selection);
    const isBlank = !isNull && diacVotes.length === 0 && presbVotes.length === 0;

    let receipt = '';

    await sql.begin(async (tx) => {
      // Serializa lançamentos simultâneos (vários escrutinadores) para a
      // numeração PAPEL-00X não colidir.
      await tx`SELECT pg_advisory_xact_lock(7002)`;

      // 1. Regra de consistência: apuradas ≤ entregues pela Mesa
      const [counts] = await tx`
        SELECT
          (SELECT count(*)::int FROM votes WHERE receipt LIKE 'PAPEL-%') AS counted,
          (SELECT count(*)::int FROM members WHERE voted_on_paper) AS handed
      `;
      if (counts.counted >= counts.handed) {
        throw new PaperLimitError(
          `Todas as ${counts.handed} cédula(s) de papel entregues já foram apuradas. ` +
            'Registre a entrega na lista da Mesa (botão "Papel" ao lado do nome) antes de apurar outra.'
        );
      }
      const nextNum = counts.counted + 1;
      receipt = `PAPEL-${String(nextNum).padStart(3, '0')}`;

      // 2. Insert vote
      const voteInsert = await tx`
        INSERT INTO votes (receipt, is_blank, is_null, created_at)
        VALUES (${receipt}, ${isBlank}, ${isNull}, NULL)
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

    // 4. Placar atualizado
    const { counted, blanks, nulls, tally } = await computeTally(sql);
    const [paperCountRow] = await sql`SELECT count(*)::int as total FROM votes WHERE receipt LIKE 'PAPEL-%'`;
    const paperCounted = paperCountRow?.total || 0;

    // 5. Broadcast in real time
    await publishElectionEvent({ type: 'VOTE_CAST', counted, blanks, nulls, tally, paperCounted });

    return NextResponse.json({
      success: true,
      receipt,
      isNull,
      totalCounted: counted,
      paperCount: paperCounted,
      blanks,
      nulls,
    });
  } catch (err) {
    if (err instanceof SelectionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof PaperLimitError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
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
      SELECT v.id, v.receipt, v.is_blank, v.is_null,
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
        isNull: p.is_null,
        candidateIds: p.candidate_ids || [],
      })),
      totalPaper: paperVotes.length,
    });
  } catch (err: any) {
    console.error('Error fetching paper votes:', err);
    return NextResponse.json({ error: 'Erro ao buscar cédulas de papel' }, { status: 500 });
  }
}
