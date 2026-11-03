'use client';

import React from 'react';
import { VoterLoginScreen } from '@/components/screens/voter-login-screen';
import { VoterBlockedScreen } from '@/components/screens/voter-blocked-screen';
import { VoterBallotScreen } from '@/components/screens/voter-ballot-screen';
import { MesaAtaScreen } from '@/components/screens/mesa-ata-screen';
import { ProjetorScreen } from '@/components/screens/projetor-screen';
import { AdminCandidatosScreen } from '@/components/screens/admin-candidatos-screen';
import { RelatorioExecutivoScreen } from '@/components/screens/relatorio-executivo-screen';

export default function CanvasPage() {
  return (
    <div className="bg-[#E9ECE8] text-[#15201A] min-h-screen">
      {/* SECTION 1: PWA Mobile First & Telão */}
      <section className="p-8 md:p-14 md:px-16 flex flex-col gap-10">
        <div className="flex flex-col gap-1.5 max-w-[900px]">
          <div className="text-[13px] font-semibold tracking-[.12em] uppercase text-[#0A5C36]">
            Mocks · PWA mobile first
          </div>
          <h1 className="font-serif font-semibold text-3xl md:text-[40px] leading-[1.1] text-[#15201A]">
            Eleição de Oficiais — IPB Serra Talhada
          </h1>
          <p className="text-base leading-[1.5] text-[#4A574F]">
            As telas são interativas e ligadas entre si: entrar no login personaliza a cédula; os
            votos confirmados na conferência de ata definem o quórum exibido na apresentação. O
            voto não é vinculado ao membro em nenhuma tela.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 items-start overflow-x-auto pb-6">
          {/* 01 Login */}
          <VoterLoginScreen standalone={false} />

          {/* 02a Bloqueada */}
          <VoterBlockedScreen standalone={false} />

          {/* 02b Liberada */}
          <VoterBallotScreen standalone={false} />

          {/* 03 Conferência de ata */}
          <MesaAtaScreen standalone={false} />

          {/* 04 Apresentação Telão */}
          <ProjetorScreen standalone={false} />
        </div>
      </section>

      {/* SECTION 2: Painel Administrativo Desktop */}
      <section className="px-8 md:px-16 pb-24 flex flex-col gap-10">
        <div className="flex flex-col gap-1.5 max-w-[900px]">
          <div className="text-[13px] font-semibold tracking-[.12em] uppercase text-[#0A5C36]">
            Mocks · Painel administrativo (desktop)
          </div>
          <h2 className="font-serif font-semibold text-2xl md:text-[32px] leading-[1.15] text-[#15201A]">
            Configuração da eleição e relatório executivo
          </h2>
          <p className="text-base leading-[1.5] text-[#4A574F]">
            Candidatos e vagas definidos aqui alimentam a cédula e a apresentação acima. O
            relatório usa o quórum enviado pela conferência de ata e a apuração em andamento.
          </p>
        </div>

        <div className="flex flex-col gap-14 overflow-x-auto pb-6">
          {/* 05 Candidatos e Vagas */}
          <AdminCandidatosScreen standalone={false} />

          {/* 06 Relatório Executivo */}
          <RelatorioExecutivoScreen standalone={false} />
        </div>
      </section>
    </div>
  );
}
