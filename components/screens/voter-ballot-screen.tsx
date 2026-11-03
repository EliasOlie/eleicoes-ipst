'use client';

import React, { useEffect } from 'react';
import { useElection } from '@/context/election-context';
import { getInitials } from '@/lib/mock-data';
import confetti from 'canvas-confetti';
import { Check } from 'lucide-react';

export function VoterBallotScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    loggedMember,
    ballotStep,
    setBallotStep,
    ballotTab,
    setBallotTab,
    selection,
    toggleCandidateSelection,
    confirmVote,
    resetBallot,
    receipt,
    diac,
    presb,
    vd,
    vp,
  } = useElection();

  const firstName = (loggedMember || 'Maria').split(' ')[0];

  const currentList = ballotTab === 'diac' ? diac : presb;
  const currentLimit = ballotTab === 'diac' ? vd : vp;
  const currentSelection = ballotTab === 'diac' ? selection.diac : selection.presb;

  const isVote = ballotStep === 'vote';
  const isReview = ballotStep === 'review';
  const isDone = ballotStep === 'done';

  useEffect(() => {
    if (isDone) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0A5C36', '#9FD3B1', '#073D24', '#ffffff'],
        });
      } catch (e) {
        // Fallback
      }
    }
  }, [isDone]);

  const getCandidateNames = (list: [string, string, number][], ids: string[]) => {
    if (!ids.length) return ['Em branco'];
    return ids.map((id) => {
      const match = list.find((c) => c[0] === id);
      return match ? match[1] : id;
    });
  };

  const reviewDiacNames = getCandidateNames(diac, selection.diac);
  const reviewPresbNames = getCandidateNames(presb, selection.presb);

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[440px] mx-auto' : 'w-[390px]'}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">02b · Cédula liberada</div>
      )}
      <div className={`w-full bg-[#FBFCFA] overflow-hidden flex flex-col ${
        standalone
          ? 'min-h-screen sm:min-h-[780px] sm:rounded-3xl sm:shadow-xl sm:border sm:border-[#DCE3DE]'
          : 'min-h-[780px] rounded-2xl shadow-md border border-[#DCE3DE]'
      }`}>
        {/* Header */}
        <div className="bg-[#0A5C36] text-white p-6 pt-12 pb-5 flex flex-col gap-3.5 shrink-0">
          <div className="flex justify-between items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="text-[13px] text-[#CFE3D6]">Olá, {firstName}</div>
              <div className="font-serif text-2xl font-semibold">Sua cédula</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/14 text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-xs bg-[#9FD3B1]"></span>
              Voto secreto
            </div>
          </div>
        </div>

        {/* STEP: VOTE */}
        {isVote && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Tabs */}
            <div className="p-4 px-5 pb-0 flex gap-2 shrink-0">
              <button
                onClick={() => setBallotTab('diac')}
                className={`flex-1 h-12 rounded-xl border-[1.5px] font-semibold text-[15px] cursor-pointer transition-all ${
                  ballotTab === 'diac'
                    ? 'bg-[#0A5C36] text-white border-[#0A5C36]'
                    : 'bg-white text-[#15201A] border-[#CBD5CE]'
                }`}
              >
                Diaconato · {selection.diac.length}/{vd}
              </button>
              <button
                onClick={() => setBallotTab('presb')}
                className={`flex-1 h-12 rounded-xl border-[1.5px] font-semibold text-[15px] cursor-pointer transition-all ${
                  ballotTab === 'presb'
                    ? 'bg-[#0A5C36] text-white border-[#0A5C36]'
                    : 'bg-white text-[#15201A] border-[#CBD5CE]'
                }`}
              >
                Presbiterato · {selection.presb.length}/{vp}
              </button>
            </div>

            {/* Instruction */}
            <div className="p-4 px-5 py-2 text-sm text-[#4A574F] shrink-0">
              Escolha até {currentLimit} candidato{currentLimit > 1 ? 's' : ''} ao{' '}
              {ballotTab === 'diac' ? 'diaconato' : 'presbiterato'}. Você também pode deixar em branco.
            </div>

            {/* Candidates list */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-2.5">
              {currentList.map(([id, name]) => {
                const isSelected = currentSelection.includes(id);
                const isLimitReached = !isSelected && currentSelection.length >= currentLimit;

                return (
                  <button
                    key={id}
                    onClick={() => toggleCandidateSelection(id)}
                    disabled={isLimitReached}
                    style={{ opacity: isLimitReached ? 0.45 : 1 }}
                    className={`flex items-center gap-3.5 min-h-[68px] p-3 px-3.5 rounded-2xl border-[1.5px] text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0A5C36] bg-[#E7F0EA]'
                        : 'border-[#CBD5CE] bg-white hover:border-[#0A5C36]/50'
                    }`}
                  >
                    <span className="w-11 h-11 shrink-0 rounded-full bg-[#DCE9E0] text-[#0A5C36] flex items-center justify-center font-bold text-[15px]">
                      {getInitials(name)}
                    </span>
                    <span className="flex-1 text-base font-semibold text-[#15201A]">{name}</span>
                    <span
                      className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center text-base font-bold transition-all ${
                        isSelected
                          ? 'border-[#0A5C36] bg-[#0A5C36] text-white'
                          : 'border-[#9AA8A0] bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Button */}
            <div className="p-3.5 px-5 pb-7 border-t border-[#E2E8E4] bg-white shrink-0">
              <button
                onClick={() => setBallotStep('review')}
                className="w-full h-[54px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-colors shadow-md active:scale-[0.99]"
              >
                Revisar voto
              </button>
            </div>
          </div>
        )}

        {/* STEP: REVIEW */}
        {isReview && (
          <div className="flex flex-col flex-1 p-5 pb-7 gap-4.5 overflow-y-auto">
            <div className="font-serif text-[22px] font-semibold text-[#15201A]">
              Confira antes de confirmar
            </div>

            {/* Review Diaconato */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl border-[1.5px] border-[#CBD5CE] bg-white shadow-xs">
              <div className="text-xs font-bold tracking-[.08em] uppercase text-[#0A5C36]">
                Diaconato ({selection.diac.length}/{vd})
              </div>
              {reviewDiacNames.map((name, i) => (
                <div key={i} className="text-base text-[#15201A] font-medium py-0.5 border-b border-[#F0F3F1] last:border-none">
                  {name}
                </div>
              ))}
            </div>

            {/* Review Presbiterato */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl border-[1.5px] border-[#CBD5CE] bg-white shadow-xs">
              <div className="text-xs font-bold tracking-[.08em] uppercase text-[#0A5C36]">
                Presbiterato ({selection.presb.length}/{vp})
              </div>
              {reviewPresbNames.map((name, i) => (
                <div key={i} className="text-base text-[#15201A] font-medium py-0.5 border-b border-[#F0F3F1] last:border-none">
                  {name}
                </div>
              ))}
            </div>

            <div className="text-[13px] leading-[1.5] text-[#4A574F] bg-[#EEF4F0] p-3.5 rounded-xl">
              O voto é gravado sem qualquer vínculo com seu nome ou telefone. Depois de confirmado,
              não pode ser alterado.
            </div>

            <div className="mt-auto flex flex-col gap-2.5 pt-2">
              <button
                onClick={confirmVote}
                className="h-[54px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-colors shadow-md active:scale-[0.99]"
              >
                Confirmar voto
              </button>
              <button
                onClick={() => setBallotStep('vote')}
                className="h-[50px] border-[1.5px] border-[#CBD5CE] rounded-2xl bg-white hover:bg-[#F6F8F6] text-[#15201A] text-[15px] font-semibold cursor-pointer transition-colors"
              >
                Voltar e alterar
              </button>
            </div>
          </div>
        )}

        {/* STEP: DONE */}
        {isDone && (
          <div className="flex flex-col flex-1 p-7 pt-14 pb-7 gap-4.5 items-center text-center">
            <div className="w-[88px] h-[88px] rounded-full bg-[#0A5C36] text-white flex items-center justify-center text-[42px] shadow-lg animate-in zoom-in-75 duration-300">
              <Check size={48} strokeWidth={3} />
            </div>

            <div className="font-serif text-[28px] font-semibold text-[#15201A]">
              Voto registrado
            </div>

            <div className="text-[15px] leading-[1.5] text-[#4A574F]">
              Obrigado, {firstName}. Seu acesso foi encerrado. O resultado será apresentado no
              templo ao final da apuração.
            </div>

            {/* Receipt */}
            <div className="p-3.5 px-4.5 rounded-xl bg-[#EEF4F0] flex flex-col gap-1 w-full max-w-[280px] border border-[#0A5C36]/20">
              <div className="text-xs text-[#4A574F]">Comprovante de participação</div>
              <div className="font-mono text-lg font-bold tracking-[.08em] text-[#0A5C36]">
                {receipt}
              </div>
            </div>

            <div className="text-xs text-[#6B776F]">
              O comprovante confirma que você votou, não em quem.
            </div>

            <button
              onClick={resetBallot}
              className="mt-auto bg-transparent border-none text-[#0A5C36] hover:text-[#073D24] font-semibold text-sm cursor-pointer underline underline-offset-4"
            >
              Reiniciar mock / Novo voto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
