'use client';

import React from 'react';
import { RelatorioExecutivoScreen } from '@/components/screens/relatorio-executivo-screen';

export default function RelatorioPage() {
  return (
    <main className="min-h-screen w-full bg-[#F6F8F5] print:bg-white m-0 p-0 overflow-x-hidden">
      <RelatorioExecutivoScreen standalone={true} />
    </main>
  );
}
