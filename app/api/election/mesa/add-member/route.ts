import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { cleanDisplayName, normalizeName, phoneKey, syncPublishedQuorum } from '@/lib/election-rules';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Sessão da Mesa expirada. Entre novamente.' }, { status: 401 });
    }

    const { name, phone } = await req.json();

    const displayName = typeof name === 'string' ? cleanDisplayName(name) : '';
    if (displayName.length < 3 || displayName.length > 150) {
      return NextResponse.json({ error: 'Nome completo obrigatório' }, { status: 400 });
    }
    // Sem telefone = membro só vota em cédula de papel (não consegue se identificar no app).
    const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
    if (cleanPhone && !phoneKey(cleanPhone)) {
      return NextResponse.json({ error: 'Telefone inválido (informe com DDD) ou deixe em branco.' }, { status: 400 });
    }

    const timeStr = new Date().toLocaleTimeString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit',
      minute: '2-digit',
    });

    const normName = normalizeName(displayName);
    const key = phoneKey(cleanPhone);

    const { member, created } = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(7001)`;
      const rows = await tx`SELECT id, name, phone, checked_in, checked_at, has_voted FROM members`;
      const existing = rows.find((m) => normalizeName(m.name) === normName && phoneKey(m.phone) === key);
      if (existing) {
        const [updated] = await tx`
          UPDATE members SET checked_in = true WHERE id = ${existing.id}
          RETURNING id, name, phone, checked_in, checked_at, has_voted
        `;
        return { member: updated, created: false };
      }
      const [inserted] = await tx`
        INSERT INTO members (name, phone, checked_in, checked_at, has_voted)
        VALUES (${displayName}, ${cleanPhone}, true, ${timeStr}, false)
        RETURNING id, name, phone, checked_in, checked_at, has_voted
      `;
      return { member: inserted, created: true };
    });

    const [countRow] = await sql`SELECT count(*)::int AS total FROM members WHERE checked_in = true`;
    const confirmedCount = countRow?.total || 0;

    const payload = {
      id: member.id,
      name: member.name,
      phone: member.phone,
      checked: true,
      hasVoted: !!member.has_voted,
      time: member.checked_at,
    };

    if (created) {
      await publishElectionEvent({
        type: 'MEMBER_REGISTERED',
        member: { id: member.id, name: member.name, checked: true, time: member.checked_at },
      });
    }
    await publishElectionEvent({ type: 'MEMBER_CHECKED', memberId: member.id, checked: true, confirmedCount });

    const published = await syncPublishedQuorum(sql);
    if (published !== null) {
      await publishElectionEvent({ type: 'QUORUM_UPDATED', published });
    }

    return NextResponse.json({ success: true, member: payload, confirmedCount, alreadyExisted: !created });
  } catch (err: any) {
    console.error('Error adding member at mesa:', err);
    return NextResponse.json({ error: 'Erro ao cadastrar membro manual' }, { status: 500 });
  }
}
