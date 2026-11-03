'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { Shield, FileText, Monitor, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function VoterLoginScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    voterName,
    setVoterName,
    voterPhone,
    setVoterPhone,
    loginMember,
    loggedMember,
  } = useElection();

  const isValid = voterName.trim().length > 2 && voterPhone.length >= 15;
  const loginOpacity = isValid ? 1 : 0.55;
  const loginLabel = loggedMember ? 'Acesso liberado ✓' : 'Entrar para votar';

  return (
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[460px] mx-auto px-4 py-6' : 'w-[390px]'}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">01 · Login do membro</div>
      )}

      {/* Top Quick Links for Officers / Viewing */}
      {standalone && (
        <div className="flex justify-between items-center px-1 text-xs text-[#4A574F]">
          <span className="font-semibold text-[#0A5C36]">Eleições IPST 2026</span>
          <div className="flex items-center gap-3">
            <Link
              href="/cedula"
              className="text-[#0A5C36] hover:underline font-semibold flex items-center gap-1"
            >
              <FileText size={12} />
              Cédula PDF
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
        <div className="bg-[#0A5C36] text-white p-7 pt-10 pb-7 flex flex-col gap-4 shrink-0">
          <img
            src="/assets/ipst_logo.jpg"
            alt="Igreja Presbiteriana de Serra Talhada"
            className="w-16 h-16 rounded-2xl object-cover block shadow-md border border-white/10"
          />
          <div className="flex flex-col gap-1">
            <div className="text-xs tracking-[.1em] uppercase text-[#CFE3D6] font-semibold">
              Igreja Presbiteriana de Serra Talhada
            </div>
            <div className="font-serif text-2xl sm:text-[28px] font-semibold leading-tight">
              Eleição de Oficiais 2026
            </div>
            <div className="text-xs sm:text-sm text-[#DCEBE1]">Assembleia Geral Extraordinária · 08/11/2026</div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-6 sm:p-7 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-[#15201A]">Nome completo</span>
            <input
              type="text"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="Como consta no rol de membros"
              className="h-12 rounded-xl border border-[#CBD5CE] px-4 text-sm bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-[#15201A]">Telefone (WhatsApp)</span>
            <input
              type="tel"
              inputMode="tel"
              value={voterPhone}
              onChange={(e) => setVoterPhone(e.target.value)}
              placeholder="(87) 9 0000-0000"
              className="h-12 rounded-xl border border-[#CBD5CE] px-4 text-sm bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36]"
            />
          </label>

          <button
            onClick={loginMember}
            disabled={!isValid}
            style={{ opacity: loginOpacity }}
            className="h-12 border-none rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold cursor-pointer transition-all shadow-md active:scale-[0.99] disabled:cursor-not-allowed mt-1"
          >
            {loginLabel}
          </button>

          <div className="flex flex-col gap-2 mt-auto p-3.5 rounded-xl bg-[#EEF4F0] text-xs leading-relaxed text-[#33433A]">
            <div>
              <strong>Acesso único.</strong> O voto é secreto e confirmado de forma anônima.
            </div>
            <div className="text-[#5A675F]">
              Nenhum dado é gravado no banco antes da confirmação final da cédula.
            </div>
          </div>

          {/* Shortcut links at bottom */}
          <div className="pt-3 border-t border-[#EEF1EE] flex flex-col gap-2">
            <span className="text-xs text-[#6B776F] font-medium text-center">
              Acesso exclusivo da Mesa e Oficiais:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cedula"
                className="p-2.5 rounded-xl bg-white border border-[#CBD5CE] hover:border-[#0A5C36] text-xs font-semibold text-[#15201A] flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>Cédula de Papel</span>
                <ArrowRight size={13} className="text-[#0A5C36]" />
              </Link>
              <Link
                href="/admin"
                className="p-2.5 rounded-xl bg-white border border-[#CBD5CE] hover:border-[#0A5C36] text-xs font-semibold text-[#15201A] flex items-center justify-between transition-colors shadow-2xs"
              >
                <span>Painel Admin</span>
                <ArrowRight size={13} className="text-[#0A5C36]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
