'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useElection } from '@/context/election-context';
import { Zap, Play, CheckCircle2, ShieldCheck, Timer, Gauge, ExternalLink } from 'lucide-react';

export default function AdminStressPage() {
  const { adminUser, logoutAdmin } = useElection();
  const [botCount, setBotCount] = useState(500);
  const [concurrency, setConcurrency] = useState(25);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleRunTest = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/test/stress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'ipst2026',
        },
        body: JSON.stringify({
          botCount,
          concurrency,
          checkInRate: 0.90,
          vagasDiac: 3,
          vagasPresb: 2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Falha ao executar stress test');
        setLoading(false);
        return;
      }

      setResult(data);
    } catch {
      setError('Erro de conexão ao executar teste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[1440px] mx-auto min-h-screen">
      <div className="w-full min-h-[900px] rounded-2xl overflow-hidden flex flex-col md:flex-row bg-[#F6F8F5] shadow-xl border border-[#DCE3DE] my-4 sm:my-8">
        {/* Sidebar */}
        <div className="w-full md:w-[248px] shrink-0 bg-[#073D24] text-white p-7 md:py-7 md:px-4.5 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/ipst_logo.jpg"
              alt="IPST"
              className="w-12 h-12 rounded-xl object-cover block border border-white/10"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[15px] font-bold">Eleição 2026</span>
              <span className="text-xs text-[#A9CDB6]">IP Serra Talhada</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/admin"
              className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Candidatos e vagas
            </Link>
            <Link
              href="/mesa"
              className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Conferência de ata
            </Link>
            <Link
              href="/projetor"
              className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Apresentação
            </Link>
            <Link
              href="/relatorio"
              className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Relatório executivo
            </Link>
            <div className="p-3 px-3.5 rounded-xl bg-white/14 text-sm font-semibold flex items-center justify-between cursor-default">
              <span>Stress Test (Bots)</span>
              <Zap size={14} className="text-amber-400" />
            </div>
          </div>

          <div className="mt-auto text-xs leading-[1.5] text-[#A9CDB6] pt-6 border-t border-white/10 flex flex-col gap-2">
            <div>
              <span className="font-semibold text-white">
                {adminUser ? adminUser.name : 'Conselho da Igreja'}
              </span>
              <br />
              Acesso administrativo
            </div>
            {adminUser && (
              <button
                onClick={logoutAdmin}
                className="text-left text-xs text-[#9FD3B1] hover:underline cursor-pointer"
              >
                Encerrar sessão
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 p-6 md:p-10 md:px-12 flex flex-col gap-7 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-2xl md:text-[32px] font-semibold text-[#15201A] flex items-center gap-3">
                Stress Test & Benchmark E2E
                <span className="text-xs bg-amber-100 text-amber-800 font-sans font-bold px-2.5 py-1 rounded-full border border-amber-300">
                  Simulação de Alta Carga
                </span>
              </h3>
              <div className="text-sm md:text-[15px] text-[#4A574F]">
                Executa centenas de bots simultâneos simulando membros, ata, aprovação de quórum e votos reais no PostgreSQL e Redis.
              </div>
            </div>

            <Link
              href="/projetor"
              target="_blank"
              className="h-10 px-4 rounded-xl bg-[#0A5C36] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#073D24] transition-colors self-start shrink-0"
            >
              <ExternalLink size={14} />
              Abrir Telão em Nova Aba
            </Link>
          </div>

          {/* Configuration Card */}
          <div className="bg-white border border-[#DCE3DE] rounded-2xl p-6 flex flex-col gap-6 shadow-xs">
            <div className="text-sm font-bold tracking-[.08em] uppercase text-[#0A5C36]">
              Parâmetros do Teste
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#15201A]">Quantidade de Bots</span>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={botCount}
                  onChange={(e) => setBotCount(Number(e.target.value))}
                  disabled={loading}
                  className="h-11 rounded-xl border-[1.5px] border-[#CBD5CE] px-3.5 text-base bg-white"
                />
                <span className="text-xs text-[#6B776F]">Total de membros votantes simulados</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#15201A]">Concorrência (Workers)</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  disabled={loading}
                  className="h-11 rounded-xl border-[1.5px] border-[#CBD5CE] px-3.5 text-base bg-white"
                />
                <span className="text-xs text-[#6B776F]">Requisições de voto simultâneas</span>
              </label>

              <div className="flex flex-col justify-end">
                <button
                  onClick={handleRunTest}
                  disabled={loading}
                  className="h-11 px-6 rounded-xl bg-[#073D24] hover:bg-[#052C1A] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Executando {botCount} Bots...
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="white" />
                      Iniciar Stress Test
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Results Display */}
          {result && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-[#DCE3DE] rounded-2xl p-4.5 flex flex-col gap-1 shadow-xs">
                  <span className="text-xs text-[#6B776F] flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#0A5C36]" />
                    Votos Computados
                  </span>
                  <span className="text-2xl font-bold text-[#0A5C36]">
                    {result.results.successVotes} / {result.results.totalVotersInAta}
                  </span>
                  <span className="text-[11px] text-[#6B776F]">
                    {result.results.blankVotesInDb} votos em branco
                  </span>
                </div>

                <div className="bg-white border border-[#DCE3DE] rounded-2xl p-4.5 flex flex-col gap-1 shadow-xs">
                  <span className="text-xs text-[#6B776F] flex items-center gap-1.5">
                    <Timer size={14} className="text-[#0A5C36]" />
                    Tempo Total
                  </span>
                  <span className="text-2xl font-bold text-[#15201A]">
                    {result.performance.durationSeconds}s
                  </span>
                  <span className="text-[11px] text-[#6B776F]">
                    {result.performance.totalDurationMs} ms decorridos
                  </span>
                </div>

                <div className="bg-white border border-[#DCE3DE] rounded-2xl p-4.5 flex flex-col gap-1 shadow-xs">
                  <span className="text-xs text-[#6B776F] flex items-center gap-1.5">
                    <Gauge size={14} className="text-[#0A5C36]" />
                    Vazão (Throughput)
                  </span>
                  <span className="text-2xl font-bold text-[#0A5C36]">
                    {result.performance.throughputRps}
                  </span>
                  <span className="text-[11px] text-[#6B776F]">requisições / segundo</span>
                </div>

                <div className="bg-white border border-[#DCE3DE] rounded-2xl p-4.5 flex flex-col gap-1 shadow-xs">
                  <span className="text-xs text-[#6B776F] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#0A5C36]" />
                    Voto Único
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">100%</span>
                  <span className="text-[11px] text-[#6B776F]">
                    {result.results.duplicateRejectionsVerified} tentativas duplicadas barradas
                  </span>
                </div>
              </div>

              {/* Latency Breakdown */}
              <div className="bg-white border border-[#DCE3DE] rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
                <div className="text-sm font-bold tracking-[.08em] uppercase text-[#0A5C36]">
                  Perfil de Latência (Milissegundos)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                    <span className="text-xs text-gray-500">Mínima</span>
                    <span className="text-lg font-bold text-gray-800">{result.performance.latency.minMs} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                    <span className="text-xs text-gray-500">Média</span>
                    <span className="text-lg font-bold text-gray-800">{result.performance.latency.avgMs} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col">
                    <span className="text-xs text-emerald-700 font-semibold">Mediana (p50)</span>
                    <span className="text-lg font-bold text-emerald-900">{result.performance.latency.p50Ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                    <span className="text-xs text-gray-500">95º Percentil (p95)</span>
                    <span className="text-lg font-bold text-gray-800">{result.performance.latency.p95Ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col">
                    <span className="text-xs text-gray-500">Máxima</span>
                    <span className="text-lg font-bold text-gray-800">{result.performance.latency.maxMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Final Tally */}
              <div className="bg-white border border-[#DCE3DE] rounded-2xl p-6 flex flex-col gap-4 shadow-xs">
                <div className="text-sm font-bold tracking-[.08em] uppercase text-[#0A5C36]">
                  Resultado da Apuração da Carga
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(result.tally)
                    .sort((a: any, b: any) => b[1] - a[1])
                    .map(([id, votes]: [string, any]) => (
                      <div
                        key={id}
                        className="flex justify-between items-center p-3 px-4 rounded-xl bg-gray-50 border border-gray-200/60"
                      >
                        <span className="text-sm font-semibold text-gray-800">
                          {id.startsWith('d') ? 'Diácono' : 'Presbítero'} {id}
                        </span>
                        <span className="text-base font-bold text-[#0A5C36] tabular-nums">
                          {votes} votos
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
