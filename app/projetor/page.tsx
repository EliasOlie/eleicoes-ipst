'use client';

import React from 'react';
import { ProjetorScreen } from '@/components/screens/projetor-screen';

export default function ProjetorPage() {
  return (
    <main className="min-h-screen w-full bg-[#073D24] text-white flex flex-col m-0 p-0 overflow-x-hidden">
      <ProjetorScreen standalone={true} />
    </main>
  );
}
