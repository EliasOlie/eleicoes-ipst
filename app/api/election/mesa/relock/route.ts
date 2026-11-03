import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await sql`
      UPDATE election_config
      SET voting_open = false, updated_at = NOW()
      WHERE id = 1
    `;

    await publishElectionEvent({
      type: 'VOTING_RELOCKED',
      votingOpen: false,
    });

    return NextResponse.json({ success: true, votingOpen: false });
  } catch (err: any) {
    console.error('Error relocking election:', err);
    return NextResponse.json({ error: 'Erro ao bloquear votação' }, { status: 500 });
  }
}
