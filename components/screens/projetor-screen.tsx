'use client';

import React, { useState, useEffect } from 'react';
import { useElection } from '@/context/election-context';
import { Maximize2, Minimize2, ArrowLeft, QrCode, BarChart3, CheckCircle, Users } from 'lucide-react';
import QRCode from 'qrcode';
import Link from 'next/link';

export function ProjetorScreen({ standalone = false }: { standalone?: boolean }) {
  const {
    published,
    counted,
    majority,
    blanks,
    resDiac,
    resPresb,
    vagasDiac,
    vagasPresb,
    votingOpen,
    isCompleted,
    restartSimulation,
    simulationActive,
    setSimulationActive,
    quorumMinimo,
    totalComungantes,
    quorumAtingido,
    confirmedCount,
  } = useElection();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'reception' | 'results'>('reception');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [siteUrl, setSiteUrl] = useState<string>('eleicoes-ipst.eliasolie.com.br');

  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://eleicoes-ipst.eliasolie.com.br';
    const host = typeof window !== 'undefined' ? window.location.host : 'eleicoes-ipst.eliasolie.com.br';
    setSiteUrl(host);
    QRCode.toDataURL(origin, {
      width: 520,
      margin: 2,
      color: {
        dark: '#073D24',
        light: '#ffffff',
      },
    })
      .then(setQrCodeUrl)
      .catch(() => {});
  }, []);

  // When voting opens, automatically switch to results mode
  useEffect(() => {
    if (votingOpen) {
      setDisplayMode('results');
    }
  }, [votingOpen]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const attendeesCount = votingOpen ? published : confirmedCount;
  const maxV = Math.max(1, published);
  const majPct = `${Math.min(100, (majority / maxV) * 100)}%`;
  const pctCounted = maxV > 0 ? Math.round((counted / maxV) * 100) : 0;
  const quorumPct = quorumMinimo > 0 ? Math.min(100, Math.round((attendeesCount / quorumMinimo) * 100)) : 0;

  const liveColor = !votingOpen ? '#E8C46A' : isCompleted ? '#C9D3CC' : '#7EE0A0';
  const liveLabel = !votingOpen
    ? 'Aguardando quórum'
    : isCompleted
    ? 'Apuração encerrada'
    : 'Apuração ao vivo';

  return (
    <div
      className={
        standalone
          ? 'w-full min-h-screen bg-[#073D24] text-white flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 gap-6 lg:gap-8'
          : 'flex flex-col gap-3.5 w-full max-w-[1360px] mx-auto'
      }
    >
      {!standalone && (
        <div className="text-sm font-semibold text-[#4A574F]">
          04 · Apresentação (projetor) — apuração em tempo real
        </div>
      )}

      <div
        className={
          standalone
            ? 'w-full flex-1 flex flex-col gap-6 lg:gap-8'
            : 'w-full max-w-full min-h-[720px] rounded-2xl bg-[#073D24] text-white overflow-hidden flex flex-col p-8 md:p-11 md:px-14 gap-8 shadow-2xl border border-emerald-950/40'
        }
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-5 md:gap-6">
            <img
              src="/assets/ipst_logo.jpg"
              alt="IPST"
              className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl object-cover block shadow-xl border border-white/15"
            />
            <div className="flex flex-col gap-1.5">
              <div className="text-xs md:text-sm lg:text-base tracking-[.15em] uppercase text-[#A9CDB6] font-semibold">
                Igreja Presbiteriana de Serra Talhada
              </div>
              <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[44px] font-semibold leading-tight tracking-tight text-white">
                Eleição de Oficiais 2026
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-full bg-white/10 p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('reception')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  displayMode === 'reception'
                    ? 'bg-white text-[#073D24] font-bold shadow-xs'
                    : 'text-[#A9CDB6] hover:text-white'
                }`}
              >
                <QrCode size={13} />
                <span>Recepção & QR</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('results')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium transition-all cursor-pointer ${
                  displayMode === 'results'
                    ? 'bg-white text-[#073D24] font-bold shadow-xs'
                    : 'text-[#A9CDB6] hover:text-white'
                }`}
              >
                <BarChart3 size={13} />
                <span>Apuração ao Vivo</span>
              </button>
            </div>

            {standalone && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/15 text-xs text-[#A9CDB6] hover:text-white transition-colors border border-white/10"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            <button
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/5 hover:bg-white/15 text-xs text-[#A9CDB6] hover:text-white transition-colors border border-white/10 cursor-pointer"
              title="Alternar Tela Cheia"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Sair</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Tela Cheia</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 text-sm md:text-base font-semibold backdrop-blur-md border border-white/10 shadow-xs">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: liveColor }}
              ></span>
              <span>{liveLabel}</span>
            </div>
          </div>
        </div>

        {displayMode === 'reception' ? (
          /* Reception & QR Code Screen */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 animate-in fade-in duration-300">
            {/* Left Column: QR Code & Access Info */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10 text-center gap-5 shadow-2xl">
              <span className="text-xs uppercase tracking-widest text-[#9FD3B1] font-bold">
                Acesse pelo seu celular
              </span>

              <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-white/20">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Eleições IPST"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain block rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 sm:w-72 sm:h-72 bg-gray-100 flex items-center justify-center text-gray-400">
                    Gerando QR Code...
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#A9CDB6]">Ou digite no navegador:</span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide bg-black/25 px-4 py-1.5 rounded-xl border border-white/10">
                  {siteUrl}
                </span>
              </div>
            </div>

            {/* Right Column: Steps & Quorum Gauge */}
            <div className="lg:col-span-7 flex flex-col gap-6 justify-between h-full py-2">
              <div className="flex flex-col gap-3">
                <span className="text-xs tracking-[.2em] uppercase text-[#9FD3B1] font-bold">
                  Instruções para a Assembleia
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight">
                  Eleição de Oficiais · Quórum 50%
                </h3>
                <p className="text-sm sm:text-base text-[#DCEBE1] leading-relaxed">
                  Para participar da votação, todo membro comungante deve assinar a lista física de presença na mesa e confirmar sua entrada pelo celular.
                </p>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#9FD3B1] text-[#073D24] font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <span className="text-sm font-bold text-white">Livro de Ata</span>
                  <span className="text-xs text-[#A9CDB6] leading-relaxed">
                    Assine o livro oficial de presenças na entrada com o secretário.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#9FD3B1] text-[#073D24] font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <span className="text-sm font-bold text-white">QR Code no App</span>
                  <span className="text-xs text-[#A9CDB6] leading-relaxed">
                    Aponte a câmera para o QR Code e confirme seu Nome e Telefone.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#9FD3B1] text-[#073D24] font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <span className="text-sm font-bold text-white">Voto Secreto</span>
                  <span className="text-xs text-[#A9CDB6] leading-relaxed">
                    A Mesa confere sua assinatura e o voto é liberado automaticamente.
                  </span>
                </div>
              </div>

              {/* Quorum Progress Box */}
              <div className="p-6 rounded-2xl bg-black/20 border border-white/15 flex flex-col gap-3.5 shadow-inner">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm md:text-base font-semibold text-white flex items-center gap-2">
                    <Users size={18} className="text-[#9FD3B1]" />
                    <span>Quórum Constitucional da Assembleia (50%)</span>
                  </span>
                  <span className="text-xs md:text-sm font-mono text-[#9FD3B1]">
                    {attendeesCount} de {quorumMinimo} necessários ({totalComungantes} no rol da ata)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-4 rounded-full bg-white/10 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out bg-linear-to-r from-[#5FA57B] to-[#9FD3B1]"
                    style={{ width: `${quorumPct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#A9CDB6]">
                    {attendeesCount} {attendeesCount === 1 ? 'membro comungante conferido em ata' : 'membros comungantes conferidos em ata'}
                  </span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full ${
                      quorumAtingido
                        ? 'bg-[#E8F3EC] text-[#073D24]'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {quorumAtingido
                      ? 'Quórum de 1ª Convocação Atingido ✓'
                      : `Faltam ${Math.max(0, quorumMinimo - attendeesCount)} para 50% (ou quórum em 2ª convocação)`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Live Results Screen */
          <>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              <div className="p-5 px-6 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/10 backdrop-blur-xs shadow-xs">
                <span className="text-sm md:text-base text-[#A9CDB6] font-medium">Membros aptos (ata)</span>
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold tabular-nums tracking-tight">
                  {published}
                </span>
              </div>

              <div className="p-5 px-6 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/10 backdrop-blur-xs shadow-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm md:text-base text-[#A9CDB6] font-medium">Cédulas apuradas</span>
                  {maxV > 0 && (
                    <span className="text-xs md:text-sm font-semibold text-[#9FD3B1] tabular-nums">
                      {pctCounted}% concluído
                    </span>
                  )}
                </div>
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold tabular-nums tracking-tight">
                  {counted}{' '}
                  <span className="text-lg md:text-2xl text-[#A9CDB6] font-normal">
                    / {published}
                  </span>
                </span>
              </div>

              <div className="p-5 px-6 rounded-2xl bg-white/[0.08] flex flex-col gap-1 border border-white/10 backdrop-blur-xs shadow-xs">
                <span className="text-sm md:text-base text-[#A9CDB6] font-medium">Maioria absoluta</span>
                <span className="text-3xl md:text-4xl lg:text-5xl font-bold tabular-nums tracking-tight">
                  {majority}{' '}
                  <span className="text-lg md:text-2xl text-[#A9CDB6] font-normal">votos</span>
                </span>
              </div>
            </div>

            {/* Results Columns */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 min-h-0">
              {/* Diaconato Column */}
              <div className="flex flex-col gap-5 bg-black/15 p-6 lg:p-7 rounded-2xl border border-white/10 shadow-inner">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl md:text-3xl lg:text-[32px] font-semibold text-white">
                      Diaconato
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-[#A9CDB6]">
                      {vagasDiac} {vagasDiac === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-[#A9CDB6]">
                    {resDiac.filter((c) => c.elected).length} de {vagasDiac} preenchidas
                  </span>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1">
                  {resDiac.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#A9CDB6] bg-white/5 rounded-xl">
                      Aguardando cadastro de candidatos ao diaconato...
                    </div>
                  ) : (
                    resDiac.map((r, rankIdx) => (
                      <div key={r.id} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2.5">
                            <span className="text-xs text-[#A9CDB6] w-4 font-mono">#{rankIdx + 1}</span>
                            <span className="text-white">{r.name}</span>
                            {r.elected && (
                              <span className="text-[11px] md:text-xs font-black tracking-wider px-2.5 py-0.5 rounded-md bg-[#E8F3EC] text-[#073D24] shadow-sm animate-in fade-in duration-300">
                                ELEITO
                              </span>
                            )}
                          </span>
                          <span className="text-base sm:text-lg md:text-2xl font-bold tabular-nums text-[#9FD3B1]">
                            {r.votes}{' '}
                            <span className="text-xs font-normal text-[#A9CDB6]">{r.pct}</span>
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 rounded-full bg-white/10 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: r.width,
                              backgroundColor: r.bar,
                            }}
                          ></div>
                          {/* Majority indicator line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white opacity-80"
                            style={{ left: majPct }}
                            title="Linha da maioria absoluta (50% + 1)"
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Presbiterato Column */}
              <div className="flex flex-col gap-5 bg-black/15 p-6 lg:p-7 rounded-2xl border border-white/10 shadow-inner">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-2xl md:text-3xl lg:text-[32px] font-semibold text-white">
                      Presbiterato
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-[#A9CDB6]">
                      {vagasPresb} {vagasPresb === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>
                  <span className="text-xs md:text-sm text-[#A9CDB6]">
                    {resPresb.filter((c) => c.elected).length} de {vagasPresb} preenchidas
                  </span>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1">
                  {resPresb.length === 0 ? (
                    <div className="py-12 text-center text-sm text-[#A9CDB6] bg-white/5 rounded-xl">
                      Aguardando cadastro de candidatos ao presbiterato...
                    </div>
                  ) : (
                    resPresb.map((r, rankIdx) => (
                      <div key={r.id} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-baseline gap-3">
                          <span className="text-base sm:text-lg md:text-xl font-semibold flex items-center gap-2.5">
                            <span className="text-xs text-[#A9CDB6] w-4 font-mono">#{rankIdx + 1}</span>
                            <span className="text-white">{r.name}</span>
                            {r.elected && (
                              <span className="text-[11px] md:text-xs font-black tracking-wider px-2.5 py-0.5 rounded-md bg-[#E8F3EC] text-[#073D24] shadow-sm animate-in fade-in duration-300">
                                ELEITO
                              </span>
                            )}
                          </span>
                          <span className="text-base sm:text-lg md:text-2xl font-bold tabular-nums text-[#9FD3B1]">
                            {r.votes}{' '}
                            <span className="text-xs font-normal text-[#A9CDB6]">{r.pct}</span>
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 rounded-full bg-white/10 relative overflow-hidden">
                          <div
                            className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: r.width,
                              backgroundColor: r.bar,
                            }}
                          ></div>
                          {/* Majority indicator line */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white opacity-80"
                            style={{ left: majPct }}
                            title="Linha da maioria absoluta (50% + 1)"
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer info bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-white/10 text-xs md:text-sm text-[#A9CDB6]">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-3 bg-white inline-block rounded-xs"></span>
              Linha branca = referência de maioria absoluta ({majority} votos)
            </span>
            <span className="text-white/40">·</span>
            <span>Votos em branco: <strong className="text-white">{blanks}</strong></span>
          </div>

          {!standalone && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulationActive(!simulationActive)}
                className="h-8 px-3 rounded-lg border border-white/20 bg-white/5 hover:bg-white/15 text-white text-xs cursor-pointer transition-colors"
              >
                {simulationActive ? 'Pausar' : 'Continuar'}
              </button>
              <button
                onClick={restartSimulation}
                className="h-8 px-3 rounded-lg border border-white/20 bg-transparent hover:bg-white/10 text-white text-xs cursor-pointer transition-colors"
              >
                Reiniciar simulação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
