'use client';

import React, { useMemo, useState } from 'react';
import { useElection } from '@/context/election-context';
import { PaperBallotModal } from '@/components/paper-ballot-modal';
import { FileText, UserPlus, X, CheckCircle2, Edit3 } from 'lucide-react';
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
    setTotalComungantes,
    quorumAtingido,
    authChecked,
    actionError,
    clearActionError,
    members,
    refreshState,
    markPaperHanded,
    paperHanded,
    paperCounted,
  } = useElection();

  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRollModal, setShowRollModal] = useState(false);
  const [editingRoll, setEditingRoll] = useState(String(totalComungantes));
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addError, setAddError] = useState('');

  // Nomes iguais (sem acento/espaços) aparecem em destaque: pode ser a mesma pessoa
  // cadastrada com telefones diferentes — confira no livro antes de marcar.
  const duplicateNames = useMemo(() => {
    const norm = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const counts = new Map<string, number>();
    members.forEach((m) => counts.set(norm(m.name), (counts.get(norm(m.name)) || 0) + 1));
    return new Set(members.filter((m) => (counts.get(norm(m.name)) || 0) > 1).map((m) => m.id));
  }, [members]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || addingMember) return;
    setAddingMember(true);
    setAddError('');
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
        refreshState();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddError(
          res.status === 401
            ? 'Sessão expirada. Entre novamente.'
            : data.error || 'Não foi possível cadastrar.'
        );
      }
    } catch {
      setAddError('Falha de conexão: o membro NÃO foi cadastrado.');
    } finally {
      setAddingMember(false);
    }
  };

  const handlePublish = () => {
    const msg = votingOpen
      ? `Reenviar o quórum com ${confirmedCount} membros conferidos?`
      : `Liberar a votação agora com ${confirmedCount} membros conferidos na ata?`;
    if (window.confirm(msg)) publishQuorum();
  };

  const handlePaperHandout = (id: number, name: string) => {
    if (
      window.confirm(
        `Entregar cédula de PAPEL para ${name}?\n\nA partir de agora este membro consta como "já votou" e NÃO conseguirá votar pelo celular.`
      )
    ) {
      markPaperHanded(id);
    }
  };

  const handleRelock = () => {
    if (window.confirm('Bloquear a votação? Ninguém conseguirá votar pelo celular até liberar de novo.')) {
      relockVoting();
    }
  };

  // A Mesa só funciona autenticada: sem login não mostra nomes/telefones nem
  // deixa "conferir" algo que o servidor recusaria.
  if (!authChecked || !isAdminAuthenticated) {
    return (
      <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[480px] mx-auto px-4' : 'w-[390px]'}`}>
        <div className="w-full bg-[#FBFCFA] rounded-3xl shadow-xl border border-[#DCE3DE] overflow-hidden flex flex-col">
          <div className="bg-[#073D24] text-white p-6 pt-10 flex flex-col gap-1">
            <div className="text-[13px] text-[#CFE3D6]">Mesa · Secretário</div>
            <div className="font-serif text-2xl font-semibold">Conferência de ata</div>
          </div>
          <div className="p-7 flex flex-col gap-4 items-center text-center">
            {!authChecked ? (
              <span className="text-sm text-[#6B776F]">Verificando sessão...</span>
            ) : (
              <>
                <span className="text-sm text-[#4A574F]">
                  Acesso restrito à Mesa. Entre com a senha para conferir a ata.
                </span>
                <Link
                  href="/admin/login?next=/mesa"
                  className="h-12 px-6 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold flex items-center justify-center"
                >
                  Entrar com senha
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleSaveRoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(editingRoll, 10);
    if (!isNaN(val) && val > 0) {
      await setTotalComungantes(val);
      setShowRollModal(false);
    }
  };

  const publishLabel = votingOpen
    ? `Reenviar quórum da ata (${confirmedCount} membros)`
    : quorumAtingido
    ? `Aprovar quórum da ata (${confirmedCount} membros) e liberar votação`
    : `Aprovar quórum da ata (${confirmedCount} membros · 2ª Convocação)`;

  const publishedNote = votingOpen
    ? `Votação liberada com ${published} votantes da ata às ${publishedAt}`
    : `Conferidos: ${confirmedCount} · Quórum 1ª conv.: ${quorumMinimo} (50% de ${totalComungantes} no rol)`;

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
              <div key={m.id} className="flex items-center gap-1.5">
              <button
                onClick={() => toggleMemberCheck(m.id)}
                disabled={m.hasVoted}
                title={m.hasVoted ? 'Já votou — a conferência não pode ser desfeita' : undefined}
                className="flex-1 min-w-0 flex items-center gap-3 min-h-[60px] p-2 bg-transparent hover:bg-[#F4F7F5] text-left cursor-pointer transition-colors rounded-lg disabled:cursor-default disabled:hover:bg-transparent"
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
                  <span className="text-[15px] font-semibold text-[#15201A] truncate flex items-center gap-1.5">
                    <span className="truncate">{m.name}</span>
                    {duplicateNames.has(m.id) && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        NOME REPETIDO
                      </span>
                    )}
                  </span>
                  <span className="text-[13px] text-[#5A675F] tabular-nums">
                    {m.phone || 'sem telefone · vota no papel'}
                  </span>
                </span>
                <span className="text-xs text-[#7A867E] tabular-nums shrink-0">{m.time}</span>
              </button>
              {m.hasVoted ? (
                <span
                  className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md ${
                    m.votedOnPaper ? 'bg-[#FBF3DC] text-[#8A6A12]' : 'bg-[#E7F0EA] text-[#0A5C36]'
                  }`}
                >
                  {m.votedOnPaper ? 'VOTOU · PAPEL' : 'VOTOU · APP'}
                </span>
              ) : (
                votingOpen &&
                m.checked && (
                  <button
                    type="button"
                    onClick={() => handlePaperHandout(m.id, m.name)}
                    className="shrink-0 h-8 px-2 rounded-lg border border-[#CBD5CE] hover:border-[#8A6A12] bg-white text-[11px] font-semibold text-[#8A6A12] flex items-center gap-1 cursor-pointer"
                    title="Entregar cédula de papel a este membro"
                  >
                    <FileText size={12} />
                    Papel
                  </button>
                )
              )}
              </div>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 px-5 pb-7 border-t border-[#E2E8E4] bg-white flex flex-col gap-2.5 shrink-0">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex justify-between items-start gap-2">
              <span>{actionError}</span>
              <button type="button" onClick={clearActionError} className="text-red-500 hover:text-red-700 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[#4A574F]">Conferidos no Livro</span>
              {isAdminAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoll(String(totalComungantes));
                    setShowRollModal(true);
                  }}
                  className="text-[11px] text-[#0A5C36] hover:bg-[#D5E6DB] font-semibold cursor-pointer flex items-center gap-1 bg-[#EEF4F0] px-2 py-0.5 rounded-md transition-colors"
                  title="Ajustar número oficial do rol de comungantes constante na ata"
                >
                  <Edit3 size={10} />
                  <span>Rol: {totalComungantes}</span>
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0A5C36] tabular-nums">{confirmedCount}</span>
              <span className="text-xs text-[#7A867E]">
                de {quorumMinimo} ({quorumAtingido ? '✓ 50% atingido' : '50% 1ª conv.'})
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handlePublish}
              className="h-[52px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-colors shadow-md active:scale-[0.99]"
            >
              {publishLabel}
            </button>

            {isAdminAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  refreshState();
                  setShowPaperModal(true);
                }}
                className="h-[42px] rounded-xl border border-[#CBD5CE] hover:border-[#0A5C36] bg-[#F6F8F5] text-xs font-semibold text-[#15201A] flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs"
              >
                <FileText size={15} className="text-[#0A5C36]" />
                <span>Escrutínio de Cédula Física de Papel</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-[#CBD5CE] tabular-nums">
                  {paperCounted}/{paperHanded} apuradas
                </span>
              </button>
            )}
          </div>

          <div className="flex justify-center items-center gap-2 text-xs text-[#6B776F] text-center pt-1">
            <span>{publishedNote}</span>
            {votingOpen && (
              <button
                onClick={handleRelock}
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
              {addError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {addError}
                </div>
              )}
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
                Telefone (opcional — sem telefone, o membro vota só no papel)
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

      {/* Edit Roll Modal */}
      {showRollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div className="font-semibold text-sm text-[#15201A]">Rol Oficial da Igreja (Ata do Conselho)</div>
              <button
                type="button"
                onClick={() => setShowRollModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveRoll} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-700">
                Total de membros comungantes no rol da igreja
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={editingRoll}
                  onChange={(e) => setEditingRoll(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#073D24]"
                  required
                />
                <span className="text-[11px] text-[#6B776F] mt-1">
                  O quórum de 50% para 1ª convocação será recalculado automaticamente para{' '}
                  <strong className="text-[#073D24]">{Math.ceil((parseInt(editingRoll, 10) || 0) * 0.5)} membros</strong>.
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRollModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A5C36] hover:bg-[#073D24] text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Atualizar Rol
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
