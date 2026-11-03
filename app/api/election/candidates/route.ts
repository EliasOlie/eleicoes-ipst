import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Check if updating vacancies
    if (body.vagasDiac !== undefined || body.vagasPresb !== undefined) {
      if (body.vagasDiac !== undefined) {
        await sql`UPDATE election_config SET vagas_diac = ${body.vagasDiac} WHERE id = 1`;
      }
      if (body.vagasPresb !== undefined) {
        await sql`UPDATE election_config SET vagas_presb = ${body.vagasPresb} WHERE id = 1`;
      }

      await publishElectionEvent({
        type: 'VACANCIES_UPDATED',
        vagasDiac: body.vagasDiac,
        vagasPresb: body.vagasPresb,
      });

      return NextResponse.json({ success: true });
    }

    // Add candidate
    const { role, name } = body;
    if (!role || !name) {
      return NextResponse.json({ error: 'Cargo e nome são obrigatórios' }, { status: 400 });
    }

    const id = `${role[0]}${Date.now()}`;
    await sql`
      INSERT INTO candidates (id, role, name, weight)
      VALUES (${id}, ${role}, ${name.trim()}, 2)
    `;

    await publishElectionEvent({
      type: 'CANDIDATE_ADDED',
      candidate: { id, role, name: name.trim() },
    });

    return NextResponse.json({ success: true, id, name: name.trim(), role });
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
    if (!id) {
      return NextResponse.json({ error: 'ID do candidato obrigatório' }, { status: 400 });
    }

    await sql`
      UPDATE candidates
      SET active = false
      WHERE id = ${id}
    `;

    await publishElectionEvent({
      type: 'CANDIDATE_REMOVED',
      candidateId: id,
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('Error removing candidate:', err);
    return NextResponse.json({ error: 'Erro ao remover candidato' }, { status: 500 });
  }
}
