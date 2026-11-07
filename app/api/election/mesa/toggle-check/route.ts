import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { syncPublishedQuorum } from '@/lib/election-rules';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Sessão da Mesa expirada. Entre novamente.' }, { status: 401 });
    }

    const { memberId, checked } = await req.json();
    const id = Number(memberId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 });
    }

    const [member] = await sql`SELECT has_voted FROM members WHERE id = ${id}`;
    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
    }
    if (!checked && member.has_voted) {
      return NextResponse.json(
        { error: 'Este membro já votou; a conferência não pode ser desfeita.' },
        { status: 409 }
      );
    }

    await sql`UPDATE members SET checked_in = ${!!checked} WHERE id = ${id}`;

    const [countRow] = await sql`SELECT count(*)::int AS total FROM members WHERE checked_in = true`;
    const confirmedCount = countRow?.total || 0;

    await publishElectionEvent({ type: 'MEMBER_CHECKED', memberId: id, checked: !!checked, confirmedCount });

    const published = await syncPublishedQuorum(sql);
    if (published !== null) {
      await publishElectionEvent({ type: 'QUORUM_UPDATED', published });
    }

    return NextResponse.json({ success: true, confirmedCount, published });
  } catch (err: any) {
    console.error('Error toggling member check:', err);
    return NextResponse.json({ error: 'Erro ao atualizar presença' }, { status: 500 });
  }
}
