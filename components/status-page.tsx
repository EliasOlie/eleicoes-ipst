import React from 'react';

/** Layout compartilhado das páginas de erro (404 / 500), no visual do app. */
export function StatusPage({
  code,
  title,
  message,
  actions,
}: {
  code: string;
  title: string;
  message: string;
  actions: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#E9ECE8] py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-[440px] bg-[#FBFCFA] rounded-3xl shadow-xl border border-[#DCE3DE] overflow-hidden flex flex-col">
        <div className="bg-[#0A5C36] text-white p-7 pt-10 pb-7 flex flex-col gap-4 items-center text-center">
          <img
            src="/assets/ipst_logo.jpg"
            alt="Igreja Presbiteriana de Serra Talhada"
            className="w-16 h-16 rounded-2xl object-cover block shadow-md border border-white/10"
          />
          <div className="text-xs tracking-[.1em] uppercase text-[#CFE3D6] font-semibold">
            Igreja Presbiteriana de Serra Talhada
          </div>
          <div className="font-serif text-6xl font-semibold leading-none text-[#9FD3B1]">{code}</div>
        </div>
        <div className="p-7 flex flex-col gap-4 text-center">
          <h1 className="font-serif text-2xl font-semibold text-[#15201A]">{title}</h1>
          <p className="text-sm leading-relaxed text-[#4A574F]">{message}</p>
          <div className="flex flex-col gap-2.5 pt-2">{actions}</div>
        </div>
      </div>
    </main>
  );
}

export const primaryBtn =
  'h-12 rounded-xl bg-[#0A5C36] hover:bg-[#073D24] text-white text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors shadow-md';
export const secondaryBtn =
  'h-11 rounded-xl border-[1.5px] border-[#CBD5CE] bg-white hover:bg-[#F6F8F6] text-[#15201A] text-sm font-semibold flex items-center justify-center cursor-pointer transition-colors';
