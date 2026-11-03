'use client';

import React from 'react';
import { MesaAtaScreen } from '@/components/screens/mesa-ata-screen';

export default function MesaPage() {
  return (
    <main className="min-h-screen bg-[#E9ECE8] sm:py-8 sm:px-4 flex flex-col items-center justify-center p-0">
      <MesaAtaScreen standalone={true} />
    </main>
  );
}
