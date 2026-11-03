import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Mesa' }, { status: 401 });
    }

    const { name, phone } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nome completo obrigatório' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanPhone = (phone || '(87) 9 0000-0000').trim();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
    });

    const inserted = await sql`
      INSERT INTO members (name, phone, checked_in, checked_at, has_voted)
      VALUES (${cleanName}, ${cleanPhone}, true, ${timeStr}, false)
      RETURNING id, name, phone, checked_in, checked_at, has_voted
    `;

    const member = inserted[0];

    const countRow = await sql`SELECT count(*)::int as total FROM members WHERE checked_in = true`;

    const payload = {
      id: member.id,
      name: member.name,
      phone: member.phone,
      checked: true,
      hasVoted: false,
      time: member.checked_at,
    };

    await publishElectionEvent({
      type: 'MEMBER_REGISTERED',
      member: payload,
    });

    await publishElectionEvent({
      type: 'MEMBER_CHECKED',
      memberId: member.id,
      checked: true,
      confirmedCount: countRow[0]?.total || 0,
    });

    return NextResponse.json({
      success: true,
      member: payload,
      confirmedCount: countRow[0]?.total || 0,
    });
  } catch (err: any) {
    console.error('Error adding member at mesa:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar membro manual' }, { status: 500 });
  }
}
