'use client';

import React from 'react';
import { RelatorioExecutivoScreen } from '@/components/screens/relatorio-executivo-screen';

export default function RelatorioPage() {
  return (
    <main className="min-h-screen bg-[#E9ECE8] py-6 sm:py-10 px-4 flex flex-col items-center justify-center print:bg-white print:p-0">
      <RelatorioExecutivoScreen standalone={true} />
    </main>
  );
}
