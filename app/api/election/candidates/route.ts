import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { cleanDisplayName } from '@/lib/election-rules';

const LOCKED_MSG =
  'Votação em andamento: candidatos, vagas e rol ficam bloqueados. Bloqueie a votação na Mesa antes de alterar.';

function intInRange(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

async function isVotingOpen() {
  const [config] = await sql`SELECT voting_open FROM election_config WHERE id = 1`;
  return !!config?.voting_open;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();

    if (await isVotingOpen()) {
      return NextResponse.json({ error: LOCKED_MSG }, { status: 409 });
    }

    // Vagas / total de comungantes
    if (body.vagasDiac !== undefined || body.vagasPresb !== undefined || body.totalComungantes !== undefined) {
      const vagasDiac = body.vagasDiac !== undefined ? intInRange(body.vagasDiac, 1, 50) : undefined;
      const vagasPresb = body.vagasPresb !== undefined ? intInRange(body.vagasPresb, 1, 50) : undefined;
      const total = body.totalComungantes !== undefined ? intInRange(body.totalComungantes, 1, 5000) : undefined;

      if (vagasDiac === null || vagasPresb === null) {
        return NextResponse.json({ error: 'Número de vagas deve ser um inteiro entre 1 e 50.' }, { status: 400 });
      }
      if (total === null) {
        return NextResponse.json({ error: 'Total de comungantes deve ser um inteiro entre 1 e 5000.' }, { status: 400 });
      }

      if (vagasDiac !== undefined) await sql`UPDATE election_config SET vagas_diac = ${vagasDiac} WHERE id = 1`;
      if (vagasPresb !== undefined) await sql`UPDATE election_config SET vagas_presb = ${vagasPresb} WHERE id = 1`;
      if (total !== undefined) await sql`UPDATE election_config SET total_comungantes = ${total} WHERE id = 1`;

      await publishElectionEvent({
        type: 'VACANCIES_UPDATED',
        vagasDiac,
        vagasPresb,
        totalComungantes: total,
      });

      return NextResponse.json({ success: true });
    }

    // Adicionar candidato
    const { role, name } = body;
    if (role !== 'diac' && role !== 'presb') {
      return NextResponse.json({ error: 'Cargo inválido (diac ou presb).' }, { status: 400 });
    }
    const cleanName = typeof name === 'string' ? cleanDisplayName(name) : '';
    if (cleanName.length < 2 || cleanName.length > 150) {
      return NextResponse.json({ error: 'Nome do candidato inválido.' }, { status: 400 });
    }

    const id = `${role[0]}${Date.now()}`;
    await sql`INSERT INTO candidates (id, role, name, weight) VALUES (${id}, ${role}, ${cleanName}, 2)`;

    await publishElectionEvent({ type: 'CANDIDATE_ADDED', candidate: { id, role, name: cleanName } });

    return NextResponse.json({ success: true, id, name: cleanName, role });
  } catch (err: any) {
    console.error('Error in candidates route:', err);
    return NextResponse.json({ error: 'Erro ao salvar candidato' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID do candidato obrigatório' }, { status: 400 });
    }

    if (await isVotingOpen()) {
      return NextResponse.json({ error: LOCKED_MSG }, { status: 409 });
    }

    const [hasVotes] = await sql`SELECT 1 FROM vote_candidates WHERE candidate_id = ${id} LIMIT 1`;
    if (hasVotes) {
      return NextResponse.json(
        { error: 'Este candidato já recebeu votos e não pode ser removido.' },
        { status: 409 }
      );
    }

    await sql`UPDATE candidates SET active = false WHERE id = ${id}`;
    await publishElectionEvent({ type: 'CANDIDATE_REMOVED', candidateId: id });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error removing candidate:', err);
    return NextResponse.json({ error: 'Erro ao remover candidato' }, { status: 500 });
  }
}
