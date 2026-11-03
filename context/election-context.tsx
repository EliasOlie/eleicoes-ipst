'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Member, CandidateResult } from '@/types/election';
import {
  INITIAL_DIAC,
  INITIAL_PRESB,
  generateMembers,
  generateInitialCheck,
  TOTAL_COMUNGANTES,
  QUORUM_MINIMO,
  getInitials,
  maskPhone,
  pickWeighted,
  pad,
} from '@/lib/mock-data';

interface ElectionContextType {
  // Config
  diac: [string, string, number][];
  presb: [string, string, number][];
  vd: number;
  vp: number;
  vagasDiac: number;
  vagasPresb: number;
  setVd: (val: number | ((prev: number) => number)) => void;
  setVp: (val: number | ((prev: number) => number)) => void;
  addCandidate: (role: 'diac' | 'presb', name: string) => void;
  removeCandidate: (role: 'diac' | 'presb', id: string) => void;

  // Quorum & Mesa
  members: Member[];
  checked: Record<number, boolean>;
  toggleMemberCheck: (id: number) => void;
  votingOpen: boolean;
  published: number;
  publishedAt: string;
  publishQuorum: () => void;
  relockVoting: () => void;
  filter: 'all' | 'pend';
  setFilter: (f: 'all' | 'pend') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredMembers: (Member & { checked: boolean })[];
  confirmedCount: number;
  pendingCount: number;
  loggedCount: number;

  // Simulation & Counting
  counted: number;
  tally: Record<string, number>;
  blanks: number;
  majority: number;
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  restartSimulation: () => void;
  resDiac: CandidateResult[];
  resPresb: CandidateResult[];
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  isCompleted: boolean;
  quorumAtingido: boolean;

