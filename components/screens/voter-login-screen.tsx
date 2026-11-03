'use client';

import React from 'react';
import { useElection } from '@/context/election-context';

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
    <div className={`flex flex-col gap-3.5 ${standalone ? 'w-full max-w-[420px] mx-auto' : ''}`}>
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">01 · Login do membro</div>
      )}
      <div className="w-[390px] max-w-full h-[800px] rounded-[46px] border-[10px] border-[#121714] bg-[#FBFCFA] overflow-hidden flex flex-col shadow-2xl mx-auto">
        {/* Header */}
        <div className="bg-[#0A5C36] text-white p-7 pt-14 pb-9 flex flex-col gap-4.5">
          <img
            src="/assets/ipst_logo.jpg"
            alt="Igreja Presbiteriana de Serra Talhada"
            className="w-[72px] h-[72px] rounded-2xl object-cover block shadow-md"
          />
          <div className="flex flex-col gap-1.5">
            <div className="text-[13px] tracking-[.08em] uppercase text-[#CFE3D6] font-medium">
              Igreja Presbiteriana de Serra Talhada
            </div>
            <div className="font-serif text-[30px] font-semibold leading-[1.15]">
              Eleição de Oficiais 2026
            </div>
            <div className="text-[15px] text-[#DCEBE1]">Assembleia Geral Extraordinária</div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 p-7 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#15201A]">Nome completo</span>
            <input
              type="text"
              value={voterName}
              onChange={(e) => setVoterName(e.target.value)}
              placeholder="Como consta no rol de membros"
              className="h-[52px] rounded-xl border-[1.5px] border-[#CBD5CE] px-4 text-base bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#15201A]">Telefone (WhatsApp)</span>
            <input
              type="tel"
              inputMode="tel"
              value={voterPhone}
              onChange={(e) => setVoterPhone(e.target.value)}
              placeholder="(87) 9 0000-0000"
              className="h-[52px] rounded-xl border-[1.5px] border-[#CBD5CE] px-4 text-base bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#0A5C36]"
            />
          </label>

          <button
            onClick={loginMember}
            disabled={!isValid}
            style={{ opacity: loginOpacity }}
            className="h-[54px] border-none rounded-2xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-base font-semibold cursor-pointer transition-all shadow-md active:scale-[0.99] disabled:cursor-not-allowed"
          >
            {loginLabel}
          </button>

          <div className="flex flex-col gap-2.5 mt-auto p-4 rounded-2xl bg-[#EEF4F0] text-[13px] leading-[1.5] text-[#33433A]">
            <div>
              <strong>Acesso único.</strong> Após confirmar o voto, este acesso é encerrado e não pode ser usado novamente.
            </div>
            <div>
              Seu nome e telefone atualizam o cadastro de membros da igreja e são conferidos com o livro de atas.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
