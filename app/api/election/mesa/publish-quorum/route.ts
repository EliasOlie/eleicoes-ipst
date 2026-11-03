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
    const confirmedRow = await sql`
      SELECT count(*)::int as total FROM members WHERE checked_in = true
    `;
    const confirmedCount = confirmedRow[0]?.total || 0;

    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = body.publishedAt || `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await sql`
      UPDATE election_config
      SET 
        voting_open = true,
        published_quorum = ${confirmedCount},
        published_at = ${timeStr},
        updated_at = NOW()
      WHERE id = 1
    `;

    await publishElectionEvent({
      type: 'QUORUM_PUBLISHED',
      votingOpen: true,
      published: confirmedCount,
      publishedAt: timeStr,
    });

    return NextResponse.json({
      success: true,
      votingOpen: true,
      published: confirmedCount,
      publishedAt: timeStr,
    });
  } catch (err: any) {
    console.error('Error publishing quorum:', err);
    return NextResponse.json({ error: 'Erro ao aprovar quórum' }, { status: 500 });
  }
}
