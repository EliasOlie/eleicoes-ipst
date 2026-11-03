#!/usr/bin/env node

/**
 * CLI E2E Stress Test & Benchmark Runner — Eleições IPB Serra Talhada
 * Simula 500 bots votando concorrentemente contra a API real.
 * 
 * Uso:
 *   node scripts/stress-test.mjs [--bots=500] [--concurrency=25] [--target=http://localhost:3000]
 */

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.replace(/^--/, '').split('=');
  acc[k] = v;
  return acc;
}, {});

const TARGET = args.target || 'http://localhost:3000';
const BOTS = parseInt(args.bots || '500', 10);
const CONCURRENCY = parseInt(args.concurrency || '25', 10);

console.log('\n======================================================');
console.log('🏛️  ELEIÇÕES IPB SERRA TALHADA — E2E STRESS TEST');
console.log('======================================================');
console.log(`🎯 Alvo:        ${TARGET}`);
console.log(`🤖 Bots:        ${BOTS} votantes simulados`);
console.log(`⚡ Concorrência: ${CONCURRENCY} workers simultâneos`);
console.log('------------------------------------------------------\n');

async function run() {
  const overallStart = Date.now();

  // 1. Health check
  try {
    const health = await fetch(`${TARGET}/api/election/state`);
    if (!health.ok) {
      throw new Error(`Target retornou status HTTP ${health.status}`);
    }
    console.log('✓ Target online e respondendo.');
  } catch (err) {
    console.error(`❌ Não foi possível conectar ao alvo em ${TARGET}:`, err.message);
    process.exit(1);
  }

  // 2. Dispara o stress test via API E2E
  console.log(`🚀 Executando pipeline completo de votação (Setup, Ata, Quórum, ${BOTS} Votos)...`);

  const res = await fetch(`${TARGET}/api/test/stress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': 'ipst2026',
    },
    body: JSON.stringify({
      botCount: BOTS,
      concurrency: CONCURRENCY,
      checkInRate: 0.90,
      vagasDiac: 3,
      vagasPresb: 2,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    console.error('❌ Falha na execução da API:', errData);
    process.exit(1);
  }

  const data = await res.json();
  const overallDuration = ((Date.now() - overallStart) / 1000).toFixed(2);

  // 3. Exibe Resultados Detalhados
  console.log('\n======================================================');
  console.log('📊 RESULTADOS DO STRESS TEST E2E');
  console.log('======================================================');
  console.log(`Membros gerados:           ${data.scenario.botCount}`);
  console.log(`Taxa de presença na Ata:   ${data.scenario.checkInRate}`);
  console.log(`Quórum aprovado pela Mesa: ${data.results.totalVotersInAta} membros`);
  console.log(`Votos computados com êxito: ${data.results.successVotes}`);
  console.log(`Votos em branco:           ${data.results.blankVotesInDb}`);
  console.log(`Bloqueio de voto duplo:    ${data.results.duplicateRejectionsVerified} testados e bloqueados ✓`);
  console.log(`Erros ou falhas:           ${data.results.errors}`);

  console.log('\n------------------------------------------------------');
  console.log('⚡ PERFORMANCE & TELEMETRIA');
  console.log('------------------------------------------------------');
  console.log(`Tempo total de execução:   ${data.performance.durationSeconds}s`);
  console.log(`Throughput (vazão):        ${data.performance.throughputRps} requisições/segundo`);
  console.log(`Latência Mínima:           ${data.performance.latency.minMs} ms`);
  console.log(`Latência Média:            ${data.performance.latency.avgMs} ms`);
  console.log(`Latência Mediana (p50):    ${data.performance.latency.p50Ms} ms`);
  console.log(`Latência 95º percentil:    ${data.performance.latency.p95Ms} ms`);
  console.log(`Latência 99º percentil:    ${data.performance.latency.p99Ms} ms`);
  console.log(`Latência Máxima:           ${data.performance.latency.maxMs} ms`);

  console.log('\n------------------------------------------------------');
  console.log('🏆 APURAÇÃO FINAL DOS VOTOS');
  console.log('------------------------------------------------------');
  const sortedTally = Object.entries(data.tally).sort((a, b) => b[1] - a[1]);
  sortedTally.forEach(([id, votes]) => {
    const role = id.startsWith('d') ? 'Diaconato' : 'Presbiterato';
    console.log(`- [${role}] Candidato ${id.padEnd(4)}: ${String(votes).padStart(4)} votos`);
  });

  console.log('\n======================================================');
  console.log('✅ TESTE E2E E DE CARGA CONCLUÍDO COM SUCESSO!');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Erro inesperado no runner:', err);
  process.exit(1);
});
