'use client';

import React from 'react';
import { useElection } from '@/context/election-context';
import { VoterLoginScreen } from '@/components/screens/voter-login-screen';
import { VoterBlockedScreen } from '@/components/screens/voter-blocked-screen';
import { VoterBallotScreen } from '@/components/screens/voter-ballot-screen';

export default function VoterPage() {
  const { loggedMember, isMemberChecked, votingOpen } = useElection();

  return (
    <main className="min-h-screen bg-[#E9ECE8] sm:py-8 sm:px-4 flex flex-col items-center justify-center p-0">
      {!loggedMember ? (
        <VoterLoginScreen standalone={true} />
      ) : !isMemberChecked || !votingOpen ? (
        <VoterBlockedScreen standalone={true} />
      ) : (
        <VoterBallotScreen standalone={true} />
      )}
    </main>
  );
}
