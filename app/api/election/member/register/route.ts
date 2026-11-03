import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { publishElectionEvent } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Informe seu nome completo conforme consta no rol de membros.' },
        { status: 400 }
      );
    }

    const cleanPhoneDigits = (phone || '').replace(/\D/g, '');
    if (cleanPhoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Informe um número de telefone/WhatsApp válido com DDD.' },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const now = new Date();
    // Brazil/Recife timezone (UTC-3)
    const timeStr = now.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
    });

    // 1. Check if member already exists by name or phone
    const existing = await sql`
      SELECT id, name, phone, checked_in, checked_at, has_voted
      FROM members
      WHERE LOWER(name) = ${cleanName.toLowerCase()} 
         OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', '') LIKE ${'%' + cleanPhoneDigits.slice(-8)}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const m = existing[0];
      if (m.has_voted) {
        return NextResponse.json(
          { error: 'Este membro já exerceu seu direito de voto nesta assembleia.' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        member: {
          id: m.id,
          name: m.name,
          phone: m.phone,
          checked: !!m.checked_in,
          hasVoted: !!m.has_voted,
          time: m.checked_at || timeStr,
        },
      });
    }

    // 2. Insert new member as pending verification
    const inserted = await sql`
      INSERT INTO members (name, phone, checked_in, checked_at, has_voted)
      VALUES (${cleanName}, ${phone.trim()}, false, ${timeStr}, false)
      RETURNING id, name, phone, checked_in, checked_at, has_voted
    `;

    const newMember = inserted[0];

    const memberPayload = {
      id: newMember.id,
      name: newMember.name,
      phone: newMember.phone,
      checked: !!newMember.checked_in,
      hasVoted: !!newMember.has_voted,
      time: newMember.checked_at,
    };

    // Broadcast to Mesa via Redis Pub/Sub
    await publishElectionEvent({
      type: 'MEMBER_REGISTERED',
      member: memberPayload,
    });

    return NextResponse.json({
      success: true,
      member: memberPayload,
    });
  } catch (err: any) {
    console.error('Error registering member:', err);
    return NextResponse.json(
      { error: 'Erro ao registrar membro. Tente novamente.' },
      { status: 500 }
    );
  }
}
