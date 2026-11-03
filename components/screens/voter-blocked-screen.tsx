'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { Check, ArrowLeft, Shield, FileText, Monitor } from 'lucide-react';
import Link from 'next/link';

export function VoterBlockedScreen({ standalone = false }: { standalone?: boolean }) {
  const { loggedMember, resetBallot } = useElection();
  const firstName = (loggedMember || 'Membro').split(' ')[0];

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[460px] mx-auto px-4 py-6' : 'w-[390px]'}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">
          02a · Cédula bloqueada (aguardando quórum)
        </div>
      )}

      {/* Top Quick Links */}
      {standalone && (
        <div className="flex justify-between items-center px-1 text-xs text-[#4A574F]">
          <button
            onClick={resetBallot}
            className="text-[#0A5C36] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            Voltar ao Início
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/cedula"
              className="text-[#0A5C36] hover:underline font-semibold flex items-center gap-1"
            >
              <FileText size={12} />
              Cédula
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/projetor"
              className="text-[#0A5C36] hover:underline font-semibold flex items-center gap-1"
            >
              <Monitor size={12} />
              Telão
            </Link>
            <span className="text-gray-300">·</span>
            <Link
              href="/admin"
              className="text-[#0A5C36] hover:underline font-semibold flex items-center gap-1"
            >
              <Shield size={12} />
              Admin
            </Link>
          </div>
        </div>
      )}

      <div className={`w-full bg-[#FBFCFA] overflow-hidden flex flex-col ${
        standalone
          ? 'min-h-[640px] rounded-3xl shadow-xl border border-[#DCE3DE]'
          : 'min-h-[780px] rounded-2xl shadow-md border border-[#DCE3DE]'
      }`}>
        {/* Header */}
        <div className="bg-[#0A5C36] text-white p-6 pt-10 pb-5 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="text-xs text-[#CFE3D6]">Olá, {firstName}</div>
              <div className="font-serif text-2xl font-semibold">Sua cédula</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/14 text-xs font-semibold backdrop-blur-sm">
              <span className="w-2 h-2 rounded-xs bg-[#9FD3B1]"></span>
              Voto secreto
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col flex-1 p-6 sm:p-7 pt-8 pb-6 gap-4 items-center text-center">
          {/* Lock Graphic */}
          <div className="w-16 h-16 rounded-full bg-[#EEF4F0] border-2 border-[#0A5C36] flex items-center justify-center shadow-inner">
            <div className="flex flex-col items-center">
              <div className="w-5 h-3 border-[3px] border-[#0A5C36] border-b-0 rounded-t-lg"></div>
              <div className="w-7 h-5 rounded bg-[#0A5C36]"></div>
            </div>
          </div>

          <div className="font-serif text-2xl font-semibold leading-tight text-[#15201A]">
            Votação aguardando quórum
          </div>

          <div className="text-xs sm:text-sm leading-relaxed text-[#4A574F]">
            A cédula digital será liberada automaticamente assim que a Mesa conferir os membros presentes no livro de atas e publicar o quórum oficial.
          </div>

          {/* Timeline steps */}
          <div className="w-full flex flex-col rounded-xl border border-[#CBD5CE] bg-white text-left overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3 p-3 px-3.5 border-b border-[#E6ECE8]">
              <span className="w-5 h-5 shrink-0 rounded-full bg-[#0A5C36] text-white flex items-center justify-center text-xs font-bold">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-xs font-semibold text-[#15201A]">Login verificado</span>
            </div>
            <div className="flex items-center gap-3 p-3 px-3.5 border-b border-[#E6ECE8] bg-[#EEF4F0]/50">
              <span className="w-5 h-5 shrink-0 rounded-full border-2 border-[#0A5C36] flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A5C36] animate-pulse"></span>
              </span>
              <span className="text-xs font-semibold text-[#0A5C36]">
                Aguardando Mesa aprovar quórum
              </span>
            </div>
            <div className="flex items-center gap-3 p-3 px-3.5 text-[#6B776F]">
              <span className="w-5 h-5 shrink-0 rounded-full border-2 border-[#CBD5CE]"></span>
              <span className="text-xs">Votação liberada</span>
            </div>
          </div>

          <div className="mt-auto text-xs text-[#6B776F] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            A página atualiza em tempo real sem precisar recarregar.
          </div>
        </div>
      </div>
    </div>
  );
}
