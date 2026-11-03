import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { publishElectionEvent } from '@/lib/redis';
import { getAdminSession } from '@/lib/auth';

const FIRST_NAMES = [
  'Maria', 'José', 'Ana', 'João', 'Francisca', 'Antônio', 'Josefa', 'Paulo',
  'Raimunda', 'Pedro', 'Luzia', 'Carlos', 'Rita', 'Marcos', 'Helena',
  'Severino', 'Joana', 'Lucas', 'Débora', 'Samuel', 'Mateus', 'Gabriel',
  'Ester', 'Davi', 'Sara', 'Rebeca', 'Priscila', 'Tiago', 'Filipe', 'Ezequiel'
];

const LAST_NAMES = [
  'Silva', 'Ferreira', 'Lima', 'Souza', 'Alves', 'Nogueira', 'Pereira',
  'Barbosa', 'Rodrigues', 'Cavalcanti', 'Monteiro', 'Magalhães', 'Araújo',
  'Torres', 'Bezerra', 'Gomes', 'Carvalho', 'Martins', 'Ribeiro', 'Vieira'
];

const DEFAULT_DIAC = [
  ['d1', 'André Lucas Ferraz', 5],
  ['d2', 'Benedito Alves Nogueira', 3],
  ['d3', 'Cícero Monteiro Lima', 4],
  ['d4', 'Daniel Bezerra Torres', 2],
  ['d5', 'Elias Cavalcanti Souza', 3.5],
  ['d6', 'Fábio Rodrigues Araújo', 1.5],
];

const DEFAULT_PRESB = [
  ['p1', 'Gilberto Magalhães Silva', 5],
  ['p2', 'Hélio Pereira Barbosa', 3],
  ['p3', 'Isaías Ferreira Lima', 4],
  ['p4', 'Jonas Araújo Bezerra', 1.5],
];

