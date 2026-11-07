'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'ipst_pwa_prompt_shown_v1';

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const register = () =>
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('PWA Service Worker registration failed:', err);
        });
      // Se o "load" já aconteceu antes da hidratação, registra direto
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }

    // 2. Listen for install prompt - show at most ONCE
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);

      try {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const alreadyShown = localStorage.getItem(STORAGE_KEY);

        // Only show if not installed and never shown before
        if (!isStandalone && !alreadyShown) {
          setShowBanner(true);
          // Mark as shown so it never appears again across sessions
          localStorage.setItem(STORAGE_KEY, 'true');
        }
      } catch {
        // Fallback if localStorage is disabled
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}

    installPrompt.prompt();
    await installPrompt.userChoice.catch(() => {});
    setShowBanner(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 bg-[#073D24] text-white p-4 rounded-2xl shadow-2xl border border-[#9FD3B1]/20 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-300 no-print">
      <div className="flex items-center gap-3">
        <img src="/assets/ipst_logo.jpg" alt="IPST" className="w-10 h-10 rounded-xl object-cover" />
        <div className="flex flex-col">
          <span className="font-semibold text-sm">Instalar App de Votação</span>
          <span className="text-xs text-[#A9CDB6]">Acesso rápido e offline no seu celular</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-[#9FD3B1] text-[#073D24] hover:bg-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Download size={14} />
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-white/60 hover:text-white p-1 rounded-lg cursor-pointer"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
