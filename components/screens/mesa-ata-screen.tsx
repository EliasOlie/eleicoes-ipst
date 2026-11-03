'use client';

import React from 'react';
import { useElection } from '@/context/election-context';

export function MesaAtaScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    loggedCount,
    confirmedCount,
    pendingCount,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredMembers,
    toggleMemberCheck,
    publishQuorum,
    relockVoting,
    votingOpen,
    published,
    publishedAt,
  } = useElection();

  const publishLabel = votingOpen ? 'Reenviar quórum' : 'Aprovar quórum e liberar votação';
  const publishedNote = votingOpen
    ? `Votação liberada · ${published} membros às ${publishedAt}`
    : 'Votação bloqueada aguardando quórum';

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[420px] mx-auto' : ''}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">03 · Conferência de ata (mesa)</div>
      )}
      <div className="w-[390px] max-w-full h-[800px] rounded-[46px] border-[10px] border-[#121714] bg-[#FBFCFA] overflow-hidden flex flex-col shadow-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#073D24] text-white p-5 pt-12 pb-4.5 flex flex-col gap-3.5 shrink-0">
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px] text-[#CFE3D6]">Mesa · Secretário</div>
            <div className="font-serif text-2xl font-semibold">Conferência de ata</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white/10 flex flex-col gap-0.5 backdrop-blur-xs">
              <span className="text-[22px] font-bold">{loggedCount}</span>
              <span className="text-[11px] text-[#CFE3D6]">Presentes</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 flex flex-col gap-0.5 backdrop-blur-xs">
              <span className="text-[22px] font-bold text-[#9FD3B1]">{confirmedCount}</span>
              <span className="text-[11px] text-[#CFE3D6]">Conferem</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 flex flex-col gap-0.5 backdrop-blur-xs">
              <span className="text-[22px] font-bold text-amber-300">{pendingCount}</span>
              <span className="text-[11px] text-[#CFE3D6]">Pendentes</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 px-5 pb-2 flex flex-col gap-2.5 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nome ou telefone"
            className="h-[46px] rounded-xl border-[1.5px] border-[#CBD5CE] px-3.5 text-[15px] bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#073D24]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`h-[34px] px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors ${
                filter === 'all'
                  ? 'bg-[#073D24] text-white border-[#073D24]'
                  : 'bg-white text-[#15201A] border-[#CBD5CE]'
              }`}
            >
              Todos ({loggedCount})
            </button>
            <button
              onClick={() => setFilter('pend')}
              className={`h-[34px] px-3.5 rounded-full border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors ${
                filter === 'pend'
                  ? 'bg-[#073D24] text-white border-[#073D24]'
                  : 'bg-white text-[#15201A] border-[#CBD5CE]'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-3 divide-y divide-[#E6ECE8]">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#6B776F]">
              Nenhum membro encontrado.
            </div>
          ) : (
            filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMemberCheck(m.id)}
                className="w-full flex items-center gap-3 min-h-[60px] p-2 bg-transparent hover:bg-[#F4F7F5] text-left cursor-pointer transition-colors rounded-lg"
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center text-base font-bold transition-all ${
                    m.checked
                      ? 'border-[#0A5C36] bg-[#0A5C36] text-white'
                      : 'border-[#9AA8A0] bg-white text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="text-[15px] font-semibold text-[#15201A] truncate">{m.name}</span>
                  <span className="text-[13px] text-[#5A675F] tabular-nums">{m.phone}</span>
                </span>
                <span className="text-xs text-[#7A867E] tabular-nums shrink-0">{m.time}</span>
              </button>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 px-5 pb-7 border-t border-[#E2E8E4] bg-white flex flex-col gap-2.5 shrink-0">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-[#4A574F]">Membros aptos a votar</span>
            <span className="text-2xl font-bold text-[#0A5C36] tabular-nums">{confirmedCount}</span>
          </div>
          <button
            onClick={publishQuorum}
            className="h-[54px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-colors shadow-md active:scale-[0.99]"
          >
            {publishLabel}
          </button>
          <div className="flex justify-center items-center gap-2 text-xs text-[#6B776F] text-center">
            <span>{publishedNote}</span>
            {votingOpen && (
              <button
                onClick={relockVoting}
                className="bg-transparent border-none p-0 text-[#0A5C36] hover:text-[#073D24] font-semibold text-xs cursor-pointer underline underline-offset-2"
              >
                Bloquear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
