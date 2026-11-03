'use client';

import React from 'react';
import { MesaAtaScreen } from '@/components/screens/mesa-ata-screen';

export default function MesaPage() {
  return (
    <main className="min-h-screen bg-[#E9ECE8] py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <MesaAtaScreen standalone={true} />
      </div>
    </main>
  );
}
