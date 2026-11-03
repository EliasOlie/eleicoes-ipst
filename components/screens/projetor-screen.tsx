'use client';

import React from 'react';
import { useElection } from '@/context/election-context';

export function ProjetorScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    published,
    counted,
    majority,
    blanks,
    resDiac,
    resPresb,
    vagasDiac,
    vagasPresb,
    votingOpen,
    isCompleted,
    restartSimulation,
    simulationActive,
    setSimulationActive,
  } = useElection();

  const maxV = Math.max(1, published);
  const majPct = `${Math.min(100, (majority / maxV) * 100)}%`;

  const liveColor = !votingOpen ? '#E8C46A' : isCompleted ? '#C9D3CC' : '#7EE0A0';
  const liveLabel = !votingOpen
    ? 'Aguardando quórum'
    : isCompleted
    ? 'Apuração encerrada'
    : 'Apuração ao vivo';

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[1360px] mx-auto' : ''}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">
          04 · Apresentação (projetor) — apuração em tempo real
        </div>
      )}
      <div className="w-[1280px] max-w-full min-h-[720px] rounded-2xl bg-[#073D24] text-white overflow-hidden flex flex-col p-8 md:p-11 md:px-14 gap-8 shadow-2xl mx-auto border border-emerald-950/40">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 pb-2 border-b border-white/10">
          <div className="flex items-center gap-5 md:gap-6">
            <img
              src="/assets/ipst_logo.jpg"
              alt="IPST"
              className="w-16 h-16 md:w-[84px] md:h-[84px] rounded-2xl object-cover block shadow-lg border border-white/10"
            />
            <div className="flex flex-col gap-1.5">
              <div className="text-xs md:text-base tracking-[.1em] uppercase text-[#A9CDB6] font-semibold">
                Igreja Presbiteriana de Serra Talhada
              </div>
              <div className="font-serif text-3xl md:text-[44px] font-semibold leading-[1.05] tracking-tight">
                Eleição de Oficiais 2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 text-sm md:text-base font-semibold backdrop-blur-md self-start sm:self-auto border border-white/10">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: liveColor }}
            ></span>
            <span>{liveLabel}</span>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 px-5 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/5 backdrop-blur-xs">
            <span className="text-sm md:text-[15px] text-[#A9CDB6]">Membros aptos (ata)</span>
            <span className="text-3xl md:text-[40px] font-bold tabular-nums tracking-tight">
              {published}
            </span>
          </div>
          <div className="p-4 px-5 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/5 backdrop-blur-xs">
            <span className="text-sm md:text-[15px] text-[#A9CDB6]">Cédulas apuradas</span>
            <span className="text-3xl md:text-[40px] font-bold tabular-nums tracking-tight">
              {counted}{' '}
              <span className="text-lg md:text-[22px] text-[#A9CDB6] font-normal">
                / {published}
              </span>
            </span>
          </div>
          <div className="p-4 px-5 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/5 backdrop-blur-xs">
            <span className="text-sm md:text-[15px] text-[#A9CDB6]">Maioria absoluta</span>
            <span className="text-3xl md:text-[40px] font-bold tabular-nums tracking-tight">
              {majority}{' '}
              <span className="text-lg md:text-[22px] text-[#A9CDB6] font-normal">votos</span>
            </span>
          </div>
        </div>

        {/* Results Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 min-h-0">
          {/* Diaconato Column */}
          <div className="flex flex-col gap-4 bg-black/10 p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
              <span className="font-serif text-2xl md:text-[28px] font-semibold text-white">
                Diaconato
              </span>
              <span className="text-sm md:text-base text-[#A9CDB6] font-medium">
                {vagasDiac} vagas
              </span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {resDiac.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#A9CDB6] bg-white/5 rounded-xl">
                  Aguardando cadastro de candidatos ao diaconato...
                </div>
              ) : (
                resDiac.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="text-base md:text-xl font-semibold flex items-center gap-2.5">
                        <span>{r.name}</span>
                        {r.elected && (
                          <span className="text-[11px] md:text-xs font-bold tracking-[.08em] px-2 py-0.5 rounded-md bg-[#E8F3EC] text-[#073D24] shadow-xs">
                            ELEITO
                          </span>
                        )}
                      </span>
                      <span className="text-base md:text-xl font-bold tabular-nums text-[#9FD3B1]">
                        {r.votes}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2.5 rounded-full bg-white/12 relative overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: r.width,
                          backgroundColor: r.bar,
                        }}
                      ></div>
                      {/* Majority indicator line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white opacity-70"
                        style={{ left: majPct }}
                        title="Linha da maioria absoluta"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Presbiterato Column */}
          <div className="flex flex-col gap-4 bg-black/10 p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-baseline border-b border-white/10 pb-2">
              <span className="font-serif text-2xl md:text-[28px] font-semibold text-white">
                Presbiterato
              </span>
              <span className="text-sm md:text-base text-[#A9CDB6] font-medium">
                {vagasPresb} vagas
              </span>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto pr-1">
              {resPresb.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#A9CDB6] bg-white/5 rounded-xl">
                  Aguardando cadastro de candidatos ao presbiterato...
                </div>
              ) : (
                resPresb.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="text-base md:text-xl font-semibold flex items-center gap-2.5">
                        <span>{r.name}</span>
                        {r.elected && (
                          <span className="text-[11px] md:text-xs font-bold tracking-[.08em] px-2 py-0.5 rounded-md bg-[#E8F3EC] text-[#073D24] shadow-xs">
                            ELEITO
                          </span>
                        )}
                      </span>
                      <span className="text-base md:text-xl font-bold tabular-nums text-[#9FD3B1]">
                        {r.votes}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2.5 rounded-full bg-white/12 relative overflow-hidden">
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: r.width,
                          backgroundColor: r.bar,
                        }}
                      ></div>
                      {/* Majority indicator line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white opacity-70"
                        style={{ left: majPct }}
                        title="Linha da maioria absoluta"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sub-footer controls inside Presb column */}
            <div className="mt-auto pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs md:text-sm text-[#A9CDB6] border-t border-white/10">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-white inline-block rounded-xs"></span>
                Linha branca = maioria absoluta. Votos em branco: {blanks}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimulationActive(!simulationActive)}
                  className="h-9 px-3.5 rounded-lg border border-white/30 bg-white/5 hover:bg-white/15 text-white text-xs cursor-pointer transition-colors"
                >
                  {simulationActive ? 'Pausar' : 'Continuar'}
                </button>
                <button
                  onClick={restartSimulation}
                  className="h-9 px-3.5 rounded-lg border border-white/30 bg-transparent hover:bg-white/10 text-white text-xs cursor-pointer transition-colors"
                >
                  Reiniciar simulação
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