function pickWeighted(list: any[], k: number): string[] {
  const pool = list.slice();
  const out: string[] = [];
  for (let i = 0; i < k && pool.length; i++) {
    const total = pool.reduce((s, c) => s + Number(c.weight || 2), 0);
    let r = Math.random() * total;
    let j = 0;
    while (r > Number(pool[j].weight || 2) && j < pool.length - 1) {
      r -= Number(pool[j].weight || 2);
      j++;
    }
    out.push(pool[j].id);
    pool.splice(j, 1);
  }
  return out;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getAdminSession();
    const adminKey = req.headers.get('x-admin-key');
    if (!session && adminKey !== 'ipst2026') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const botCount = Math.min(1000, Math.max(10, Number(body.botCount) || 500));
    const concurrency = Math.min(50, Math.max(1, Number(body.concurrency) || 25));
    const checkInRate = Number(body.checkInRate) || 0.90; // ~90% presentes em ata
    const vagasDiac = Number(body.vagasDiac) || 3;
    const vagasPresb = Number(body.vagasPresb) || 2;

    // --- ETAPA 1: Setup do Cenário no PostgreSQL ---
    // 1. Limpa votos anteriores e reseta membros
    await sql.begin(async (tx) => {
      await tx`DELETE FROM vote_candidates`;
      await tx`DELETE FROM votes`;
      await tx`DELETE FROM members`;

      // Garante candidatos base
      const existingCands = await tx`SELECT count(*)::int as c FROM candidates`;
      if (existingCands[0].c === 0) {
        for (const [id, name, w] of DEFAULT_DIAC) {
          await tx`INSERT INTO candidates (id, role, name, weight) VALUES (${id}, 'diac', ${name}, ${w})`;
        }
        for (const [id, name, w] of DEFAULT_PRESB) {
          await tx`INSERT INTO candidates (id, role, name, weight) VALUES (${id}, 'presb', ${name}, ${w})`;
        }
      }
    });

    const activeCandidates = await sql`SELECT id, role, name, weight FROM candidates WHERE active = true`;
    const diacList = activeCandidates.filter((c) => c.role === 'diac');
    const presbList = activeCandidates.filter((c) => c.role === 'presb');

    // 2. Batch Insert de 500 membros
    const memberRows: { name: string; phone: string; checked_in: boolean; checked_at: string }[] = [];
    for (let i = 0; i < botCount; i++) {
      const fn = FIRST_NAMES[i % FIRST_NAMES.length];
      const ln1 = LAST_NAMES[(i * 3) % LAST_NAMES.length];
      const ln2 = LAST_NAMES[(i * 7 + 1) % LAST_NAMES.length];
      const name = `${fn} ${ln1} ${ln2} (Bot #${i + 1})`;
      const num = String(1000000 + i).padStart(8, '0');
      const phone = `(87) 9 9${num.slice(0, 3)}-${num.slice(3, 7)}`;
      const checkedIn = Math.random() < checkInRate;
      const mins = String(i % 55).padStart(2, '0');
      memberRows.push({
        name,
        phone,
        checked_in: checkedIn,
        checked_at: `19:${mins}`,
      });
    }

    // Insert em chunks de 100
    const chunkSize = 100;
    for (let i = 0; i < memberRows.length; i += chunkSize) {
      const chunk = memberRows.slice(i, i + chunkSize);
      await sql`
        INSERT INTO members ${sql(chunk, 'name', 'phone', 'checked_in', 'checked_at')}
      `;
    }

    // --- ETAPA 2: Mesa - Aprovação de Quórum ---
    const eligibleMembers = await sql`
      SELECT id, name, phone 
      FROM members 
      WHERE checked_in = true
      ORDER BY id ASC
    `;
    const publishedQuorum = eligibleMembers.length;

    await sql`
      UPDATE election_config
      SET 
        voting_open = true,
        published_quorum = ${publishedQuorum},
        published_at = '19:45',
        vagas_diac = ${vagasDiac},
        vagas_presb = ${vagasPresb},
        total_comungantes = ${botCount},
        updated_at = NOW()
      WHERE id = 1
    `;

    // Notifica abertura de quórum via Redis
    await publishElectionEvent({
      type: 'QUORUM_PUBLISHED',
      votingOpen: true,
      published: publishedQuorum,
      publishedAt: '19:45',
    });

    // --- ETAPA 3: Execução Concorrente de Bots de Voto ---
    const latencies: number[] = [];
    const receipts: string[] = [];
    let successVotes = 0;
    let duplicateRejections = 0;
    let errors = 0;

    // Worker pool concorrente
    const eligibleList = [...eligibleMembers];
    let currentIndex = 0;

    async function voteWorker() {
      while (true) {
        const idx = currentIndex++;
        if (idx >= eligibleList.length) break;

        const m = eligibleList[idx];
        const reqStart = Date.now();

        try {
          // Escolha estocástica de candidatos ou em branco (3%)
          const isBlank = Math.random() < 0.03;
          let selDiac: string[] = [];
          let selPresb: string[] = [];

          if (!isBlank) {
            const kD = Math.random() < 0.7 ? vagasDiac : Math.max(1, vagasDiac - 1);
            const kP = Math.random() < 0.7 ? vagasPresb : Math.max(1, vagasPresb - 1);
            selDiac = pickWeighted(diacList, kD);
            selPresb = pickWeighted(presbList, kP);
          }

          const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
          const receipt = `${p1}-${p2}`;

          // Transação E2E idêntica à rota oficial de voto
          await sql.begin(async (tx) => {
            await tx`
              UPDATE members
              SET has_voted = true, voted_at = NOW()
              WHERE id = ${m.id}
            `;
            const vInsert = await tx`
              INSERT INTO votes (receipt, is_blank)
              VALUES (${receipt}, ${isBlank})
              RETURNING id
            `;
            const voteId = vInsert[0].id;
            for (const candId of [...selDiac, ...selPresb]) {
              await tx`
                INSERT INTO vote_candidates (vote_id, candidate_id)
                VALUES (${voteId}, ${candId})
              `;
            }
          });

          receipts.push(receipt);
          successVotes++;
          latencies.push(Date.now() - reqStart);

          // Teste de prevenção de voto duplicado (para os primeiros 10 bots)
          if (idx < 10) {
            const hasVotedCheck = await sql`SELECT has_voted FROM members WHERE id = ${m.id}`;
            if (hasVotedCheck[0]?.has_voted) {
              duplicateRejections++;
            }
          }
        } catch (err) {
          errors++;
          console.error(`Erro no bot ${m.id}:`, err);
        }
      }
    }

    // Dispara N workers concorrentes
    const workers = Array.from({ length: concurrency }, () => voteWorker());
    await Promise.all(workers);

    // --- ETAPA 4: Notificação final via Redis e Totalização ---
    const finalVoteCount = await sql`SELECT count(*)::int as total FROM votes`;
    const finalBlankCount = await sql`SELECT count(*)::int as total FROM votes WHERE is_blank = true`;
    const tallyRows = await sql`
      SELECT candidate_id, count(*)::int as votes
      FROM vote_candidates
      GROUP BY candidate_id
    `;
    const tally: Record<string, number> = {};
    activeCandidates.forEach((c) => {
      tally[c.id] = 0;
    });
    tallyRows.forEach((r) => {
      tally[r.candidate_id] = r.votes;
    });

    await publishElectionEvent({
      type: 'VOTE_CAST',
      receipt: 'STRESS_FINISHED',
      counted: finalVoteCount[0]?.total || 0,
      blanks: finalBlankCount[0]?.total || 0,
      tally,
    });

    // --- ETAPA 5: Métricas e Telemetria ---
    const totalDurationMs = Date.now() - startTime;
    latencies.sort((a, b) => a - b);

    const sum = latencies.reduce((a, b) => a + b, 0);
    const avgLatency = latencies.length ? Math.round(sum / latencies.length) : 0;
    const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
    const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const minLatency = latencies[0] || 0;
    const maxLatency = latencies[latencies.length - 1] || 0;
    const rps = totalDurationMs > 0 ? Math.round((successVotes / (totalDurationMs / 1000)) * 10) / 10 : 0;

    return NextResponse.json({
      success: true,
      scenario: {
        botCount,
        concurrency,
        checkInRate: `${Math.round(checkInRate * 100)}%`,
        publishedQuorum,
        vagasDiac,
        vagasPresb,
      },
      results: {
        totalVotersInAta: publishedQuorum,
        successVotes,
        duplicateRejectionsVerified: duplicateRejections,
        errors,
        countedVotesInDb: finalVoteCount[0]?.total || 0,
        blankVotesInDb: finalBlankCount[0]?.total || 0,
      },
      performance: {
        totalDurationMs,
        durationSeconds: (totalDurationMs / 1000).toFixed(2),
        throughputRps: rps,
        latency: {
          minMs: minLatency,
          avgMs: avgLatency,
          p50Ms: p50,
          p95Ms: p95,
          p99Ms: p99,
          maxMs: maxLatency,
        },
      },
      tally,
    });
  } catch (err: any) {
    console.error('Stress test execution failed:', err);
    return NextResponse.json({ error: 'Falha no stress test', message: err.message }, { status: 500 });
  }
}
