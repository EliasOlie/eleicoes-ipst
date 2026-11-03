'use client';

import React, { useState } from 'react';
import { useElection } from '@/context/election-context';
import { X, Check, FileText, AlertCircle, Plus } from 'lucide-react';

export function PaperBallotModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    diac,
    presb,
    vagasDiac,
    vagasPresb,
    castPaperVote,
  } = useElection();

  const [selection, setSelection] = useState<{ diac: string[]; presb: string[] }>({
    diac: [],
    presb: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const toggleDiac = (id: string) => {
    setSelection((prev) => {
      const exists = prev.diac.includes(id);
      if (exists) return { ...prev, diac: prev.diac.filter((x) => x !== id) };
      if (prev.diac.length >= vagasDiac) return prev;
      return { ...prev, diac: [...prev.diac, id] };
    });
  };

  const togglePresb = (id: string) => {
    setSelection((prev) => {
      const exists = prev.presb.includes(id);
      if (exists) return { ...prev, presb: prev.presb.filter((x) => x !== id) };
      if (prev.presb.length >= vagasPresb) return prev;
      return { ...prev, presb: [...prev.presb, id] };
    });
  };

  const handleCompute = async () => {
    setSubmitting(true);
    setErrorMsg('');
    const res = await castPaperVote(selection);
    setSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Erro ao registrar voto de papel');
      return;
    }

    setLastReceipt(res.receipt || 'PAPEL');
    // Clear selection for next paper ballot
    setSelection({ diac: [], presb: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A5C36] text-white p-5 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#9FD3B1]" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold">Escrutínio de Cédula Física</h3>
              <p className="text-xs text-[#DCEBE1]">
                Lançamento manual unificado das cédulas de urna em papel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback alert */}
        {lastReceipt && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800">
            <span className="font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Cédula <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-bold">{lastReceipt}</code> computada com sucesso no telão!
            </span>
            <span className="text-emerald-600">Pronto para a próxima cédula</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Diáconos */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
              <span className="text-sm font-bold text-[#15201A] uppercase tracking-wider text-xs">
                1. Diáconos ({selection.diac.length} de {vagasDiac} selecionados)
              </span>
              <button
                type="button"
                onClick={() => setSelection((p) => ({ ...p, diac: [] }))}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Limpar / Voto em branco
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diac.map(([id, name]) => {
                const isSelected = selection.diac.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleDiac(id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0A5C36] bg-[#0A5C36]/5 text-[#0A5C36] font-semibold ring-1 ring-[#0A5C36]'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'border-[#0A5C36] bg-[#0A5C36] text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="text-xs truncate flex-1">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presbíteros */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-baseline border-b border-gray-100 pb-2">
              <span className="text-sm font-bold text-[#15201A] uppercase tracking-wider text-xs">
                2. Presbíteros ({selection.presb.length} de {vagasPresb} selecionados)
              </span>
              <button
                type="button"
                onClick={() => setSelection((p) => ({ ...p, presb: [] }))}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
              >
                Limpar / Voto em branco
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presb.map(([id, name]) => {
                const isSelected = selection.presb.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => togglePresb(id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0A5C36] bg-[#0A5C36]/5 text-[#0A5C36] font-semibold ring-1 ring-[#0A5C36]'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'border-[#0A5C36] bg-[#0A5C36] text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className="text-xs truncate flex-1">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            {selection.diac.length === 0 && selection.presb.length === 0
              ? 'Voto computará como Cédula em Branco.'
              : `${selection.diac.length} Diác. · ${selection.presb.length} Presb.`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
            >
              Fechar Escrutínio
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCompute}
              className="px-5 py-2.5 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <span>Computando...</span>
              ) : (
                <>
                  <Plus size={14} />
                  <span>Computar Cédula de Papel</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
