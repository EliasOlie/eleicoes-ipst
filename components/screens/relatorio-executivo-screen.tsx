'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { TOTAL_COMUNGANTES, QUORUM_MINIMO } from '@/lib/mock-data';
import { Printer, FileDown } from 'lucide-react';
import Link from 'next/link';

export function RelatorioExecutivoScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    published,
    counted,
    majority,
    blanks,
    resDiac,
    resPresb,
    vagasDiac,
    vagasPresb,
    statusLabel,
    statusColor,
    statusBg,
    quorumAtingido,
    adminUser,
    logoutAdmin,
  } = useElection();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[1440px] mx-auto' : ''}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F] no-print">
          06 · Relatório executivo para a mesa
        </div>
      )}
      <div className="w-[1440px] max-w-full min-h-[1180px] rounded-2xl overflow-hidden flex flex-col md:flex-row bg-[#F6F8F5] shadow-[0_1px_0_#D5DCD7,0_20px_50px_rgba(7,61,36,.12)] mx-auto border border-[#DCE3DE] print:shadow-none print:border-none print:w-full print:min-h-0 print:bg-white">
        {/* Sidebar (hidden during print) */}
        <div className="w-full md:w-[248px] shrink-0 bg-[#073D24] text-white p-7 md:py-7 md:px-4.5 flex flex-col gap-8 no-print">
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
            <div className="p-3 px-3.5 rounded-xl bg-white/14 text-sm font-semibold cursor-default">
              Relatório executivo
            </div>
            <Link
              href="/admin/stress"
              className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/5 transition-colors cursor-pointer"
            >
              Stress Test (Bots)
            </Link>
          </div>

          <div className="mt-auto text-xs leading-[1.5] text-[#A9CDB6] pt-6 border-t border-white/10 flex flex-col gap-2">
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
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 p-6 md:p-8 md:px-12 flex flex-col gap-6 overflow-y-auto print:p-0">
          {/* Header Controls (hidden on print) */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-2xl md:text-[28px] font-semibold text-[#15201A]">
                Relatório executivo
              </h3>
              <span
                className="px-3 py-1.5 rounded-full text-[13px] font-bold"
                style={{ backgroundColor: statusBg, color: statusColor }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrint}
                className="h-[42px] px-4.5 rounded-xl border-[1.5px] border-[#CBD5CE] bg-white hover:bg-[#EEF4F0] text-[#15201A] text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors"
              >
                <Printer size={16} />
                Imprimir
              </button>
              <button
                onClick={handlePrint}
                className="h-[42px] px-4.5 rounded-xl border-none bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer flex items-center gap-2 transition-colors shadow-sm"
              >
                <FileDown size={16} />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Formal Printable Document Sheet */}
          <div className="self-center w-full max-w-[880px] bg-white border border-[#DCE3DE] rounded-md p-8 md:p-14 md:px-16 flex flex-col gap-8 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none">
            {/* Document Header */}
            <div className="flex items-center gap-5 pb-6 border-b-2 border-[#0A5C36]">
              <img
                src="/assets/ipst_logo.jpg"
                alt="Logo IPST"
                className="w-[76px] h-[76px] object-cover block rounded-lg shadow-xs"
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs tracking-[.1em] uppercase text-[#0A5C36] font-bold">
                  Igreja Presbiteriana de Serra Talhada
                </span>
                <span className="font-serif text-2xl md:text-[26px] font-semibold leading-[1.2] text-[#15201A]">
                  Relatório da Assembleia Geral Extraordinária — Eleição de Oficiais
                </span>
                <span className="text-sm text-[#4A574F]">
                  Encaminhado à mesa do Presbitério · Serra Talhada, PE · 2026
                </span>
              </div>
            </div>

            {/* 1. Quorum */}
            <div className="flex flex-col gap-3.5">
              <div className="text-xs font-bold tracking-[.1em] uppercase text-[#0A5C36]">
                1. Quórum
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#DCE3DE] rounded-lg overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#DCE3DE]">
                <div className="p-3.5 px-4 flex flex-col gap-1 bg-[#FDFEFE]">
                  <span className="text-xs text-[#6B776F]">Membros comungantes</span>
                  <span className="text-2xl font-bold text-[#15201A]">{TOTAL_COMUNGANTES}</span>
                </div>
                <div className="p-3.5 px-4 flex flex-col gap-1 bg-[#FDFEFE]">
                  <span className="text-xs text-[#6B776F]">Presentes conferidos em ata</span>
                  <span className="text-2xl font-bold text-[#15201A]">{published}</span>
                </div>
                <div className="p-3.5 px-4 flex flex-col gap-1 bg-[#FDFEFE]">
                  <span className="text-xs text-[#6B776F]">Quórum mínimo (1/3)</span>
                  <span className="text-2xl font-bold text-[#15201A]">{QUORUM_MINIMO}</span>
                </div>
                <div className="p-3.5 px-4 flex flex-col gap-1 bg-[#FDFEFE]">
                  <span className="text-xs text-[#6B776F]">Situação</span>
                  <span className="text-xl font-bold text-[#0A5C36]">
                    {quorumAtingido ? 'Atingido' : 'Não atingido'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Escrutinio */}
            <div className="flex flex-col gap-3.5">
              <div className="text-xs font-bold tracking-[.1em] uppercase text-[#0A5C36]">
                2. Escrutínio
              </div>
              <div className="text-sm leading-[1.6] text-[#33433A]">
                Cédulas apuradas: <strong>{counted}</strong> de {published} · Maioria absoluta:{' '}
                <strong>{majority} votos</strong> · Votos em branco: <strong>{blanks}</strong>
              </div>
            </div>

            {/* Diaconato Table */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-xl font-semibold text-[#15201A]">Diaconato</span>
                <span className="text-[13px] text-[#6B776F] font-medium">{vagasDiac} vagas</span>
              </div>
              <div className="grid grid-cols-[1fr_90px_110px_120px] text-xs font-bold text-[#6B776F] py-2 border-b border-[#CBD5CE]">
                <span>Candidato</span>
                <span className="text-right">Votos</span>
                <span className="text-right">% presentes</span>
                <span className="text-right">Situação</span>
              </div>
              <div className="flex flex-col divide-y divide-[#EEF1EE]">
                {resDiac.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#6B776F]">
                    Nenhum candidato a diácono apurado.
                  </div>
                ) : (
                  resDiac.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[1fr_90px_110px_120px] items-center text-sm py-2.5"
                    >
                      <span className="font-semibold text-[#15201A]">{r.name}</span>
                      <span className="text-right tabular-nums font-medium text-[#15201A]">
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

            {/* Presbiterato Table */}
            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-baseline">
                <span className="font-serif text-xl font-semibold text-[#15201A]">Presbiterato</span>
                <span className="text-[13px] text-[#6B776F] font-medium">{vagasPresb} vagas</span>
              </div>
              <div className="grid grid-cols-[1fr_90px_110px_120px] text-xs font-bold text-[#6B776F] py-2 border-b border-[#CBD5CE]">
                <span>Candidato</span>
                <span className="text-right">Votos</span>
                <span className="text-right">% presentes</span>
                <span className="text-right">Situação</span>
              </div>
              <div className="flex flex-col divide-y divide-[#EEF1EE]">
                {resPresb.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#6B776F]">
                    Nenhum candidato a presbítero apurado.
                  </div>
                ) : (
                  resPresb.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[1fr_90px_110px_120px] items-center text-sm py-2.5"
                    >
                      <span className="font-semibold text-[#15201A]">{r.name}</span>
                      <span className="text-right tabular-nums font-medium text-[#15201A]">
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

            {/* Secret ballot compliance disclaimer */}
            <div className="text-[13px] leading-[1.6] text-[#4A574F] p-3.5 px-4 bg-[#F4F7F5] rounded-lg">
              O sistema registra a lista de presença, conferida com o livro de atas, e a contagem de
              votos em registros separados. Nenhum voto é vinculado ao nome ou telefone do membro.
            </div>

            {/* Formal Signatures */}
            <div className="grid grid-cols-2 gap-x-14 gap-y-10 pt-6">
              <div className="flex flex-col gap-1.5 pt-9 border-b border-[#15201A]">
                <div className="text-[13px] text-[#4A574F]">Presidente da Assembleia</div>
              </div>
              <div className="flex flex-col gap-1.5 pt-9 border-b border-[#15201A]">
                <div className="text-[13px] text-[#4A574F]">Secretário</div>
              </div>
              <div className="flex flex-col gap-1.5 pt-9 border-b border-[#15201A]">
                <div className="text-[13px] text-[#4A574F]">Escrutinador</div>
              </div>
              <div className="flex flex-col gap-1.5 pt-9 border-b border-[#15201A]">
                <div className="text-[13px] text-[#4A574F]">Escrutinador</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
