'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { getInitials } from '@/lib/mock-data';
import Link from 'next/link';

export function AdminCandidatosScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    diac,
    presb,
    vd,
    vp,
    setVd,
    setVp,
    addCandidate,
    removeCandidate,
    votingOpen,
    statusLabel,
    statusColor,
    statusBg,
  } = useElection();

  const [newDiacName, setNewDiacName] = useState('');
  const [newPresbName, setNewPresbName] = useState('');

  const editNote = votingOpen
    ? 'Votação liberada: alterações bloqueadas até o encerramento.'
    : 'Alterações permitidas até a liberação da votação.';

  const handleAddDiac = () => {
    if (newDiacName.trim()) {
      addCandidate('diac', newDiacName.trim());
      setNewDiacName('');
    }
  };

  const handleAddPresb = () => {
    if (newPresbName.trim()) {
      addCandidate('presb', newPresbName.trim());
      setNewPresbName('');
    }
  };

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[1440px] mx-auto' : ''}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">05 · Candidatos e vagas</div>
      )}
      <div className="w-[1440px] max-w-full min-h-[900px] rounded-2xl overflow-hidden flex flex-col md:flex-row bg-[#F6F8F5] shadow-[0_1px_0_#D5DCD7,0_20px_50px_rgba(7,61,36,.12)] mx-auto border border-[#DCE3DE]">
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
            <div className="p-3 px-3.5 rounded-xl bg-white/14 text-sm font-semibold cursor-default">
              Candidatos e vagas
            </div>
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
          </div>

          <div className="mt-auto text-xs leading-[1.5] text-[#A9CDB6] pt-6 border-t border-white/10">
            Conselho da Igreja
            <br />
            Acesso administrativo
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 p-6 md:p-10 md:px-12 flex flex-col gap-7 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-2xl md:text-[32px] font-semibold text-[#15201A]">
                Candidatos e vagas
              </h3>
              <div className="text-sm md:text-[15px] text-[#4A574F]">
                Assembleia Geral Extraordinária · Eleição de diáconos e presbíteros
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-1.5">
              <span
                className="px-3 py-1.5 rounded-full text-[13px] font-bold self-start sm:self-auto"
                style={{ backgroundColor: statusBg, color: statusColor }}
              >
                {statusLabel}
              </span>
              <span className="text-xs text-[#6B776F]">{editNote}</span>
            </div>
          </div>

          {/* 2 Column Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Diaconato Card */}
            <div className="bg-white border border-[#DCE3DE] rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
              <div className="flex justify-between items-center gap-4 border-b border-[#EEF1EE] pb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-2xl font-semibold text-[#15201A]">Diaconato</span>
                  <span className="text-xs md:text-[13px] text-[#6B776F]">
                    {diac.length} candidatos · cada membro vota em até {vd}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-[#4A574F]">Vagas</span>
                  <div className="flex items-center border-[1.5px] border-[#CBD5CE] rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setVd((v) => Math.max(1, v - 1))}
                      disabled={votingOpen}
                      className="w-10 h-10 border-none bg-white text-lg font-semibold cursor-pointer hover:bg-[#EEF4F0] disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-11 text-center text-lg font-bold text-[#0A5C36] tabular-nums">
                      {vd}
                    </span>
                    <button
                      onClick={() => setVd((v) => Math.min(diac.length, v + 1))}
                      disabled={votingOpen}
                      className="w-10 h-10 border-none bg-white text-lg font-semibold cursor-pointer hover:bg-[#EEF4F0] disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div className="flex flex-col divide-y divide-[#EEF1EE] max-h-[380px] overflow-y-auto pr-1">
                {diac.map(([id, name]) => (
                  <div key={id} className="flex items-center gap-3.5 py-3">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-[#DCE9E0] text-[#0A5C36] flex items-center justify-center font-bold text-sm">
                      {getInitials(name)}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-[#15201A]">{name}</span>
                    <button
                      onClick={() => removeCandidate('diac', id)}
                      disabled={votingOpen}
                      className="h-8.5 px-3 rounded-lg border border-[#DCE3DE] bg-white hover:bg-[#FBF1EF] text-[#8A3B2E] text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Input */}
              <div className="flex gap-2.5 pt-2">
                <input
                  type="text"
                  value={newDiacName}
                  onChange={(e) => setNewDiacName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDiac()}
                  placeholder="Nome completo do candidato"
                  disabled={votingOpen}
                  className="flex-1 h-11 rounded-xl border-[1.5px] border-[#CBD5CE] px-3.5 text-[15px] bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36] disabled:bg-gray-100"
                />
                <button
                  onClick={handleAddDiac}
                  disabled={votingOpen || !newDiacName.trim()}
                  className="h-11 px-4.5 border-none rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {/* Presbiterato Card */}
            <div className="bg-white border border-[#DCE3DE] rounded-2xl p-6 flex flex-col gap-5 shadow-xs">
              <div className="flex justify-between items-center gap-4 border-b border-[#EEF1EE] pb-4">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-2xl font-semibold text-[#15201A]">Presbiterato</span>
                  <span className="text-xs md:text-[13px] text-[#6B776F]">
                    {presb.length} candidatos · cada membro vota em até {vp}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-[#4A574F]">Vagas</span>
                  <div className="flex items-center border-[1.5px] border-[#CBD5CE] rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setVp((v) => Math.max(1, v - 1))}
                      disabled={votingOpen}
                      className="w-10 h-10 border-none bg-white text-lg font-semibold cursor-pointer hover:bg-[#EEF4F0] disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-11 text-center text-lg font-bold text-[#0A5C36] tabular-nums">
                      {vp}
                    </span>
                    <button
                      onClick={() => setVp((v) => Math.min(presb.length, v + 1))}
                      disabled={votingOpen}
                      className="w-10 h-10 border-none bg-white text-lg font-semibold cursor-pointer hover:bg-[#EEF4F0] disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Candidates List */}
              <div className="flex flex-col divide-y divide-[#EEF1EE] max-h-[380px] overflow-y-auto pr-1">
                {presb.map(([id, name]) => (
                  <div key={id} className="flex items-center gap-3.5 py-3">
                    <span className="w-10 h-10 shrink-0 rounded-full bg-[#DCE9E0] text-[#0A5C36] flex items-center justify-center font-bold text-sm">
                      {getInitials(name)}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-[#15201A]">{name}</span>
                    <button
                      onClick={() => removeCandidate('presb', id)}
                      disabled={votingOpen}
                      className="h-8.5 px-3 rounded-lg border border-[#DCE3DE] bg-white hover:bg-[#FBF1EF] text-[#8A3B2E] text-[13px] font-semibold cursor-pointer transition-colors disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Input */}
              <div className="flex gap-2.5 pt-2">
                <input
                  type="text"
                  value={newPresbName}
                  onChange={(e) => setNewPresbName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPresb()}
                  placeholder="Nome completo do candidato"
                  disabled={votingOpen}
                  className="flex-1 h-11 rounded-xl border-[1.5px] border-[#CBD5CE] px-3.5 text-[15px] bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36] disabled:bg-gray-100"
                />
                <button
                  onClick={handleAddPresb}
                  disabled={votingOpen || !newPresbName.trim()}
                  className="h-11 px-4.5 border-none rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
