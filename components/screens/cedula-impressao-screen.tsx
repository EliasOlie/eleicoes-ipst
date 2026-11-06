'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { Printer, FileDown, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type BallotViewMode = 'all' | 'presb' | 'diac' | 'mixed';

export function CedulaImpressaoScreen() {
  const { diac, presb, vagasDiac, vagasPresb } = useElection();
  const [viewMode, setViewMode] = useState<BallotViewMode>('all');

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = (mode: BallotViewMode = viewMode) => {
    window.open(`/api/election/ballot-pdf?mode=${mode}`, '_blank');
  };

  // Helper to extract first name only
  const getFirstName = (fullName: string) => fullName.trim().split(' ')[0] || fullName;

  // Single Dedicated Ballot Component (1 cargo por cédula)
  const SingleBallot = ({ role }: { role: 'presb' | 'diac' }) => {
    const isPresb = role === 'presb';
    const accentBg = isPresb ? 'bg-[#073D24]' : 'bg-[#0A5C36]';
    const accentText = isPresb ? 'text-[#073D24]' : 'text-[#0A5C36]';
    const title = isPresb ? 'Cédula de Presbítero' : 'Cédula de Diácono';
    const limit = isPresb ? vagasPresb : vagasDiac;
    const candidatesList = isPresb ? presb : diac;

    return (
      <div className="bg-white border border-[#CBD5CE] rounded-lg p-2.5 flex flex-col justify-between overflow-hidden shadow-xs print:shadow-none print:border-[#CBD5CE] print:rounded-none h-full box-border">
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${accentBg} -mt-2.5 -mx-2.5 mb-1.5 print:-mt-2.5 print:-mx-2.5`} />

        {/* Header */}
        <div className="flex items-center gap-2 pb-1.5 border-b border-[#CBD5CE]">
          <img
            src="/assets/ipst_logo.jpg"
            alt="IPST"
            className="w-5 h-5 object-cover rounded-sm border border-[#CBD5CE] shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className={`text-[8.5px] font-bold tracking-wider uppercase ${accentText} leading-none truncate`}>
              IP Serra Talhada
            </span>
            <span className="font-serif text-[9.5px] font-bold text-[#15201A] leading-tight truncate">
              Eleição de Oficiais · 08/11/2026
            </span>
          </div>
        </div>

        {/* Cargo Banner (Full Width) */}
        <div className={`py-1 px-1.5 rounded ${accentBg} text-white flex justify-between items-center my-1`}>
          <span className="text-[8px] font-black uppercase tracking-wide">{title}</span>
          <span className="text-[7px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
            Vote em até {limit}
          </span>
        </div>

        {/* Instruction Note */}
        <div className="py-0.5 px-1 rounded bg-[#F6F8F5] border border-[#DCE3DE] text-[7px] text-[#33433A] leading-none mb-1 text-center font-medium">
          Marque <strong>[X]</strong> no quadrado. Voto em branco: deixe vazio.
        </div>

        {/* Candidates List (Vertical, 1st names only!) */}
        <div className="flex flex-col gap-1.5 flex-1 justify-center py-0.5">
          {candidatesList.map(([id, name]) => {
            const firstName = getFirstName(name);
            return (
              <div key={id} className="flex items-center gap-2 min-w-0">
                <div className="w-3.5 h-3.5 rounded-xs border-[1.5px] border-[#15201A] bg-white shrink-0" />
                <span className="text-[9.5px] font-bold text-[#15201A] leading-none truncate">
                  {firstName}
                </span>
              </div>
            );
          })}
        </div>

        {/* Clean discrete footer */}
        <div className="pt-1 mt-1 border-t border-[#CBD5CE] text-[7px] text-[#6B776F] text-center leading-none">
          Votação Secreta · Assembleia IPST (CI/IPB)
        </div>
      </div>
    );
  };

  // Render a full 12-up sheet container for a specific view
  const RenderSheet = ({ role, title }: { role: 'presb' | 'diac' | 'mixed'; title: string }) => (
    <div className="w-full flex flex-col items-center mb-8 print:mb-0 print:break-after-page">
      <div className="w-full max-w-[1120px] mb-2 flex justify-between items-baseline px-1 no-print">
        <h2 className="text-sm font-bold text-[#073D24] uppercase tracking-wide flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs font-normal text-[#5A675F] lowercase">(12 cédulas por folha)</span>
        </h2>
        <span className="text-xs text-[#5A675F]">Folha A4 Paisagem · 297mm × 210mm</span>
      </div>

      <div
        className="w-full max-w-[1120px] aspect-[1.414/1] bg-white rounded-2xl shadow-xl border border-[#CBD5CE] p-3 sm:p-4 flex flex-col relative print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none print:w-screen print:h-screen print:max-w-none print:aspect-auto"
        style={{ boxSizing: 'border-box' }}
      >
        <div className="w-full h-full grid grid-cols-4 grid-rows-3 gap-2 relative">
          {Array.from({ length: 12 }).map((_, idx) => {
            const col = idx % 4;
            const itemRole = role === 'mixed' ? (col < 2 ? 'presb' : 'diac') : role;
            return (
              <div key={idx} className="h-full w-full min-h-0 min-w-0">
                <SingleBallot role={itemRole} />
              </div>
            );
          })}

          {/* Cutting Guide Lines (Dashed, never overlapping text) */}
          <div className="absolute top-0 bottom-0 left-1/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-2/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />
          <div className="absolute top-0 bottom-0 left-3/4 -translate-x-1/2 w-px border-l border-dashed border-gray-400 pointer-events-none" />

          <div className="absolute left-0 right-0 top-1/3 -translate-y-1/2 h-px border-t border-dashed border-gray-400 pointer-events-none" />
          <div className="absolute left-0 right-0 top-2/3 -translate-y-1/2 h-px border-t border-dashed border-gray-400 pointer-events-none" />
        </div>
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
              Cédulas de Votação Separadas (1° Nomes)
              <span className="text-xs bg-[#0A5C36] px-2 py-0.5 rounded-md font-sans text-white border border-white/20">
                12 por Folha A4
              </span>
            </h1>
            <span className="text-xs text-[#A9CDB6]">
              Presbíteros e Diáconos separados · 1° nomes apenas · A4 Paisagem
            </span>
          </div>
        </div>

        {/* View Mode Selector Tabs */}
        <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              viewMode === 'all' ? 'bg-[#9FD3B1] text-[#073D24] shadow-xs' : 'text-[#CFE3D6] hover:text-white'
            }`}
          >
            Ambas as Folhas
          </button>
          <button
            onClick={() => setViewMode('presb')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              viewMode === 'presb' ? 'bg-[#9FD3B1] text-[#073D24] shadow-xs' : 'text-[#CFE3D6] hover:text-white'
            }`}
          >
            Presbíteros
          </button>
          <button
            onClick={() => setViewMode('diac')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              viewMode === 'diac' ? 'bg-[#9FD3B1] text-[#073D24] shadow-xs' : 'text-[#CFE3D6] hover:text-white'
            }`}
          >
            Diáconos
          </button>
          <button
            onClick={() => setViewMode('mixed')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              viewMode === 'mixed' ? 'bg-[#9FD3B1] text-[#073D24] shadow-xs' : 'text-[#CFE3D6] hover:text-white'
            }`}
          >
            Mista (6+6)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadPdf(viewMode)}
            className="h-9 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 cursor-pointer transition-all"
            title="Baixar arquivo PDF vetorizado"
          >
            <FileDown className="w-4 h-4" />
            <span>Baixar PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-4 rounded-xl bg-[#9FD3B1] hover:bg-[#8ecba3] text-[#073D24] text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
            title="Imprimir cédulas agora"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Agora</span>
          </button>
        </div>
      </header>

      {/* Main A4 Sheets Area */}
      <main className="w-full flex-1 flex flex-col items-center p-4 sm:p-8 print:p-0">
        {(viewMode === 'all' || viewMode === 'presb') && (
          <RenderSheet role="presb" title="Folha 1 · Cédulas de Presbítero (Até 2 votos)" />
        )}

        {(viewMode === 'all' || viewMode === 'diac') && (
          <RenderSheet role="diac" title="Folha 2 · Cédulas de Diácono (Até 3 votos)" />
        )}

        {viewMode === 'mixed' && (
          <RenderSheet role="mixed" title="Folha Mista · Presbíteros (Cols 1-2) + Diáconos (Cols 3-4)" />
        )}
      </main>

      {/* Global Print Styles for A4 Landscape with Automatic Page Break */}
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
