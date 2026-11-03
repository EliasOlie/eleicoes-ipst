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

    const { memberId, checked } = await req.json();

    if (memberId === undefined) {
      return NextResponse.json({ error: 'memberId obrigatório' }, { status: 400 });
    }

    await sql`
      UPDATE members
      SET checked_in = ${!!checked}
      WHERE id = ${memberId}
    `;

    const countRow = await sql`SELECT count(*)::int as total FROM members WHERE checked_in = true`;

    await publishElectionEvent({
      type: 'MEMBER_CHECKED',
      memberId,
      checked: !!checked,
      confirmedCount: countRow[0]?.total || 0,
    });

    return NextResponse.json({
      success: true,
      confirmedCount: countRow[0]?.total || 0,
    });
  } catch (err: any) {
    console.error('Error toggling member check:', err);
    return NextResponse.json({ error: 'Erro ao atualizar presença' }, { status: 500 });
  }
}
