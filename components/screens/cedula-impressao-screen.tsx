'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { Printer, FileDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function CedulaImpressaoScreen() {
  const { diac, presb, vagasDiac, vagasPresb } = useElection();

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    window.open('/api/election/ballot-pdf', '_blank');
  };

  // Compact Single Ballot Component for 8-up Grid (4 cols x 2 rows)
  const SingleBallot = () => (
    <div className="bg-white border border-[#CBD5CE] rounded-lg p-2.5 flex flex-col justify-between overflow-hidden shadow-xs print:shadow-none print:border-[#A0ABA3] print:rounded-none h-full box-border">
      {/* Top accent bar */}
      <div className="h-1 w-full bg-[#073D24] -mt-2.5 -mx-2.5 mb-1.5 print:-mt-2.5 print:-mx-2.5" />

      {/* Header */}
      <div className="flex items-center gap-2 pb-1.5 border-b border-[#CBD5CE]">
        <img
          src="/assets/ipst_logo.jpg"
          alt="IPST"
          className="w-7 h-7 object-cover rounded-md border border-[#CBD5CE] shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold tracking-wider uppercase text-[#0A5C36] leading-tight truncate">
            IP Serra Talhada
          </span>
          <span className="font-serif text-[10px] font-bold text-[#15201A] leading-tight truncate">
            Eleição de Oficiais · 08/11/2026
          </span>
        </div>
      </div>

      {/* Instruction Note */}
      <div className="py-0.5 px-1.5 rounded bg-[#F6F8F5] border border-[#DCE3DE] text-[8px] text-[#33433A] leading-tight my-1">
        Marque <strong>[X]</strong> seus candidatos. Em branco: não assinale.
      </div>

      {/* 2 Columns: Diaconato & Presbiterato */}
      <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 pt-0.5">
        {/* Diaconato Column */}
        <div className="flex flex-col min-w-0">
          <div className="p-0.5 px-1 rounded bg-[#0A5C36] text-white flex justify-between items-center mb-1">
            <span className="text-[8px] font-bold uppercase tracking-tight">Diácono</span>
            <span className="text-[7.5px] bg-white/20 px-1 rounded font-semibold">Até {vagasDiac}</span>
          </div>

          <div className="flex flex-col gap-1">
            {diac.map(([id, name]) => (
              <div key={id} className="flex items-center gap-1.5 min-w-0">
                <div className="w-3.5 h-3.5 rounded-xs border-[1.2px] border-[#15201A] bg-white shrink-0" />
                <span className="text-[8.5px] font-bold text-[#15201A] leading-tight truncate">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Presbiterato Column */}
        <div className="flex flex-col min-w-0">
          <div className="p-0.5 px-1 rounded bg-[#073D24] text-white flex justify-between items-center mb-1">
            <span className="text-[8px] font-bold uppercase tracking-tight">Presbítero</span>
            <span className="text-[7.5px] bg-white/20 px-1 rounded font-semibold">Até {vagasPresb}</span>
          </div>

          <div className="flex flex-col gap-1">
            {presb.map(([id, name]) => (
              <div key={id} className="flex items-center gap-1.5 min-w-0">
                <div className="w-3.5 h-3.5 rounded-xs border-[1.2px] border-[#15201A] bg-white shrink-0" />
                <span className="text-[8.5px] font-bold text-[#15201A] leading-tight truncate">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clean discrete footer without rubrica/voto secreto */}
      <div className="pt-1 mt-1 border-t border-[#CBD5CE] text-[7px] text-[#6B776F] text-center">
        Cédula Oficial Presencial · Assembleia Extraordinária IPST
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
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-serif text-lg sm:text-xl font-bold leading-tight flex items-center gap-2">
              Cédulas de Votação (8 por Folha A4 Paisagem)
              <span className="text-xs bg-[#0A5C36] px-2 py-0.5 rounded-md font-sans text-white border border-white/20">
                38 folhas = ~300 votos
              </span>
            </h1>
            <span className="text-xs text-[#A9CDB6]">
              Layout econômico e de contingência com linhas discretas de corte · 08/11/2026
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            className="h-9 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-2 border border-white/10 cursor-pointer transition-all"
            title="Baixar arquivo PDF vetorizado"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar PDF (8 por Folha)</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-4 rounded-xl bg-[#9FD3B1] hover:bg-[#8ecba3] text-[#073D24] text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            title="Imprimir cédulas agora"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora (A4 Paisagem)</span>
          </button>
        </div>
      </header>

      {/* Main A4 Sheet Canvas */}
      <main className="w-full flex-1 flex flex-col items-center p-4 sm:p-8 print:p-0">
        {/* Printable Sheet Container configured as A4 Landscape (aspect ratio 297mm / 210mm = 1.414) */}
        <div
          className="w-full max-w-[1120px] aspect-[1.414/1] bg-white rounded-2xl shadow-xl border border-[#CBD5CE] p-3 sm:p-4 flex flex-col relative print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:w-screen print:h-screen print:max-w-none print:aspect-auto"
          style={{ boxSizing: 'border-box' }}
        >
          {/* 8 Ballots Grid: 4 columns x 2 rows */}
          <div className="w-full h-full grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 relative">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="h-full w-full min-h-0 min-w-0">
                <SingleBallot />
              </div>
            ))}

            {/* Discrete Cutting Guide Lines (Dashed, never overlapping content) */}
            {/* Vertical Cut Lines */}
            <div className="absolute top-0 bottom-0 left-1/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-2/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-3/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />

            {/* Horizontal Cut Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-gray-400 pointer-events-none" />
          </div>
        </div>
      </main>

      {/* Global Print Styles for A4 Landscape */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm;
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
