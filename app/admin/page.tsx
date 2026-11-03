'use client';

import React from 'react';
import { AdminCandidatosScreen } from '@/components/screens/admin-candidatos-screen';

export default function AdminPage() {
  return (
    <main className="min-h-screen w-full bg-[#F6F8F5] m-0 p-0 overflow-x-hidden">
      <AdminCandidatosScreen standalone={true} />
    </main>
  );
}
