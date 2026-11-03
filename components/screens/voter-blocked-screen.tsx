'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { Check } from 'lucide-react';

export function VoterBlockedScreen({ standalone = false }: { standalone?: boolean }) {
  const { loggedMember } = useElection();
  const firstName = (loggedMember || 'Maria').split(' ')[0];

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[440px] mx-auto' : 'w-[390px]'}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">
          02a · Cédula bloqueada (aguardando quórum)
        </div>
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

        {/* Content Body */}
        <div className="flex flex-col flex-1 p-7 pt-12 pb-7 gap-4.5 items-center text-center">
          {/* Lock Graphic */}
          <div className="w-[88px] h-[88px] rounded-full bg-[#EEF4F0] border-2 border-[#0A5C36] flex items-center justify-center shadow-inner">
            <div className="flex flex-col items-center">
              <div className="w-6 h-[18px] border-4 border-[#0A5C36] border-b-0 rounded-t-xl"></div>
              <div className="w-9 h-[26px] rounded-md bg-[#0A5C36]"></div>
            </div>
          </div>

          <div className="font-serif text-[26px] font-semibold leading-[1.2] text-[#15201A]">
            Votação ainda não liberada
          </div>

          <div className="text-[15px] leading-[1.55] text-[#4A574F]">
            Sua presença foi registrada. A cédula permanece bloqueada até que a mesa confira os
            membros presentes com o livro de atas, o quórum seja aprovado e a votação seja liberada.
          </div>

          {/* Timeline steps */}
          <div className="w-full flex flex-col rounded-2xl border-[1.5px] border-[#CBD5CE] bg-white text-left overflow-hidden mt-1 shadow-xs">
            <div className="flex items-center gap-3 p-3.5 px-4 border-b border-[#E6ECE8]">
              <span className="w-6 h-6 shrink-0 rounded-full bg-[#0A5C36] text-white flex items-center justify-center text-[13px] font-bold">
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="text-sm font-medium text-[#15201A]">Presença registrada</span>
            </div>
            <div className="flex items-center gap-3 p-3.5 px-4 border-b border-[#E6ECE8] bg-[#EEF4F0]/40">
              <span className="w-6 h-6 shrink-0 rounded-full border-2 border-[#0A5C36] flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#0A5C36] animate-pulse"></span>
              </span>
              <span className="text-sm font-semibold text-[#0A5C36]">
                Conferência da ata e aprovação do quórum
              </span>
            </div>
            <div className="flex items-center gap-3 p-3.5 px-4">
              <span className="w-6 h-6 shrink-0 rounded-full border-2 border-[#9AA8A0]"></span>
              <span className="text-sm text-[#6B776F]">Votação liberada</span>
            </div>
          </div>

          <div className="mt-auto text-[13px] text-[#6B776F] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            Mantenha esta tela aberta. Ela será liberada automaticamente.
          </div>
        </div>
      </div>
    </div>
  );
}
