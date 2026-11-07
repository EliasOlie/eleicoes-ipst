'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, Minimize2, PenLine, Smartphone, ShieldCheck } from 'lucide-react';
import { useElection } from '@/context/election-context';

// Endereço oficial (fixo, não depende de onde a tela está aberta — ex.: notebook em localhost)
export const SITE_URL = 'http://eleicoes-ipst.eliasolie.com.br/';
const SITE_LABEL = 'eleicoes-ipst.eliasolie.com.br';
// Só o texto (sem QR) para não confundir com o QR da votação
const GITHUB_LABEL = 'github.com/EliasOlie/eleicoes-ipst';

export function BoasVindasScreen() {
  const { confirmedCount, votingOpen } = useElection();
  const [qr, setQr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    QRCode.toDataURL(SITE_URL, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#073D24', light: '#ffffff' },
    })
      .then(setQr)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const t = setInterval(tick, 15000);
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      clearInterval(t);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const hora = now
    ? now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife' })
    : '';

  return (
    <div className="relative w-full min-h-screen bg-[#073D24] text-white overflow-hidden flex flex-col">
      {/* Fundo: brilho suave */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[640px] h-[640px] rounded-full bg-[#0A5C36] blur-3xl opacity-60" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 w-[560px] h-[560px] rounded-full bg-[#0F6B41] blur-3xl opacity-40" />

      {/* Topo */}
      <header className="relative z-10 flex items-center justify-between gap-6 px-8 lg:px-14 pt-8 lg:pt-10">
        <div className="flex items-center gap-5">
          <img
            src="/assets/ipst_logo.jpg"
            alt="Igreja Presbiteriana de Serra Talhada"
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl object-cover shadow-xl border border-white/15"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs lg:text-sm tracking-[.18em] uppercase text-[#A9CDB6] font-semibold">
              Igreja Presbiteriana de Serra Talhada
            </span>
            <span className="text-sm lg:text-base text-[#DCEBE1]">
              Assembleia Geral Extraordinária · 08 de novembro de 2026
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hora && (
            <span className="text-2xl lg:text-3xl font-semibold tabular-nums text-[#DCEBE1]">{hora}</span>
          )}
          <button
            onClick={toggleFullscreen}
            className="no-print inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 hover:bg-white/15 text-xs text-[#A9CDB6] hover:text-white border border-white/10 cursor-pointer transition-colors"
            title="Tela cheia"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFullscreen ? 'Sair' : 'Tela cheia'}</span>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center px-8 lg:px-14 py-8">
        {/* Esquerda: boas-vindas + versículo + passos */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-sm lg:text-base tracking-[.25em] uppercase text-[#9FD3B1] font-bold">
              Sejam bem-vindos, irmãos!
            </span>
            <h1 className="font-serif text-5xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
              Eleição de Oficiais 2026
            </h1>
            <p className="text-lg lg:text-2xl text-[#DCEBE1] leading-relaxed max-w-3xl">
              Hoje a igreja escolhe, em oração e com alegria, os irmãos que servirão como
              <strong className="text-white font-semibold"> diáconos</strong> e
              <strong className="text-white font-semibold"> presbíteros</strong>.
            </p>
          </div>

          <blockquote className="relative pl-6 border-l-4 border-[#9FD3B1] flex flex-col gap-3 max-w-3xl">
            <p className="font-serif italic text-xl lg:text-[28px] leading-snug text-white">
              “Mas, irmãos, escolhei dentre vós sete homens de boa reputação, cheios do Espírito e de
              sabedoria, aos quais encarregaremos deste serviço.”
            </p>
            <cite className="not-italic text-sm lg:text-base font-semibold tracking-wide text-[#9FD3B1]">
              Atos 6.3 (ARA)
            </cite>
          </blockquote>

          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: PenLine, t: 'Assine o livro', d: 'Assine a lista de presença na mesa da secretaria.' },
              { icon: Smartphone, t: 'Acesse no celular', d: 'Leia o QR code e informe seu nome e telefone.' },
              { icon: ShieldCheck, t: 'Vote em segredo', d: 'Conferida a presença e liberada a votação, sua cédula abre sozinha.' },
            ].map(({ icon: Icon, t, d }, i) => (
              <li key={t} className="p-5 rounded-2xl bg-white/[0.06] border border-white/10 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#9FD3B1] text-[#073D24] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                  <Icon size={20} className="text-[#9FD3B1]" />
                </div>
                <span className="text-lg font-bold">{t}</span>
                <span className="text-sm text-[#A9CDB6] leading-relaxed">{d}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Direita: QR code */}
        <section className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="p-5 lg:p-6 bg-white rounded-[28px] shadow-2xl">
            {qr ? (
              <img src={qr} alt={`QR code para ${SITE_LABEL}`} className="w-72 h-72 lg:w-[400px] lg:h-[400px] block" />
            ) : (
              <div className="w-72 h-72 lg:w-[400px] lg:h-[400px] bg-gray-100 rounded-xl" />
            )}
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-sm lg:text-base text-[#A9CDB6]">Aponte a câmera do celular ou digite no navegador:</span>
            <span className="font-mono font-bold text-2xl lg:text-[34px] tracking-wide bg-black/25 border border-white/10 px-5 py-2.5 rounded-2xl">
              {SITE_LABEL}
            </span>
          </div>
        </section>
      </main>

      {/* Rodapé */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-8 lg:px-14 pb-8 text-sm lg:text-base text-[#A9CDB6]">
        <span className="flex flex-col gap-1">
          <span>Voto secreto · o comprovante confirma que você votou, não em quem.</span>
          <span className="text-[#DCEBE1]">
            Código aberto para auditoria:{' '}
            <span className="font-mono font-semibold text-white">{GITHUB_LABEL}</span>
          </span>
        </span>
        <span className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white font-semibold">
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${votingOpen ? 'bg-[#7EE0A0]' : 'bg-[#E8C46A]'}`} />
          {votingOpen ? 'Votação liberada' : `${confirmedCount} ${confirmedCount === 1 ? 'membro conferido' : 'membros conferidos'} na ata`}
        </span>
      </footer>
    </div>
  );
}
