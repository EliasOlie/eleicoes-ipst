'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Printer, RefreshCw } from 'lucide-react';
import { useElection } from '@/context/election-context';
import type { CandidateResult } from '@/types/election';

const C = {
  g9: '#073D24',
  g8: '#0A5C36',
  g5: '#5FA57B',
  g3: '#9FD3B1',
  g1: '#E7F0EA',
  ink: '#15201A',
  muted: '#5A675F',
  line: '#DCE3DE',
  amber: '#C99A1E',
  amberBg: '#FBF3DC',
  gray: '#C9D1CC',
  red: '#B45454',
};

function pctFmt(n: number) {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** Rosca SVG simples (sem biblioteca) */
function Donut({ parts, size = 168 }: { parts: { label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Composição das cédulas">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF1EE" strokeWidth={24} />
      {total > 0 &&
        parts.map((p) => {
          const len = (p.value / total) * circ;
          const el = (
            <circle
              key={p.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={24}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          acc += len;
          return el;
        })}
      <text x="50%" y="47%" textAnchor="middle" fontSize="26" fontWeight="700" fill={C.ink}>
        {total}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontSize="11" fill={C.muted}>
        cédulas
      </text>
    </svg>
  );
}

function StatusBadge({ r }: { r: CandidateResult }) {
  if (r.elected) return <span className="px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide bg-[#0A5C36] text-white">ELEITO</span>;
  if (r.provisional) return <span className="px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide bg-[#E7F0EA] text-[#0A5C36] border border-[#9FD3B1]">MAIORIA</span>;
  if (r.tied) return <span className="px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide bg-[#FBF3DC] text-[#8A6A12] border border-[#E8C46A]">EMPATE</span>;
  return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F1F3F1] text-[#6B776F]">{r.sit.toUpperCase()}</span>;
}

function OfficePanel({
  title,
  vagas,
  results,
  counted,
  majority,
  isFinal,
}: {
  title: string;
  vagas: number;
  results: CandidateResult[];
  counted: number;
  majority: number;
  isFinal: boolean;
}) {
  const filled = results.filter((r) => r.elected || r.provisional).length;
  const tied = results.some((r) => r.tied);
  const open = tied ? 0 : Math.max(0, vagas - filled);
  const majLeft = counted > 0 ? Math.min(100, (majority / counted) * 100) : 0;

  return (
    <section className="bg-white rounded-2xl border border-[#DCE3DE] shadow-xs overflow-hidden break-inside-avoid">
      <header className="px-5 py-4 bg-[#073D24] text-white flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <h2 className="font-serif text-2xl font-semibold">{title}</h2>
          <span className="text-xs text-[#A9CDB6]">{vagas} {vagas === 1 ? 'vaga' : 'vagas'}</span>
        </div>
        <span className="text-xs text-[#CFE3D6]">
          {filled} de {vagas} {isFinal ? 'eleitos' : 'com maioria'}
          {isFinal && tied && <span className="ml-1 text-amber-300 font-semibold">· empate — decisão da Mesa</span>}
          {isFinal && open > 0 && (
            <span className="ml-1 text-amber-300 font-semibold">
              · {open} {open === 1 ? 'vaga não preenchida' : 'vagas não preenchidas'}
            </span>
          )}
        </span>
      </header>
      <ol className="divide-y divide-[#EEF1EE]">
        {results.map((r, i) => (
          <li key={r.id} className="px-5 py-3.5 flex items-center gap-4">
            <span className="w-6 text-xs font-mono text-[#9AA8A0] text-right">{i + 1}º</span>
            <span
              className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                r.elected ? 'bg-[#0A5C36] text-white' : 'bg-[#DCE9E0] text-[#0A5C36]'
              }`}
            >
              {r.initials}
            </span>
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-[#15201A] truncate">{r.name}</span>
                  <StatusBadge r={r} />
                </span>
                <span className="text-right shrink-0">
                  <span className="text-lg font-bold tabular-nums text-[#15201A]">{r.pct}</span>
                  <span className="block text-[11px] text-[#6B776F] tabular-nums">
                    {r.votes.toLocaleString('pt-BR')} {r.votes === 1 ? 'voto' : 'votos'}
                  </span>
                </span>
              </div>
              <div className="relative h-2.5 rounded-full bg-[#EEF1EE] overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: r.width,
                    background: r.elected || r.provisional ? C.g8 : r.tied ? C.amber : C.g5,
                  }}
                />
                {counted > 0 && (
                  <div className="absolute inset-y-[-2px] w-[2px] bg-[#15201A]" style={{ left: `${majLeft}%` }} />
                )}
              </div>
            </div>
          </li>
        ))}
        {results.length === 0 && <li className="px-5 py-8 text-center text-sm text-[#6B776F]">Nenhum candidato cadastrado.</li>}
      </ol>
    </section>
  );
}

export function ResultadosScreen() {
  const {
    counted,
    blanks,
    nulls,
    published,
    majority,
    isCompleted,
    votingOpen,
    paperHanded,
    paperCounted,
    resDiac,
    resPresb,
    vagasDiac,
    vagasPresb,
    statusLabel,
    isAdminAuthenticated,
    refreshState,
  } = useElection();

  const [updatedAt, setUpdatedAt] = useState('');
  const [dlError, setDlError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Marca a hora da última mudança nos números (fora do render, em callback)
  useEffect(() => {
    const t = setTimeout(
      () =>
        setUpdatedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
      0
    );
    return () => clearTimeout(t);
  }, [counted, blanks, nulls, published]);

  const withVote = Math.max(0, counted - blanks - nulls);
  const apuradoPct = published > 0 ? Math.min(100, (counted / published) * 100) : 0;
  const abstencao = Math.max(0, published - counted);

  const download = async (tipo: 'resultado' | 'cedulas') => {
    setDlError('');
    setDownloading(tipo);
    try {
      const res = await fetch(`/api/election/export?tipo=${tipo}`, { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDlError(res.status === 401 ? 'Sessão expirada. Entre novamente.' : data.error || 'Erro ao exportar.');
        return;
      }
      const blob = await res.blob();
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `${tipo}-eleicao-ipst.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setDlError('Falha de conexão ao exportar.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F2F5F2] text-[#15201A]">
      {/* Cabeçalho */}
      <header className="bg-[#073D24] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/assets/ipst_logo.jpg" alt="IPST" className="w-12 h-12 rounded-xl object-cover border border-white/15" />
            <div>
              <div className="text-[11px] tracking-[.15em] uppercase text-[#A9CDB6] font-semibold">
                Igreja Presbiteriana de Serra Talhada
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight">Resultados da Eleição de Oficiais 2026</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Link href="/admin" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs">
              <ArrowLeft size={14} /> Painel
            </Link>
            <button onClick={() => refreshState()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs cursor-pointer">
              <RefreshCw size={14} /> Atualizar
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs cursor-pointer">
              <Printer size={14} /> Imprimir
            </button>
          </div>
        </div>

        {/* Barra de apuração (estilo "seções totalizadas") */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">
              {statusLabel}
              {!isCompleted && counted > 0 && <span className="ml-2 text-amber-300">· resultado provisório</span>}
            </span>
            <span className="text-[#CFE3D6] tabular-nums">
              {counted} de {published} aptos votaram ({pctFmt(apuradoPct)}) · atualizado às {updatedAt}
            </span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-[#9FD3B1] transition-all duration-700" style={{ width: `${apuradoPct}%` }} />
          </div>
          {paperHanded > 0 && (
            <div className="mt-1.5 text-xs text-[#CFE3D6]">
              Cédulas de papel: {paperCounted} de {paperHanded} entregues apuradas
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Cartões de totais */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { k: 'Cédulas apuradas', v: counted, s: 'base dos 50% + 1' },
            { k: 'Para ser eleito', v: counted > 0 ? majority : '—', s: '50% + 1 das cédulas' },
            { k: 'Brancas', v: blanks, s: counted ? pctFmt((blanks / counted) * 100) : '—' },
            { k: 'Nulas', v: nulls, s: counted ? pctFmt((nulls / counted) * 100) : '—' },
            { k: 'Não votaram', v: abstencao, s: published ? pctFmt((abstencao / published) * 100) + ' dos aptos' : '—' },
          ].map((c) => (
            <div key={c.k} className="bg-white rounded-2xl border border-[#DCE3DE] px-4 py-3.5 flex flex-col">
              <span className="text-xs text-[#6B776F]">{c.k}</span>
              <span className="text-3xl font-bold tabular-nums">{c.v}</span>
              <span className="text-[11px] text-[#6B776F]">{c.s}</span>
            </div>
          ))}
        </div>

        {/* Candidatos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OfficePanel title="Diaconato" vagas={vagasDiac} results={resDiac} counted={counted} majority={majority} isFinal={isCompleted} />
          <OfficePanel title="Presbiterato" vagas={vagasPresb} results={resPresb} counted={counted} majority={majority} isFinal={isCompleted} />
        </div>
        <p className="text-xs text-[#6B776F] -mt-3">
          A linha vertical em cada barra marca os 50% + 1 das cédulas ({counted > 0 ? majority : '—'} votos). Percentuais calculados
          sobre o total de cédulas apuradas, incluindo brancas e nulas. Cada membro pode marcar de nenhum até o número de vagas do cargo (limitado ao número de candidatos). Vaga sem candidato com 50% + 1 fica não preenchida.
        </p>

        {/* Composição + participação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-2xl border border-[#DCE3DE] p-5 flex items-center gap-6 break-inside-avoid">
            <Donut
              parts={[
                { label: 'Com voto', value: withVote, color: C.g8 },
                { label: 'Brancas', value: blanks, color: C.gray },
                { label: 'Nulas', value: nulls, color: C.red },
              ]}
            />
            <div className="flex flex-col gap-2.5">
              <h3 className="font-serif text-lg font-semibold">Composição das cédulas</h3>
              {[
                ['Com voto', withVote, C.g8],
                ['Brancas', blanks, C.gray],
                ['Nulas', nulls, C.red],
              ].map(([l, v, c]) => (
                <div key={l as string} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-sm" style={{ background: c as string }} />
                  <span className="w-20">{l}</span>
                  <strong className="tabular-nums">{v as number}</strong>
                  <span className="text-[#6B776F] tabular-nums">{counted ? pctFmt(((v as number) / counted) * 100) : ''}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-[#DCE3DE] p-5 flex flex-col gap-4 break-inside-avoid">
            <h3 className="font-serif text-lg font-semibold">Participação dos aptos</h3>
            {[
              ['Votaram pelo celular', Math.max(0, counted - paperCounted), C.g8],
              ['Votaram em papel', paperCounted, C.g5],
              ['Não votaram', abstencao, C.gray],
            ].map(([l, v, c]) => {
              const w = published > 0 ? ((v as number) / published) * 100 : 0;
              return (
                <div key={l as string} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{l}</span>
                    <span className="tabular-nums">
                      <strong>{v as number}</strong> <span className="text-[#6B776F]">{published ? pctFmt(w) : ''}</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#EEF1EE] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, w)}%`, background: c as string }} />
                  </div>
                </div>
              );
            })}
            <span className="text-[11px] text-[#6B776F]">Base: {published} membros conferidos na ata.</span>
          </section>
        </div>

        {/* Exportação */}
        <section className="bg-white rounded-2xl border border-[#DCE3DE] p-5 flex flex-col gap-3 no-print">
          <h3 className="font-serif text-lg font-semibold">Exportar dados (CSV)</h3>
          {!isAdminAuthenticated ? (
            <p className="text-sm text-[#6B776F]">
              Disponível para a Mesa. <Link href="/admin/login?next=/relatorios" className="text-[#0A5C36] font-semibold underline">Entrar com senha</Link>
            </p>
          ) : !isCompleted ? (
            <p className="text-sm text-[#8A6A12]">
              Disponível quando a apuração for concluída: votação encerrada e todas as cédulas de papel entregues apuradas
              {votingOpen ? ' (a votação ainda está aberta).' : '.'}
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => download('resultado')}
                disabled={!!downloading}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                <Download size={16} /> {downloading === 'resultado' ? 'Gerando...' : 'Resultado por candidato'}
              </button>
              <button
                onClick={() => download('cedulas')}
                disabled={!!downloading}
                className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border-[1.5px] border-[#CBD5CE] bg-white hover:bg-[#F6F8F6] text-sm font-semibold cursor-pointer disabled:opacity-60"
              >
                <Download size={16} /> {downloading === 'cedulas' ? 'Gerando...' : 'Cédulas embaralhadas (auditoria)'}
              </button>
            </div>
          )}
          {dlError && <p className="text-sm text-red-700 font-medium">{dlError}</p>}
          <p className="text-[11px] text-[#6B776F]">
            O arquivo de cédulas traz uma linha por cédula, em ordem aleatória, sem número, horário ou comprovante — permite recontar a
            eleição sem identificar ninguém.
          </p>
        </section>
      </main>
    </div>
  );
}
