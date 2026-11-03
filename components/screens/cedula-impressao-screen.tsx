'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { Printer, FileDown, Scissors, ArrowLeft, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export function CedulaImpressaoScreen() {
  const { diac, presb, vagasDiac, vagasPresb } = useElection();
  const [mode, setMode] = useState<'2-up' | '4-up'>('2-up');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/election/ballot-pdf?mode=${mode}`, '_blank');
  };

  // Single Ballot Component
  const BallotCard = ({ isCompact = false }: { isCompact?: boolean }) => (
    <div
      className={`bg-white border-2 border-[#CBD5CE] rounded-xl flex flex-col justify-between overflow-hidden shadow-xs print:shadow-none print:border-gray-400 ${
        isCompact ? 'p-3 gap-2' : 'p-5 gap-3.5 h-full'
      }`}
    >
      {/* Top green accent strip */}
      <div className="h-1.5 w-full bg-[#073D24] -mt-5 -mx-5 mb-1 print:-mt-5 print:-mx-5" />

      {/* Header with Logo */}
      <div className="flex items-start gap-3.5 pb-2.5 border-b border-[#CBD5CE]">
        <img
          src="/assets/ipst_logo.jpg"
          alt="IPST"
          className="w-12 h-12 object-cover rounded-lg border border-[#CBD5CE] shrink-0"
        />
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-[#0A5C36]">
            Igreja Presbiteriana de Serra Talhada
          </span>
          <h3 className="font-serif text-sm sm:text-base font-bold text-[#15201A] leading-tight">
            Assembleia Extraordinária para Eleição de Oficiais
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-[#4A574F] mt-0.5">
            <span className="font-bold text-[#15201A]">Data: 08/11/2026</span>
            <span>·</span>
            <span className="uppercase font-semibold text-[#0A5C36]">Cédula Oficial</span>
          </div>
        </div>
      </div>

      {/* Instruction alert */}
      <div className="p-2 px-3 rounded-lg bg-[#F6F8F5] border border-[#DCE3DE] text-[10px] sm:text-[11px] text-[#33433A] leading-tight">
        <strong className="text-[#073D24]">INSTRUÇÕES:</strong> Assinale com um <strong>X</strong> seus candidatos. Voto em branco: deixe a cédula sem assinalar.
      </div>

      {/* Candidates area in 2 columns */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* Diaconato Column */}
        <div className="flex flex-col gap-1.5">
          <div className="p-1 px-2 rounded bg-[#0A5C36] text-white flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
              Diaconato
            </span>
            <span className="text-[9px] font-semibold bg-white/20 px-1.5 rounded">
              Até {vagasDiac} {vagasDiac === 1 ? 'vaga' : 'vagas'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            {diac.map(([id, name]) => (
              <label
                key={id}
                className="flex items-center gap-2 p-1.5 rounded border border-[#CBD5CE] bg-[#FDFEFE] hover:bg-gray-50 cursor-pointer select-none"
              >
                <div className="w-5 h-5 rounded border-2 border-[#15201A] bg-white flex items-center justify-center shrink-0"></div>
                <span className="text-xs sm:text-[13px] font-bold text-[#15201A] leading-tight truncate">
                  {name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Presbiterato Column */}
        <div className="flex flex-col gap-1.5">
          <div className="p-1 px-2 rounded bg-[#073D24] text-white flex justify-between items-center">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide">
              Presbiterato
            </span>
            <span className="text-[9px] font-semibold bg-white/20 px-1.5 rounded">
              Até {vagasPresb} {vagasPresb === 1 ? 'vaga' : 'vagas'}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            {presb.map(([id, name]) => (
              <label
                key={id}
                className="flex items-center gap-2 p-1.5 rounded border border-[#CBD5CE] bg-[#FDFEFE] hover:bg-gray-50 cursor-pointer select-none"
              >
                <div className="w-5 h-5 rounded border-2 border-[#15201A] bg-white flex items-center justify-center shrink-0"></div>
                <span className="text-xs sm:text-[13px] font-bold text-[#15201A] leading-tight truncate">
                  {name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Rubrica & Security */}
      <div className="pt-2 border-t border-[#CBD5CE] flex flex-col gap-1">
        <div className="flex justify-between items-end gap-2">
          <div className="flex-1 flex items-baseline gap-1 text-[10px] sm:text-[11px] text-[#4A574F]">
            <span className="font-semibold text-[#15201A]">Rubrica da Mesa:</span>
            <span className="flex-1 border-b border-dashed border-[#15201A] h-3"></span>
          </div>
          <span className="text-[9px] font-semibold text-[#0A5C36] uppercase">Voto Secreto</span>
        </div>
        <span className="text-[8px] text-[#6B776F] italic text-center">
          Válida exclusivamente com a rubrica oficial da comissão escrutinadora.
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E9ECE8] print:bg-white flex flex-col items-center">
      {/* Top Floating Control Bar (Hidden on print) */}
      <header className="w-full bg-[#073D24] text-white border-b border-[#0A4D2E] p-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-md no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#A9CDB6] hover:text-white transition-colors"
            title="Voltar ao Admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-serif text-lg sm:text-xl font-bold leading-tight">
              Cédulas de Votação Presencial (A4 Paisagem)
            </h1>
            <span className="text-xs text-[#A9CDB6]">
              Layout com guia de recorte · Data: 08/11/2026 · Ideal para membros idosos
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setMode('2-up')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === '2-up'
                  ? 'bg-[#0A5C36] text-white shadow-xs'
                  : 'text-[#CFE3D6] hover:text-white'
              }`}
            >
              2 por folha (A5 - Letras Grandes)
            </button>
            <button
              onClick={() => setMode('4-up')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === '4-up'
                  ? 'bg-[#0A5C36] text-white shadow-xs'
                  : 'text-[#CFE3D6] hover:text-white'
              }`}
            >
              4 por folha (Econômico)
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 border border-white/10 cursor-pointer transition-all"
            title="Baixar arquivo PDF vetorizado"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-4 rounded-xl bg-[#9FD3B1] hover:bg-[#8ecba3] text-[#073D24] text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            title="Imprimir cédulas agora"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cédulas</span>
          </button>
        </div>
      </header>

      {/* Main A4 Sheet Canvas */}
      <main className="w-full flex-1 flex flex-col items-center p-4 sm:p-8 print:p-0">
        {/* Printable Sheet Container configured as A4 Landscape (aspect ratio ~297 / 210 = 1.414) */}
        <div
          className={`w-full max-w-[1120px] aspect-[1.414/1] bg-white rounded-2xl shadow-xl border border-[#CBD5CE] p-6 sm:p-8 flex flex-col relative print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:w-screen print:h-screen print:max-w-none print:aspect-auto`}
          style={{ boxSizing: 'border-box' }}
        >
          {mode === '2-up' ? (
            /* 2 Ballots Side by Side (A5 Format in Landscape) */
            <div className="w-full h-full grid grid-cols-2 gap-8 relative">
              {/* Left Ballot */}
              <div className="h-full flex flex-col">
                <BallotCard />
              </div>

              {/* Vertical Cutting Line in Center */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-between pointer-events-none py-2">
                <div className="flex items-center gap-1 text-gray-500 bg-white px-1">
                  <Scissors className="w-4 h-4 rotate-90" />
                  <span className="text-[9px] font-bold tracking-wider uppercase">Corte</span>
                </div>

                <div className="flex-1 w-px border-l-2 border-dashed border-gray-400 my-2" />

                <div className="text-[9px] font-bold text-gray-400 tracking-widest uppercase rotate-90 py-4 bg-white">
                  Linha de Recorte
                </div>

                <div className="flex-1 w-px border-l-2 border-dashed border-gray-400 my-2" />

                <div className="flex items-center gap-1 text-gray-500 bg-white px-1">
                  <Scissors className="w-4 h-4 -rotate-90" />
                  <span className="text-[9px] font-bold tracking-wider uppercase">Corte</span>
                </div>
              </div>

              {/* Right Ballot */}
              <div className="h-full flex flex-col">
                <BallotCard />
              </div>
            </div>
          ) : (
            /* 4 Ballots Grid (2x2) */
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-6 relative">
              <BallotCard isCompact={true} />
              <BallotCard isCompact={true} />
              <BallotCard isCompact={true} />
              <BallotCard isCompact={true} />

              {/* Center Vertical Cut Line */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px border-l-2 border-dashed border-gray-400 pointer-events-none" />
              {/* Center Horizontal Cut Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px border-t-2 border-dashed border-gray-400 pointer-events-none" />
              {/* Center Scissors */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-gray-300">
                <Scissors className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Print Styles for A4 Landscape */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
