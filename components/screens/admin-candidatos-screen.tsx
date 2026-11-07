'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

export function AdminCandidatosScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    diac,
    presb,
    vd,
    vp,
    setVd,
    setVp,
    vagasDiac,
    vagasPresb,
    totalComungantes,
    setTotalComungantes,
    quorumMinimo,
    addCandidate,
    removeCandidate,
    votingOpen,
    adminUser,
    logoutAdmin,
    features,
    actionError,
    clearActionError,
  } = useElection();

  const [newDiacName, setNewDiacName] = useState('');
  const [newPresbName, setNewPresbName] = useState('');

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

  const content = (
    <div className="flex flex-col gap-8 max-w-5xl w-full">
      {/* Title & Info Banner */}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#15201A]">
          Candidatos e vagas
        </h2>
        <span className="text-sm text-[#4A574F]">
          Defina o número de vagas e a lista de oficiais indicados para a eleição
        </span>
      </div>

      {!adminUser && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <strong>Somente leitura:</strong> entre com a senha para alterar candidatos e vagas.{' '}
          <Link href="/admin/login" className="underline font-semibold">Entrar</Link>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-semibold flex justify-between gap-3">
          <span>{actionError}</span>
          <button onClick={clearActionError} className="cursor-pointer text-red-500">✕</button>
        </div>
      )}

      {votingOpen && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <span className="font-bold">⚠️ Votação em andamento:</span>
          A alteração de vagas e candidatos está bloqueada até que a eleição seja finalizada ou resetada.
        </div>
      )}

      {/* Vacancy & Quorum Steppers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Diaconato Vagas */}
        <div className="p-5 rounded-2xl bg-white border border-[#DCE3DE] shadow-xs flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-[#15201A]">Vagas para diácono</span>
            <span className="text-xs text-[#6B776F]">Quantidade a eleger</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVd((v: number) => Math.max(1, v - 1))}
              disabled={votingOpen || vd <= 1}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold tabular-nums text-[#15201A]">
              {vagasDiac}
            </span>
            <button
              onClick={() => setVd((v: number) => v + 1)}
              disabled={votingOpen}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Presbiterato Vagas */}
        <div className="p-5 rounded-2xl bg-white border border-[#DCE3DE] shadow-xs flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-[#15201A]">Vagas para presbítero</span>
            <span className="text-xs text-[#6B776F]">Quantidade a eleger</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVp((v: number) => Math.max(1, v - 1))}
              disabled={votingOpen || vp <= 1}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold tabular-nums text-[#15201A]">
              {vagasPresb}
            </span>
            <button
              onClick={() => setVp((v: number) => v + 1)}
              disabled={votingOpen}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Total Comungantes (Quorum 50%) */}
        <div className="p-5 rounded-2xl bg-white border border-[#DCE3DE] shadow-xs flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-[#15201A]">Membros no rol</span>
            <span className="text-xs text-[#6B776F]">Quórum 50%: {quorumMinimo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTotalComungantes((v: number) => Math.max(10, v - 10))}
              disabled={votingOpen || totalComungantes <= 10}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
              title="Diminuir 10 membros"
            >
              −
            </button>
            <span className="w-12 text-center text-xl font-bold tabular-nums text-[#15201A]">
              {totalComungantes}
            </span>
            <button
              onClick={() => setTotalComungantes((v: number) => v + 10)}
              disabled={votingOpen}
              className="w-9 h-9 rounded-xl border border-[#CBD5CE] bg-white hover:bg-gray-50 flex items-center justify-center font-bold text-lg text-[#15201A] cursor-pointer transition-colors disabled:opacity-40"
              title="Aumentar 10 membros"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Candidate Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diaconato Column */}
        <div className="p-6 rounded-2xl bg-white border border-[#DCE3DE] shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-baseline border-b border-[#CBD5CE] pb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#15201A]">Diaconato</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#0A5C36]">
                {diac.length} indicados
              </span>
            </div>
            <span className="text-xs text-[#6B776F]">Vagas: {vagasDiac}</span>
          </div>

          {/* Candidates List */}
          <div className="flex flex-col divide-y divide-[#EEF1EE] min-h-[140px]">
            {diac.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6B776F]">
                Nenhum candidato a diácono cadastrado.
              </div>
            ) : (
              diac.map(([id, name]) => (
                <div key={id} className="py-3 flex justify-between items-center group">
                  <span className="text-[15px] font-medium text-[#15201A]">{name}</span>
                  {!votingOpen && (
                    <button
                      onClick={() => removeCandidate('diac', id)}
                      className="p-1.5 rounded-lg text-[#6B776F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remover candidato"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Input */}
          <div className="flex gap-2.5 pt-2 border-t border-[#CBD5CE]">
            <input
              type="text"
              value={newDiacName}
              onChange={(e) => setNewDiacName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDiac()}
              placeholder="Nome completo do candidato"
              disabled={votingOpen}
              className="flex-1 h-11 rounded-xl border border-[#CBD5CE] px-3.5 text-sm bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36] disabled:bg-gray-100"
            />
            <button
              onClick={handleAddDiac}
              disabled={votingOpen || !newDiacName.trim()}
              className="h-11 px-4.5 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Presbiterato Column */}
        <div className="p-6 rounded-2xl bg-white border border-[#DCE3DE] shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-baseline border-b border-[#CBD5CE] pb-3">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold text-[#15201A]">Presbiterato</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E7F0EA] text-[#0A5C36]">
                {presb.length} indicados
              </span>
            </div>
            <span className="text-xs text-[#6B776F]">Vagas: {vagasPresb}</span>
          </div>

          {/* Candidates List */}
          <div className="flex flex-col divide-y divide-[#EEF1EE] min-h-[140px]">
            {presb.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6B776F]">
                Nenhum candidato a presbítero cadastrado.
              </div>
            ) : (
              presb.map(([id, name]) => (
                <div key={id} className="py-3 flex justify-between items-center group">
                  <span className="text-[15px] font-medium text-[#15201A]">{name}</span>
                  {!votingOpen && (
                    <button
                      onClick={() => removeCandidate('presb', id)}
                      className="p-1.5 rounded-lg text-[#6B776F] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remover candidato"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Input */}
          <div className="flex gap-2.5 pt-2 border-t border-[#CBD5CE]">
            <input
              type="text"
              value={newPresbName}
              onChange={(e) => setNewPresbName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPresb()}
              placeholder="Nome completo do candidato"
              disabled={votingOpen}
              className="flex-1 h-11 rounded-xl border border-[#CBD5CE] px-3.5 text-sm bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36] disabled:bg-gray-100"
            />
            <button
              onClick={handleAddPresb}
              disabled={votingOpen || !newPresbName.trim()}
              className="h-11 px-4.5 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              Adicionar
            </button>
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
              <div className="p-3 px-3.5 rounded-xl bg-white/15 text-sm font-semibold text-white shadow-xs">
                Candidatos e vagas
              </div>
              <Link
                href="/mesa"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Conferência de ata
              </Link>
              <Link
                href="/relatorios"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Resultados e gráficos
              </Link>
              <Link
                href="/boas-vindas"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Boas-vindas (Telão)
              </Link>
              <Link
                href="/projetor"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Apresentação (Telão)
              </Link>
              <Link
                href="/relatorio"
                className="p-3 px-3.5 rounded-xl text-sm text-[#CFE3D6] hover:bg-white/10 transition-colors"
              >
                Relatório executivo
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
        <div className="flex-1 min-w-0 bg-[#F6F8F5] p-6 sm:p-8 lg:p-12 overflow-y-auto min-h-screen flex flex-col items-center">
          {content}
        </div>
      </div>
    );
  }

  // Embedded view (e.g. inside /canvas preview)
  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[1440px] mx-auto">
      <div className="text-sm font-semibold text-[#4A574F]">05 · Candidatos e vagas</div>
      <div className="w-full rounded-2xl overflow-hidden flex flex-col md:flex-row bg-[#F6F8F5] shadow-xl border border-[#DCE3DE]">
        <div className="w-full md:w-[248px] shrink-0 bg-[#073D24] text-white p-6 flex flex-col gap-6">
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
            <div className="font-semibold text-white">Candidatos e vagas</div>
            <div>Conferência de ata</div>
            <div>Apresentação</div>
            <div>Relatório executivo</div>
          </div>
        </div>
        <div className="flex-1 p-6 sm:p-8">
          {content}
        </div>
      </div>
    </div>
  );
}
