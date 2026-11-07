'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function RelatorioExecutivoScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    published,
    counted,
    majority,
    blanks,
    nulls,
    isCompleted,
    resDiac,
    resPresb,
    vagasDiac,
    vagasPresb,
    statusLabel,
    statusColor,
    statusBg,
    quorumAtingido,
    totalComungantes,
    quorumMinimo,
    adminUser,
    logoutAdmin,
    features,
  } = useElection();

  // Vagas que ficaram sem candidato com 50%+1 (ou em empate) — exigem nova decisão da Mesa
  const seatsNote = (res: typeof resDiac, vagas: number) => {
    if (!isCompleted) return null;
    const tied = res.some((c) => c.tied);
    const open = vagas - res.filter((c) => c.elected).length;
    if (open <= 0) return null;
    return (
      <span className="block text-[11px] font-semibold text-[#8A6A12]">
        {tied
          ? `${open} vaga(s) em empate — decisão da Mesa`
          : `${open} ${open === 1 ? 'vaga não preenchida' : 'vagas não preenchidas'}`}
      </span>
    );
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const contentPaper = (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-[#DCE3DE] p-8 sm:p-12 flex flex-col gap-8 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
      {/* Official Header */}
      <div className="flex items-start gap-5 pb-6 border-b border-[#CBD5CE]">
        <img
          src="/assets/ipst_logo.jpg"
          alt="Logo IPST"
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover block rounded-xl shadow-xs border border-[#CBD5CE]"
        />
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-[.15em] uppercase text-[#0A5C36] font-bold">
            Igreja Presbiteriana de Serra Talhada
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-[#15201A]">
            Relatório da Assembleia Geral Extraordinária — Eleição de Oficiais
          </h2>
          <span className="text-xs sm:text-sm text-[#4A574F]">
            Encaminhado ao Conselho da Igreja e à Mesa do Presbitério · Serra Talhada, PE · 2026
          </span>
        </div>
      </div>

      {/* 1. Quorum Section */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold tracking-[.1em] uppercase text-[#0A5C36]">
          1. Quórum Constitucional
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE3DE] rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#DCE3DE]">
          <div className="p-4 flex flex-col gap-1 bg-[#FDFEFE]">
            <span className="text-xs text-[#6B776F]">Membros comungantes (Rol)</span>
            <span className="text-2xl font-bold text-[#15201A] tabular-nums">{totalComungantes}</span>
          </div>
          <div className="p-4 flex flex-col gap-1 bg-[#FDFEFE]">
            <span className="text-xs text-[#6B776F]">Presentes conferidos em ata</span>
            <span className="text-2xl font-bold text-[#15201A] tabular-nums">{published}</span>
          </div>
          <div className="p-4 flex flex-col gap-1 bg-[#FDFEFE]">
            <span className="text-xs text-[#6B776F]">Quórum 1ª conv. (50%)</span>
            <span className="text-2xl font-bold text-[#15201A] tabular-nums">{quorumMinimo}</span>
          </div>
          <div className="p-4 flex flex-col gap-1 bg-[#FDFEFE]">
            <span className="text-xs text-[#6B776F]">Situação da Assembleia</span>
            <span
              className={`text-lg sm:text-xl font-bold ${
                quorumAtingido ? 'text-[#0A5C36]' : 'text-[#0A5C36]'
              }`}
            >
              {quorumAtingido ? 'Atingido (1ª Conv.)' : 'Válido (2ª Conv.)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Escrutínio Section */}
      <div className="flex flex-col gap-3">
        <div className="text-xs font-bold tracking-[.1em] uppercase text-[#0A5C36]">
          2. Escrutínio e Apuração
        </div>
        <div className="p-4 rounded-xl bg-[#F6F8F5] border border-[#DCE3DE] text-sm leading-relaxed text-[#33433A] flex flex-wrap gap-x-6 gap-y-2">
          <span>
            Cédulas apuradas: <strong className="font-bold text-[#15201A]">{counted}</strong> ({published} aptos na ata)
          </span>
          <span>·</span>
          <span>
            Para ser eleito: <strong className="font-bold text-[#15201A]">{counted > 0 ? majority : '—'} votos</strong> (50% + 1 das {counted} cédulas, brancas e nulas incluídas)
          </span>
          <span>·</span>
          <span>
            Brancos: <strong className="font-bold text-[#15201A]">{blanks}</strong>
          </span>
          <span>·</span>
          <span>
            Nulos: <strong className="font-bold text-[#15201A]">{nulls}</strong>
          </span>
          {!isCompleted && (
            <span className="w-full text-xs font-semibold text-[#8A6A12]">
              Resultado provisório: a apuração só é definitiva com a votação encerrada e todas as cédulas de papel entregues apuradas.
            </span>
          )}
        </div>
      </div>

      {/* 3. Diaconato Table */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline border-b border-[#CBD5CE] pb-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#15201A]">Diaconato</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#0A5C36]">
              {vagasDiac} {vagasDiac === 1 ? 'vaga' : 'vagas'}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-[#6B776F]">
            {resDiac.filter((c) => c.elected).length} de {vagasDiac} eleitos
            {seatsNote(resDiac, vagasDiac)}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_80px_100px_120px] text-xs font-bold text-[#6B776F] py-2 border-b border-[#CBD5CE]">
          <span>Candidato</span>
          <span className="text-right">Votos</span>
          <span className="text-right">% cédulas</span>
          <span className="text-right">Situação</span>
        </div>

        <div className="flex flex-col divide-y divide-[#EEF1EE]">
          {resDiac.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#6B776F]">
              Nenhum candidato a diácono apurado.
            </div>
          ) : (
            resDiac.map((r, rankIdx) => (
              <div
                key={r.id}
                className={`grid grid-cols-[1fr_80px_100px_120px] items-center text-sm py-2.5 ${
                  r.elected ? 'bg-[#F2F7F4]/60 -mx-2 px-2 rounded-lg' : ''
                }`}
              >
                <span className="font-semibold text-[#15201A] flex items-center gap-2">
                  <span className="text-xs text-[#6B776F] font-mono">#{rankIdx + 1}</span>
                  <span>{r.name}</span>
                </span>
                <span className="text-right tabular-nums font-bold text-[#15201A]">
                  {r.votes}
                </span>
                <span className="text-right tabular-nums text-[#5A675F]">{r.pct}</span>
                <span
                  className="justify-self-end px-2.5 py-0.5 rounded-md text-xs font-bold"
                  style={{ backgroundColor: r.sitBg, color: r.sitColor }}
                >
                  {r.sit}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Presbiterato Table */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-baseline border-b border-[#CBD5CE] pb-2">
          <div className="flex items-center gap-2.5">
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#15201A]">Presbiterato</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#0A5C36]">
              {vagasPresb} {vagasPresb === 1 ? 'vaga' : 'vagas'}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-[#6B776F]">
            {resPresb.filter((c) => c.elected).length} de {vagasPresb} eleitos
            {seatsNote(resPresb, vagasPresb)}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_80px_100px_120px] text-xs font-bold text-[#6B776F] py-2 border-b border-[#CBD5CE]">
          <span>Candidato</span>
          <span className="text-right">Votos</span>
          <span className="text-right">% cédulas</span>
          <span className="text-right">Situação</span>
        </div>

        <div className="flex flex-col divide-y divide-[#EEF1EE]">
          {resPresb.length === 0 ? (
            <div className="py-4 text-center text-xs text-[#6B776F]">
              Nenhum candidato a presbítero apurado.
            </div>
          ) : (
            resPresb.map((r, rankIdx) => (
              <div
                key={r.id}
                className={`grid grid-cols-[1fr_80px_100px_120px] items-center text-sm py-2.5 ${
                  r.elected ? 'bg-[#F2F7F4]/60 -mx-2 px-2 rounded-lg' : ''
                }`}
              >
                <span className="font-semibold text-[#15201A] flex items-center gap-2">
                  <span className="text-xs text-[#6B776F] font-mono">#{rankIdx + 1}</span>
                  <span>{r.name}</span>
                </span>
                <span className="text-right tabular-nums font-bold text-[#15201A]">
                  {r.votes}
                </span>
                <span className="text-right tabular-nums text-[#5A675F]">{r.pct}</span>
                <span
                  className="justify-self-end px-2.5 py-0.5 rounded-md text-xs font-bold"
                  style={{ backgroundColor: r.sitBg, color: r.sitColor }}
                >
                  {r.sit}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Signatures Block */}
      <div className="pt-8 border-t border-[#CBD5CE] flex flex-col gap-8 break-inside-avoid">
        <div className="text-xs text-[#6B776F] text-center italic">
          Certificamos que a presente apuração seguiu integralmente a Constituição da Igreja Presbiteriana do Brasil (CI/IPB), o sigilo incondicional do voto e as deliberações da Assembleia Geral Extraordinária.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-full border-b border-[#6B776F] mb-2"></div>
            <span className="text-xs font-bold text-[#15201A]">Pastor Presidente</span>
            <span className="text-[11px] text-[#6B776F]">Presidente da Mesa</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-full border-b border-[#6B776F] mb-2"></div>
            <span className="text-xs font-bold text-[#15201A]">1º Secretário da Mesa</span>
            <span className="text-[11px] text-[#6B776F]">Conferência e Ata</span>
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            <div className="w-full border-b border-[#6B776F] mb-2"></div>
            <span className="text-xs font-bold text-[#15201A]">Comissão Escrutinadora</span>
            <span className="text-[11px] text-[#6B776F]">Fiscalização da Apuração</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Standalone: Full Screen Desktop App Layout with Docked Left Sidebar
  if (standalone) {
    return (
      <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#F6F8F5]">
        {/* Left Sidebar - Truly docked to screen edge */}
        <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-[#073D24] text-white p-6 md:p-7 flex flex-col justify-between border-r border-[#0A4D2E] min-h-screen no-print">
          <div className="flex flex-col gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/ipst_logo.jpg"
                alt="IPST"
                className="w-12 h-12 rounded-xl object-cover block border border-white/10 shadow-sm"
              />
              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight">Eleição 2026</span>
                <span className="text-xs text-[#A9CDB6]">IP Serra Talhada</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/admin"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Candidatos e vagas
              </Link>
              <Link
                href="/mesa"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Conferência de ata
              </Link>
              <Link
                href="/projetor"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Apresentação (Telão)
              </Link>
              <div className="p-3 px-3.5 rounded-xl bg-white/15 text-sm font-semibold text-white shadow-xs">
                Relatório executivo
              </div>
              <Link
                href="/relatorios"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Resultados e gráficos
              </Link>
              <Link
                href="/cedula"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors flex items-center justify-between"
              >
                <span>Cédulas para impressão</span>
                <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded text-white font-mono">PDF</span>
              </Link>
              {features.stressTest && (
                <Link
                  href="/admin/stress"
                  className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
                >
                  Stress Test (Bots)
                </Link>
              )}
            </nav>
          </div>

          {/* User footer */}
          <div className="pt-6 border-t border-white/10 flex flex-col gap-2 text-xs text-[#A9CDB6]">
            <div>
              <span className="font-semibold text-white">
                {adminUser ? adminUser.name : 'Conselho da Igreja'}
              </span>
              <br />
              {adminUser ? 'Acesso autenticado' : 'Acesso administrativo'}
            </div>
            {adminUser ? (
              <button
                onClick={logoutAdmin}
                className="text-left text-xs text-[#9FD3B1] hover:underline cursor-pointer"
              >
                Encerrar sessão
              </button>
            ) : (
              <Link
                href="/admin/login"
                className="text-left text-xs text-[#9FD3B1] hover:underline cursor-pointer"
              >
                Entrar com senha
              </Link>
            )}
          </div>
        </aside>

        {/* Content Area - Full remaining width */}
        <div className="flex-1 min-w-0 bg-[#F6F8F5] p-6 sm:p-8 lg:p-12 overflow-y-auto print:p-0 print:bg-white flex flex-col items-center">
          {/* Top Action Bar */}
          <div className="max-w-4xl w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#15201A]">
                Relatório executivo
              </h1>
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: statusBg, color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="h-10 px-4 rounded-xl bg-[#073D24] hover:bg-[#0A5C36] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Relatório</span>
              </button>
            </div>
          </div>

          {/* Printable Document Paper */}
          <div className="max-w-4xl w-full">
            {contentPaper}
          </div>
        </div>
      </div>
    );
  }

  // Embedded view (e.g. inside /canvas preview)
  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[1440px] mx-auto">
      <div className="text-sm font-semibold text-[#4A574F] no-print">
        06 · Relatório executivo para a mesa
      </div>
      <div className="w-full rounded-2xl overflow-hidden flex flex-col md:flex-row bg-[#F6F8F5] shadow-xl border border-[#DCE3DE]">
        <div className="w-full md:w-[248px] shrink-0 bg-[#073D24] text-white p-6 flex flex-col gap-6 no-print">
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
          <div className="flex flex-col gap-1 text-sm text-[#CFE3D6]">
            <div>Candidatos e vagas</div>
            <div>Conferência de ata</div>
            <div>Apresentação</div>
            <div className="font-semibold text-white">Relatório executivo</div>
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8">
          {contentPaper}
        </div>
      </div>
    </div>
  );
}
