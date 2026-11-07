import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { publishElectionEvent } from '@/lib/redis';
import {
  SelectionError,
  computeTally,
  ensureSchema,
  newReceipt,
  normalizeName,
  phoneKey,
  validateSelection,
} from '@/lib/election-rules';

class VoteRejected extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { memberId, name, phone, selection } = await req.json();

    const id = Number(memberId);
    if (!Number.isInteger(id) || id <= 0 || typeof name !== 'string' || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Identificação necessária. Saia e registre sua presença novamente.' },
        { status: 400 }
      );
    }

    // 1. Votação liberada?
    const [config] = await sql`SELECT voting_open FROM election_config WHERE id = 1`;
    if (!config?.voting_open) {
      return NextResponse.json(
        { error: 'A votação ainda não foi liberada pela mesa.' },
        { status: 403 }
      );
    }

    // 2. Membro do cadastro, conferindo nome E telefone
    const [member] = await sql`
      SELECT id, name, phone, checked_in, has_voted FROM members WHERE id = ${id}
    `;
    if (
      !member ||
      normalizeName(member.name) !== normalizeName(name) ||
      !phoneKey(phone) ||
      phoneKey(member.phone) !== phoneKey(phone)
    ) {
      return NextResponse.json(
        { error: 'Identificação não confere. Saia e registre sua presença novamente.' },
        { status: 403 }
      );
    }
    if (!member.checked_in) {
      return NextResponse.json(
        { error: 'Voto não autorizado. Seu nome ainda não foi conferido no livro de presença de membros comungantes pela Mesa.' },
        { status: 403 }
      );
    }
    if (member.has_voted) {
      return NextResponse.json(
        { error: 'Este membro já exerceu seu direito de voto. Acesso encerrado.' },
        { status: 403 }
      );
    }

    // 3. Cédula válida (sem repetidos, cargo certo, até o nº de vagas)
    await ensureSchema(sql);
    const { diac, presb } = await validateSelection(sql, selection);
    const isBlank = diac.length === 0 && presb.length === 0;
    const receipt = newReceipt();

    // 4. Transação: a marcação "já votou" é atômica — só uma requisição
    //    simultânea consegue virar has_voted de false para true.
    await sql.begin(async (tx) => {
      // SIGILO: sem horário no membro nem na cédula (impede cruzar quem votou em quem)
      const marked = await tx`
        UPDATE members
        SET has_voted = true
        WHERE id = ${id} AND has_voted = false AND checked_in = true
        RETURNING id
      `;
      if (marked.length === 0) {
        throw new VoteRejected('Este membro já exerceu seu direito de voto. Acesso encerrado.', 403);
      }

      const [vote] = await tx`
        INSERT INTO votes (receipt, is_blank, created_at) VALUES (${receipt}, ${isBlank}, NULL) RETURNING id
      `;
      for (const candidateId of [...diac, ...presb]) {
        await tx`INSERT INTO vote_candidates (vote_id, candidate_id) VALUES (${vote.id}, ${candidateId})`;
      }
    });

    // 5. Placar ao vivo via Redis
    const { counted, blanks, nulls, tally } = await computeTally(sql);
    await publishElectionEvent({ type: 'VOTE_CAST', counted, blanks, nulls, tally });

    return NextResponse.json({ success: true, receipt });
  } catch (err: any) {
    if (err instanceof VoteRejected) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof SelectionError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('Error processing vote:', err);
    return NextResponse.json({ error: 'Erro ao registrar voto. Tente novamente.' }, { status: 500 });
  }
}
