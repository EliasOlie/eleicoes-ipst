'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Credenciais inválidas');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Erro de conexão com o servidor');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#E9ECE8] py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-[420px] bg-[#FBFCFA] rounded-3xl shadow-xl border border-[#DCE3DE] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#073D24] text-white p-7 pt-12 pb-8 flex flex-col gap-4.5 text-center items-center">
          <img
            src="/assets/ipst_logo.jpg"
            alt="IPST"
            className="w-16 h-16 rounded-2xl object-cover block shadow-md border border-white/10"
          />
          <div className="flex flex-col gap-1">
            <div className="text-xs uppercase tracking-[.1em] text-[#A9CDB6] font-semibold">
              Igreja Presbiteriana de Serra Talhada
            </div>
            <div className="font-serif text-2xl font-semibold leading-tight">
              Acesso Administrativo
            </div>
            <div className="text-xs text-[#CFE3D6]">Mesa Diretora & Conselho da Igreja</div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 flex flex-col gap-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-in fade-in">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#15201A] flex items-center gap-1.5">
              <User size={15} className="text-[#0A5C36]" />
              Usuário
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="h-[52px] rounded-xl border-[1.5px] border-[#CBD5CE] px-4 text-base bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#073D24]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#15201A] flex items-center gap-1.5">
              <Lock size={15} className="text-[#0A5C36]" />
              Senha
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-[52px] rounded-xl border-[1.5px] border-[#CBD5CE] px-4 text-base bg-white text-[#15201A] focus:outline-none focus:ring-2 focus:ring-[#073D24]"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !password}
            className="h-[54px] border-none rounded-2xl bg-[#073D24] hover:bg-[#052C1A] text-white text-base font-semibold cursor-pointer transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Autenticando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} />
                Entrar no Painel
              </span>
            )}
          </button>

          <div className="pt-2 text-center flex flex-col gap-3">
            <Link
              href="/"
              className="text-xs text-[#0A5C36] hover:text-[#073D24] font-semibold flex items-center justify-center gap-1.5 hover:underline"
            >
              <ArrowLeft size={14} />
              Voltar para Cédula de Votação
            </Link>
            <div className="text-[11px] text-[#6B776F]">
              Credencial padrão de homologação: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">admin</code> / <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 font-mono">ipst2026</code>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
