'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useElection } from '@/context/election-context';
import {
  Smartphone,
  ClipboardList,
  Projector,
  Settings2,
  FileSpreadsheet,
  LayoutGrid,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function NavSwitcher() {
  const pathname = usePathname();
  const {
    votingOpen,
    counted,
    published,
    simulationActive,
    setSimulationActive,
    restartSimulation,
    isCompleted,
  } = useElection();

  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { href: '/', label: 'Cédula PWA', icon: Smartphone },
    { href: '/mesa', label: 'Mesa / Ata', icon: ClipboardList },
    { href: '/projetor', label: 'Telão Projetor', icon: Projector },
    { href: '/admin', label: 'Candidatos & Vagas', icon: Settings2 },
    { href: '/relatorio', label: 'Relatório Executivo', icon: FileSpreadsheet },
    { href: '/canvas', label: 'Visão Canvas Mocks', icon: LayoutGrid },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#073D24] text-white border-b border-[#9FD3B1]/20 shadow-md backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/assets/ipst_logo.jpg"
            alt="IPST"
            className="w-8 h-8 rounded-lg object-cover border border-white/20"
          />
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight text-white">Eleição IPST</span>
            <span className="text-[10px] text-[#A9CDB6] uppercase tracking-wider font-semibold">
              Oficiais 2026
            </span>
          </div>
        </Link>

        {/* Navigation Tabs (desktop) */}
        {!collapsed && (
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-0.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0A5C36] text-white shadow-xs border border-[#9FD3B1]/30'
                      : 'text-[#CFE3D6] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Live Status and Simulation Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 text-xs font-medium border border-white/10">
            <span
              className={`w-2 h-2 rounded-full ${
                !votingOpen
                  ? 'bg-amber-400'
                  : isCompleted
                  ? 'bg-slate-300'
                  : 'bg-emerald-400 animate-pulse'
              }`}
            ></span>
            <span className="hidden sm:inline">
              {!votingOpen
                ? 'Quórum pendente'
                : isCompleted
                ? 'Apuração 100%'
                : `Apurando: ${counted}/${published}`}
            </span>
            <span className="sm:hidden">{!votingOpen ? 'Pendente' : `${counted}/${published}`}</span>
          </div>

          {/* Quick simulation buttons */}
          {votingOpen && (
            <div className="hidden sm:flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
              <button
                onClick={() => setSimulationActive(!simulationActive)}
                title={simulationActive ? 'Pausar simulação' : 'Retomar simulação'}
                className="p-1 rounded hover:bg-white/15 text-white cursor-pointer transition-colors"
              >
                {simulationActive ? <Pause size={13} /> : <Play size={13} />}
              </button>
              <button
                onClick={restartSimulation}
                title="Reiniciar contagem"
                className="p-1 rounded hover:bg-white/15 text-white cursor-pointer transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          )}

          {/* Collapse switcher toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Alternar menu"
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav bar dropdown */}
      {!collapsed && (
        <div className="lg:hidden px-4 pb-2.5 pt-1 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#0A5C36] text-white border border-[#9FD3B1]/30'
                    : 'text-[#CFE3D6] hover:bg-white/10'
                }`}
              >
                <Icon size={13} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
