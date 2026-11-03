'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { PaperBallotModal } from '@/components/paper-ballot-modal';
import { FileText, UserPlus, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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
    isAdminAuthenticated,
    quorumMinimo,
    totalComungantes,
    quorumAtingido,
  } = useElection();

  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || addingMember) return;
    setAddingMember(true);
    try {
      const res = await fetch('/api/election/mesa/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: manualName, phone: manualPhone }),
      });
      if (res.ok) {
        setManualName('');
        setManualPhone('');
        setShowAddModal(false);
      }
    } catch {
      // Ignored
    } finally {
      setAddingMember(false);
    }
  };

  const publishLabel = votingOpen ? 'Reenviar quórum' : 'Aprovar quórum (50%) e liberar votação';
  const publishedNote = votingOpen
    ? `Votação liberada · ${published} membros às ${publishedAt}`
    : `Quórum 50%: ${confirmedCount} de ${quorumMinimo} necessários`;

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[480px] mx-auto' : 'w-[390px]'}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">03 · Conferência de ata (mesa)</div>
      )}
      <div className={`w-full bg-[#FBFCFA] overflow-hidden flex flex-col ${
        standalone
          ? 'min-h-screen sm:min-h-[780px] sm:rounded-3xl sm:shadow-xl sm:border sm:border-[#DCE3DE]'
          : 'min-h-[780px] rounded-2xl shadow-md border border-[#DCE3DE]'
      }`}>
        {/* Header */}
        <div className="bg-[#073D24] text-white p-5 pt-12 pb-4.5 flex flex-col gap-3.5 shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <div className="text-[13px] text-[#CFE3D6]">Mesa · Secretário</div>
              <div className="font-serif text-2xl font-semibold">Conferência de ata</div>
            </div>
            {isAdminAuthenticated ? (
              <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-md text-[#9FD3B1] font-semibold border border-white/10">
                Sessão Ativa ✓
              </span>
            ) : (
              <Link
                href="/admin/login"
                className="text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md text-[#CFE3D6] hover:text-white font-medium transition-colors border border-white/10"
              >
                Entrar
              </Link>
            )}
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
          <div className="flex items-center justify-between gap-2">
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

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-[34px] px-3 rounded-full bg-white border border-[#CBD5CE] hover:border-[#0A5C36] text-[12px] font-semibold text-[#0A5C36] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <UserPlus size={13} />
                <span>+ Manual</span>
              </button>
            )}
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
            <span className="text-sm text-[#4A574F]">Membros aptos no rol</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0A5C36] tabular-nums">{confirmedCount}</span>
              <span className="text-xs text-[#7A867E]">de {quorumMinimo} (50%)</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={publishQuorum}
              className="h-[52px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-colors shadow-md active:scale-[0.99]"
            >
              {publishLabel}
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => setShowPaperModal(true)}
                className="h-[42px] rounded-xl border border-[#CBD5CE] hover:border-[#0A5C36] bg-[#F6F8F5] text-xs font-semibold text-[#15201A] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <FileText size={15} className="text-[#0A5C36]" />
                <span>Escrutínio de Cédula Física de Papel</span>
              </button>
            )}
          </div>

          <div className="flex justify-center items-center gap-2 text-xs text-[#6B776F] text-center pt-1">
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

      {/* Manual Member Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="font-semibold text-sm text-[#15201A]">Cadastrar Membro do Livro</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Nome completo
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Como assinou no livro de atas"
                  className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#073D24]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Telefone (opcional)
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="(87) 9 0000-0000"
                  className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#073D24]"
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingMember}
                  className="px-4 py-2 bg-[#0A5C36] hover:bg-[#073D24] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {addingMember ? 'Salvando...' : 'Confirmar Presença'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Paper Ballot Modal */}
      <PaperBallotModal
        isOpen={showPaperModal}
        onClose={() => setShowPaperModal(false)}
      />
    </div>
  );
}
