'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { VoterLoginScreen } from '@/components/screens/voter-login-screen';
import { VoterBlockedScreen } from '@/components/screens/voter-blocked-screen';
import { VoterBallotScreen } from '@/components/screens/voter-ballot-screen';

export default function VoterPage() {
  const { loggedMember, votingOpen } = useElection();

  return (
    <main className="min-h-screen bg-[#E9ECE8] py-6 sm:py-10 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        {!loggedMember ? (
          <VoterLoginScreen standalone={true} />
        ) : !votingOpen ? (
          <VoterBlockedScreen standalone={true} />
        ) : (
          <VoterBallotScreen standalone={true} />
        )}
      </div>
    </main>
  );
}
