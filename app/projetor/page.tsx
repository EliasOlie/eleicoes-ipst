'use client';

import React from 'react';
import { ProjetorScreen } from '@/components/screens/projetor-screen';

export default function ProjetorPage() {
  return (
    <main className="min-h-screen bg-[#042013] py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <ProjetorScreen standalone={true} />
    </main>
  );
}
