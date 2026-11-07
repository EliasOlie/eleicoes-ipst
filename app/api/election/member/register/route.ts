import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { publishElectionEvent } from '@/lib/redis';
import { cleanDisplayName, normalizeName, phoneKey } from '@/lib/election-rules';

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    const displayName = typeof name === 'string' ? cleanDisplayName(name) : '';
    if (displayName.length < 3 || displayName.length > 150) {
      return NextResponse.json(
        { error: 'Informe seu nome completo conforme consta no rol de membros.' },
        { status: 400 }
      );
    }

    const key = typeof phone === 'string' ? phoneKey(phone) : '';
    if (!key) {
      return NextResponse.json(
        { error: 'Informe um número de telefone/WhatsApp válido com DDD.' },
        { status: 400 }
      );
    }

    const timeStr = new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
    });
    const normName = normalizeName(displayName);

    // Identidade = nome E telefone. Casais que dividem o mesmo WhatsApp são
    // pessoas diferentes; homônimos com telefones diferentes também.
    // O lock serializa cadastros simultâneos (toque duplo) para não duplicar.
    const result = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(7001)`;
      const rows = await tx`
        SELECT id, name, phone, checked_in, checked_at, has_voted FROM members
      `;
      const existing = rows.find(
        (m) => normalizeName(m.name) === normName && phoneKey(m.phone) === key
      );
      if (existing) return { member: existing, created: false };

      const [inserted] = await tx`
        INSERT INTO members (name, phone, checked_in, checked_at, has_voted)
        VALUES (${displayName}, ${phone.trim()}, false, ${timeStr}, false)
        RETURNING id, name, phone, checked_in, checked_at, has_voted
      `;
      return { member: inserted, created: true };
    });

    const m = result.member;
    if (m.has_voted) {
      return NextResponse.json(
        { error: 'Este membro já exerceu seu direito de voto nesta assembleia.' },
        { status: 403 }
      );
    }

    const memberPayload = {
      id: m.id,
      name: m.name,
      phone: m.phone,
      checked: !!m.checked_in,
      hasVoted: !!m.has_voted,
      time: m.checked_at || timeStr,
    };

    if (result.created) {
      // Evento público (SSE): sem telefone. A Mesa busca o telefone pela API autenticada.
      await publishElectionEvent({
        type: 'MEMBER_REGISTERED',
        member: { id: m.id, name: m.name, checked: false, time: memberPayload.time },
      });
    }

    return NextResponse.json({ success: true, member: memberPayload });
  } catch (err: any) {
    console.error('Error registering member:', err);
    return NextResponse.json(
      { error: 'Erro ao registrar membro. Tente novamente.' },
      { status: 500 }
    );
  }
}