  // Voter session
  voterName: string;
  setVoterName: (n: string) => void;
  voterPhone: string;
  setVoterPhone: (p: string) => void;
  loggedMember: string | null;
  ballotStep: 'login' | 'vote' | 'review' | 'done';
  setBallotStep: (s: 'login' | 'vote' | 'review' | 'done') => void;
  ballotTab: 'diac' | 'presb';
  setBallotTab: (t: 'diac' | 'presb') => void;
  selection: { diac: string[]; presb: string[] };
  toggleCandidateSelection: (id: string) => void;
  loginMember: () => void;
  confirmVote: () => void;
  resetBallot: () => void;
  receipt: string;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export function ElectionProvider({ children }: { children: React.ReactNode }) {
  // Candidates & Vacancies
  const [diac, setDiac] = useState<[string, string, number][]>(INITIAL_DIAC);
  const [presb, setPresb] = useState<[string, string, number][]>(INITIAL_PRESB);
  const [vd, setVd] = useState(3);
  const [vp, setVp] = useState(2);

  // Members & Check
  const members = useMemo(() => generateMembers(), []);
  const [checked, setChecked] = useState<Record<number, boolean>>(() =>
    generateInitialCheck(members)
  );

  const initialQuorum = useMemo(() => {
    return Object.values(generateInitialCheck(members)).filter(Boolean).length;
  }, [members]);

  const [votingOpen, setVotingOpen] = useState(false);
  const [published, setPublished] = useState(initialQuorum);
  const [publishedAt, setPublishedAt] = useState('19:45');
  const [filter, setFilter] = useState<'all' | 'pend'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counting
  const initialZeroTally = useCallback(() => {
    return Object.fromEntries([...INITIAL_DIAC, ...INITIAL_PRESB].map((c) => [c[0], 0]));
  }, []);

  const [counted, setCounted] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>(initialZeroTally);
  const [blanks, setBlanks] = useState(0);
  const [simulationActive, setSimulationActive] = useState(true);

  // Voter session
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [loggedMember, setLoggedMember] = useState<string | null>(null);
  const [ballotStep, setBallotStep] = useState<'login' | 'vote' | 'review' | 'done'>('login');
  const [ballotTab, setBallotTab] = useState<'diac' | 'presb'>('diac');
  const [selection, setSelection] = useState<{ diac: string[]; presb: string[] }>({
    diac: [],
    presb: [],
  });
  const [receipt, setReceipt] = useState('');

  // Simulation tick loop
  useEffect(() => {
    if (!simulationActive || !votingOpen || counted >= published) return;

    const timer = setTimeout(() => {
      setCounted((prevCount) => {
        if (prevCount >= published) return prevCount;
        const newCount = prevCount + 1;

        // Tally selection for this simulated ballot
        setTally((prevTally) => {
          const nextTally = { ...prevTally };
          let blankAdded = false;

          [[diac, vd], [presb, vp]].forEach(([list, vac]) => {
            const castList = list as [string, string, number][];
            const castVac = vac as number;

            if (Math.random() < 0.03) {
              blankAdded = true;
              return;
            }

            const k = Math.random() < 0.7 ? castVac : Math.max(1, castVac - 1);
            const picked = pickWeighted(castList, k);
            picked.forEach((id) => {
              nextTally[id] = (nextTally[id] || 0) + 1;
            });
          });

          if (blankAdded) {
            setBlanks((b) => b + 1);
          }

          return nextTally;
        });

        return newCount;
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [simulationActive, votingOpen, counted, published, diac, presb, vd, vp]);

  // Derived Mesa counters
  const confirmedCount = useMemo(() => {
    return Object.values(checked).filter(Boolean).length;
  }, [checked]);

  const loggedCount = members.length;
  const pendingCount = loggedCount - confirmedCount;
  const majority = Math.floor(published / 2) + 1;
  const maxV = Math.max(1, published);
  const isCompleted = counted >= published && published > 0;
  const quorumAtingido = published >= QUORUM_MINIMO;

  const statusLabel = !votingOpen
    ? 'Votação não iniciada'
    : isCompleted
    ? 'Apuração concluída'
    : 'Apuração em andamento';

  const statusColor = !votingOpen ? '#8A6A12' : '#0A5C36';
  const statusBg = !votingOpen ? '#FBF3DC' : '#E7F0EA';

  // Toggle member checked
  const toggleMemberCheck = useCallback((id: number) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const qClean = searchQuery.trim().toLowerCase();
    return members
      .filter((m) => {
        const matchesQ =
          !qClean ||
          m.name.toLowerCase().includes(qClean) ||
          m.phone.replace(/\D/g, '').includes(qClean.replace(/\D/g, ''));
        const matchesFilter = filter === 'all' || !checked[m.id];
        return matchesQ && matchesFilter;
      })
      .map((m) => ({
        ...m,
        checked: !!checked[m.id],
      }));
  }, [members, searchQuery, filter, checked]);

  // Publish Quorum
  const publishQuorum = useCallback(() => {
    const d = new Date();
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setVotingOpen(true);
    setPublished(confirmedCount);
    setPublishedAt(timeStr);
    setCounted(0);
    setTally(initialZeroTally());
    setBlanks(0);
  }, [confirmedCount, initialZeroTally]);

  const relockVoting = useCallback(() => {
    setVotingOpen(false);
    setCounted(0);
    setTally(initialZeroTally());
    setBlanks(0);
  }, [initialZeroTally]);

  const restartSimulation = useCallback(() => {
    setCounted(0);
    setTally(initialZeroTally());
    setBlanks(0);
  }, [initialZeroTally]);

  // Candidate administration
  const addCandidate = useCallback((role: 'diac' | 'presb', name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newId = `${role[0]}${Date.now()}`;
    if (role === 'diac') {
      setDiac((prev) => [...prev, [newId, trimmed, 2]]);
    } else {
      setPresb((prev) => [...prev, [newId, trimmed, 2]]);
    }
    setTally((prev) => ({ ...prev, [newId]: 0 }));
  }, []);

  const removeCandidate = useCallback((role: 'diac' | 'presb', id: string) => {
    if (role === 'diac') {
      setDiac((prev) => prev.filter((c) => c[0] !== id));
      setSelection((prev) => ({ ...prev, diac: prev.diac.filter((x) => x !== id) }));
    } else {
      setPresb((prev) => prev.filter((c) => c[0] !== id));
      setSelection((prev) => ({ ...prev, presb: prev.presb.filter((x) => x !== id) }));
    }
  }, []);

  // Compute results for presentation and report
  const computeResults = useCallback(
    (list: [string, string, number][], vagasLimit: number): CandidateResult[] => {
      const sorted = list
        .map(([id, name]) => ({
          id,
          name,
          initials: getInitials(name),
          votes: tally[id] || 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      return sorted.map((r, i) => {
        const elected = r.votes >= majority && i < vagasLimit;
        const pctVal = Math.round((r.votes / maxV) * 100);
        return {
          ...r,
          elected,
          width: `${Math.min(100, (r.votes / maxV) * 100)}%`,
          bar: elected ? '#9FD3B1' : '#5FA57B',
          pct: `${pctVal}%`,
          sit: elected ? 'Eleito' : isCompleted ? 'Não eleito' : 'Em apuração',
          sitColor: elected ? '#0A5C36' : '#6B776F',
          sitBg: elected ? '#E7F0EA' : '#F1F3F1',
        };
      });
    },
    [tally, majority, maxV, isCompleted]
  );

  const resDiac = useMemo(() => computeResults(diac, vd), [computeResults, diac, vd]);
  const resPresb = useMemo(() => computeResults(presb, vp), [computeResults, presb, vp]);

  // Voter session actions
  const loginMember = useCallback(() => {
    if (voterName.trim().length > 2) {
      setLoggedMember(voterName.trim());
      setBallotStep('vote');
      setSelection({ diac: [], presb: [] });
    }
  }, [voterName]);

  const toggleCandidateSelection = useCallback(
    (id: string) => {
      const isDiac = ballotTab === 'diac';
      const limit = isDiac ? vd : vp;
      const currentList = isDiac ? selection.diac : selection.presb;
      const isSelected = currentList.includes(id);

      if (!isSelected && currentList.length >= limit) return; // reached limit

      setSelection((prev) => ({
        ...prev,
        [ballotTab]: isSelected
          ? prev[ballotTab].filter((x) => x !== id)
          : [...prev[ballotTab], id],
      }));
    },
    [ballotTab, vd, vp, selection]
  );

  const confirmVote = useCallback(() => {
    // Generate clean voter receipt hash (e.g. 4 letters - 4 letters)
    const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    setReceipt(`${p1}-${p2}`);
    setBallotStep('done');

    // Register 1 extra cast vote in tally if voting is open
    if (votingOpen) {
      setCounted((c) => Math.min(published, c + 1));
      setTally((prev) => {
        const next = { ...prev };
        selection.diac.forEach((id) => (next[id] = (next[id] || 0) + 1));
        selection.presb.forEach((id) => (next[id] = (next[id] || 0) + 1));
        return next;
      });
      if (selection.diac.length === 0 && selection.presb.length === 0) {
        setBlanks((b) => b + 1);
      }
    }
  }, [votingOpen, published, selection]);

  const resetBallot = useCallback(() => {
    setBallotStep('login');
    setSelection({ diac: [], presb: [] });
    setBallotTab('diac');
    setLoggedMember(null);
    setVoterName('');
    setVoterPhone('');
    setReceipt('');
  }, []);

  const value = {
    diac,
    presb,
    vd,
    vp,
    vagasDiac: vd,
    vagasPresb: vp,
    setVd,
    setVp,
    addCandidate,
    removeCandidate,
    members,
    checked,
    toggleMemberCheck,
    votingOpen,
    published,
    publishedAt,
    publishQuorum,
    relockVoting,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredMembers,
    confirmedCount,
    pendingCount,
    loggedCount,
    counted,
    tally,
    blanks,
    majority,
    simulationActive,
    setSimulationActive,
    restartSimulation,
    resDiac,
    resPresb,
    statusLabel,
    statusColor,
    statusBg,
    isCompleted,
    quorumAtingido,
    voterName,
    setVoterName,
    voterPhone,
    setVoterPhone: (val: string) => setVoterPhone(maskPhone(val)),
    loggedMember,
    ballotStep,
    setBallotStep,
    ballotTab,
    setBallotTab,
    selection,
    toggleCandidateSelection,
    loginMember,
    confirmVote,
    resetBallot,
    receipt,
  };

  return <ElectionContext.Provider value={value}>{children}</ElectionContext.Provider>;
}

export function useElection() {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
}
