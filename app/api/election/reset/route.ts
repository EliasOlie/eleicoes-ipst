import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { publishElectionEvent } from '@/lib/redis';
import { ensureSchema } from '@/lib/election-rules';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Reset votes and mark members has_voted = false
    await ensureSchema(sql);
    await sql.begin(async (tx) => {
      await tx`DELETE FROM vote_candidates`;
      await tx`DELETE FROM votes`;
      await tx`UPDATE members SET has_voted = false, voted_on_paper = false, voted_at = NULL`;
    });

    const candidates = await sql`SELECT id FROM candidates WHERE active = true`;
    const emptyTally: Record<string, number> = {};
    candidates.forEach((c) => {
      emptyTally[c.id] = 0;
    });

    await publishElectionEvent({
      type: 'VOTE_CAST',
      receipt: 'RESET',
      counted: 0,
      blanks: 0,
      nulls: 0,
      tally: emptyTally,
    });

    return NextResponse.json({ success: true, counted: 0, blanks: 0, tally: emptyTally });
  } catch (err: any) {
    console.error('Error resetting votes:', err);
    return NextResponse.json({ error: 'Erro ao reiniciar apuração' }, { status: 500 });
  }
}
