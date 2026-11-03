'use client';

import React from 'react';
import { AdminCandidatosScreen } from '@/components/screens/admin-candidatos-screen';

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#E9ECE8] py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <AdminCandidatosScreen standalone={true} />
    </main>
  );
}
