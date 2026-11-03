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
} from '@/lib/mock-data';

interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

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
  setTotalComungantes: (val: number | ((prev: number) => number)) => void;
  addCandidate: (role: 'diac' | 'presb', name: string) => Promise<void>;
  removeCandidate: (role: 'diac' | 'presb', id: string) => Promise<void>;

  // Quorum & Mesa
  members: Member[];
  checked: Record<number, boolean>;
  toggleMemberCheck: (id: number) => Promise<void>;
  votingOpen: boolean;
  published: number;
  publishedAt: string;
  publishQuorum: () => Promise<void>;
  relockVoting: () => Promise<void>;
  filter: 'all' | 'pend';
  setFilter: (f: 'all' | 'pend') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredMembers: (Member & { checked: boolean })[];
  confirmedCount: number;
  pendingCount: number;
  loggedCount: number;

  // Real-time Counting
  counted: number;
  tally: Record<string, number>;
  blanks: number;
  majority: number;
  simulationActive: boolean;
  setSimulationActive: (active: boolean) => void;
  restartSimulation: () => Promise<void>;
  resDiac: CandidateResult[];
  resPresb: CandidateResult[];
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  isCompleted: boolean;
  quorumAtingido: boolean;
  totalComungantes: number;
  quorumMinimo: number;

  // Voter Session
  voterName: string;
  setVoterName: (n: string) => void;
  voterPhone: string;
  setVoterPhone: (p: string) => void;
  loggedMember: string | null;
  loggedMemberData: { id: number; name: string; phone: string; checked: boolean; hasVoted: boolean } | null;
  isMemberChecked: boolean;
  loginLoading: boolean;
  loginError: string;
  ballotStep: 'login' | 'vote' | 'review' | 'done';
  setBallotStep: (s: 'login' | 'vote' | 'review' | 'done') => void;
  ballotTab: 'diac' | 'presb';
  setBallotTab: (t: 'diac' | 'presb') => void;
  selection: { diac: string[]; presb: string[] };
  toggleCandidateSelection: (id: string) => void;
  loginMember: () => Promise<boolean>;
  confirmVote: () => Promise<void>;
  castPaperVote: (selection: { diac: string[]; presb: string[] }) => Promise<{ success: boolean; receipt?: string; error?: string }>;
  resetBallot: () => void;
  receipt: string;
  votingError: string;

  // Admin Session
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  logoutAdmin: () => Promise<void>;
  refreshState: () => Promise<void>;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export function ElectionProvider({ children }: { children: React.ReactNode }) {
  // Config
  const [diac, setDiac] = useState<[string, string, number][]>([]);
  const [presb, setPresb] = useState<[string, string, number][]>([]);
  const [vd, setVdInternal] = useState(3);
  const [vp, setVpInternal] = useState(2);

  // Members & Check
  const [members, setMembers] = useState<Member[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const [votingOpen, setVotingOpen] = useState(false);
  const [published, setPublished] = useState(0);
  const [publishedAt, setPublishedAt] = useState('');
  const [filter, setFilter] = useState<'all' | 'pend'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Counting
  const initialZeroTally = useCallback(() => ({}), []);

  const [counted, setCounted] = useState(0);
  const [tally, setTally] = useState<Record<string, number>>({});
  const [blanks, setBlanks] = useState(0);

  // Voter session
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [loggedMember, setLoggedMember] = useState<string | null>(null);
  const [loggedMemberData, setLoggedMemberData] = useState<{
    id: number;
    name: string;
    phone: string;
    checked: boolean;
    hasVoted: boolean;
  } | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [ballotStep, setBallotStep] = useState<'login' | 'vote' | 'review' | 'done'>('login');
  const [ballotTab, setBallotTab] = useState<'diac' | 'presb'>('diac');
  const [selection, setSelection] = useState<{ diac: string[]; presb: string[] }>({
    diac: [],
    presb: [],
  });
  const [receipt, setReceipt] = useState('');
  const [votingError, setVotingError] = useState('');
  const [simulationActive, setSimulationActive] = useState(true);
  const [totalComungantes, setTotalComungantes] = useState<number>(500);

  // Admin user state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  const restartSimulation = useCallback(async () => {
    try {
      await fetch('/api/election/reset', { method: 'POST' });
    } catch {
      setCounted(0);
      setBlanks(0);
      setTally({});
    }
  }, []);

  // 1. Fetch State from Postgres API
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/election/state');
      if (!res.ok) return;
      const data = await res.json();

      if (data.config) {
        setVotingOpen(!!data.config.votingOpen);
        setPublished(data.config.published ?? 0);
        setPublishedAt(data.config.publishedAt || '');
        setVdInternal(data.config.vagasDiac || 3);
        setVpInternal(data.config.vagasPresb || 2);
        if (data.config.totalComungantes) {
          setTotalComungantes(data.config.totalComungantes);
        }
      }

      if (data.candidates) {
        setDiac(data.candidates.diac || []);
        setPresb(data.candidates.presb || []);
      }

      if (data.members) {
        setMembers(
          data.members.map((m: any) => ({
            id: m.id,
            name: m.name,
            phone: m.phone,
            time: m.time || '19:00',
          }))
        );

        const checkMap: Record<number, boolean> = {};
        data.members.forEach((m: any) => {
          checkMap[m.id] = !!m.checked;
        });
        setChecked(checkMap);
      }

      setCounted(data.counted || 0);
      setBlanks(data.blanks || 0);
      setTally(data.tally || {});
    } catch (e) {
      console.warn('Could not sync with Postgres API, using cached state:', e);
    }
  }, []);

  // 2. Check Admin Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.admin) {
          setAdminUser(data.admin);
        } else {
          setAdminUser(null);
        }
      })
      .catch(() => setAdminUser(null));
  }, []);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // 3. Connect to Realtime SSE (Redis Pub/Sub stream)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;

    try {
      eventSource = new EventSource('/api/realtime');

      eventSource.onmessage = (event) => {
        if (!isMounted || !event.data) return;
        try {
          const payload = JSON.parse(event.data);

          switch (payload.type) {
            case 'VOTE_CAST':
              if (payload.counted !== undefined) setCounted(payload.counted);
              if (payload.blanks !== undefined) setBlanks(payload.blanks);
              if (payload.tally) setTally(payload.tally);
              break;

            case 'QUORUM_PUBLISHED':
              setVotingOpen(true);
              if (payload.published) setPublished(payload.published);
              if (payload.publishedAt) setPublishedAt(payload.publishedAt);
              break;

            case 'VOTING_RELOCKED':
              setVotingOpen(false);
              break;

            case 'MEMBER_CHECKED':
              setChecked((prev) => ({
                ...prev,
                [payload.memberId]: !!payload.checked,
              }));
              setLoggedMemberData((prev) => {
                if (prev && prev.id === payload.memberId) {
                  return { ...prev, checked: !!payload.checked };
                }
                return prev;
              });
              break;

            case 'MEMBER_REGISTERED':
              if (payload.member) {
                setMembers((prev) => {
                  if (prev.some((m) => m.id === payload.member.id)) return prev;
                  return [
                    ...prev,
                    {
                      id: payload.member.id,
                      name: payload.member.name,
                      phone: payload.member.phone,
                      time: payload.member.time || '19:00',
                    },
                  ].sort((a, b) => a.name.localeCompare(b.name));
                });
                setChecked((prev) => ({
                  ...prev,
                  [payload.member.id]: !!payload.member.checked,
                }));
              }
              break;

            case 'VACANCIES_UPDATED':
              if (payload.vagasDiac) setVdInternal(payload.vagasDiac);
              if (payload.vagasPresb) setVpInternal(payload.vagasPresb);
              if (payload.totalComungantes) setTotalComungantes(payload.totalComungantes);
              break;

            case 'CANDIDATE_ADDED':
            case 'CANDIDATE_REMOVED':
              refreshState();
              break;
          }
        } catch {
          // Heartbeat or malformed
        }
      };

      eventSource.onerror = () => {
        // Will auto reconnect
      };
    } catch {
      // SSE unsupported or offline
    }

    return () => {
      isMounted = false;
      if (eventSource) eventSource.close();
    };
  }, [refreshState]);

  // Derived Mesa counters
  const confirmedCount = useMemo(() => {
    return Object.values(checked).filter(Boolean).length;
  }, [checked]);

  const loggedCount = members.length;
  const pendingCount = loggedCount - confirmedCount;
  const majority = Math.floor(published / 2) + 1;
  const maxV = Math.max(1, published);
  const isCompleted = counted >= published && published > 0;
  // Quórum estatutário da Assembleia IPB: 50% dos membros comungantes
  const quorumMinimo = Math.ceil(totalComungantes * 0.5);
  const quorumAtingido = published >= quorumMinimo;

  // Verificação individual do membro logado pela mesa
  const isMemberChecked = useMemo(() => {
    if (!loggedMemberData) return false;
    return checked[loggedMemberData.id] !== undefined
      ? !!checked[loggedMemberData.id]
      : !!loggedMemberData.checked;
  }, [loggedMemberData, checked]);

  const statusLabel = !votingOpen
    ? 'Votação não iniciada'
    : isCompleted
    ? 'Apuração concluída'
    : 'Apuração em andamento';

  const statusColor = !votingOpen ? '#8A6A12' : '#0A5C36';
  const statusBg = !votingOpen ? '#FBF3DC' : '#E7F0EA';

  // Toggle member checked in ata (Postgres + Redis)
  const toggleMemberCheck = useCallback(
    async (id: number) => {
      const nextVal = !checked[id];
      // Optimistic update
      setChecked((prev) => ({ ...prev, [id]: nextVal }));

      try {
        await fetch('/api/election/mesa/toggle-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: id, checked: nextVal }),
        });
      } catch (err) {
        console.error('Failed to sync member check with backend:', err);
      }
    },
    [checked]
  );

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

  // Publish Quorum (Postgres + Redis)
  const publishQuorum = useCallback(async () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    // Optimistic
    setVotingOpen(true);
    setPublished(confirmedCount);
    setPublishedAt(timeStr);

    try {
      await fetch('/api/election/mesa/publish-quorum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedAt: timeStr }),
      });
    } catch (e) {
      console.error('Failed to publish quorum on server:', e);
    }
  }, [confirmedCount]);

  const relockVoting = useCallback(async () => {
    setVotingOpen(false);
    try {
      await fetch('/api/election/mesa/relock', { method: 'POST' });
    } catch (e) {
      console.error('Failed to relock voting on server:', e);
    }
  }, []);

  // Update Vacancies (Postgres + Redis)
  const setVd = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(vd) : val;
      setVdInternal(nextVal);
      try {
        await fetch('/api/election/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vagasDiac: nextVal }),
        });
      } catch (e) {
        console.error('Failed to update vacancies:', e);
      }
    },
    [vd]
  );

  const setVp = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(vp) : val;
      setVpInternal(nextVal);
      try {
        await fetch('/api/election/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vagasPresb: nextVal }),
        });
      } catch (e) {
        console.error('Failed to update vacancies:', e);
      }
    },
    [vp]
  );

  const setTotalComungantesServer = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(totalComungantes) : val;
      setTotalComungantes(nextVal);
      try {
        await fetch('/api/election/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalComungantes: nextVal }),
        });
      } catch (e) {
        console.error('Failed to update total comungantes:', e);
      }
    },
    [totalComungantes]
  );

  // Add / Remove Candidates (Postgres + Redis)
  const addCandidate = useCallback(
    async (role: 'diac' | 'presb', name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      try {
        const res = await fetch('/api/election/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, name: trimmed }),
        });
        const data = await res.json();
        if (data.id) {
          if (role === 'diac') {
            setDiac((prev) => [...prev, [data.id, trimmed, 2]]);
          } else {
            setPresb((prev) => [...prev, [data.id, trimmed, 2]]);
          }
          setTally((prev) => ({ ...prev, [data.id]: 0 }));
        }
      } catch (e) {
        console.error('Failed to add candidate:', e);
      }
    },
    []
  );

  const removeCandidate = useCallback(async (role: 'diac' | 'presb', id: string) => {
    try {
      await fetch('/api/election/candidates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (role === 'diac') {
        setDiac((prev) => prev.filter((c) => c[0] !== id));
        setSelection((prev) => ({ ...prev, diac: prev.diac.filter((x) => x !== id) }));
      } else {
        setPresb((prev) => prev.filter((c) => c[0] !== id));
        setSelection((prev) => ({ ...prev, presb: prev.presb.filter((x) => x !== id) }));
      }
    } catch (e) {
      console.error('Failed to remove candidate:', e);
    }
  }, []);

  // Compute results
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
        // Os mais votados preenchem as vagas disponíveis (desde que tenham ao menos 1 voto)
        const elected = i < vagasLimit && r.votes > 0;
        const reachedMajority = r.votes >= majority;
        const pctVal = maxV > 0 ? Math.round((r.votes / maxV) * 100) : 0;
        return {
          ...r,
          elected,
          reachedMajority,
          width: `${Math.min(100, maxV > 0 ? (r.votes / maxV) * 100 : 0)}%`,
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

  // Voter session - Check-in no sistema e conferência de rol
  const loginMember = useCallback(async (): Promise<boolean> => {
    if (voterName.trim().length < 3) return false;
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/election/member/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voterName.trim(),
          phone: voterPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Erro ao registrar entrada.');
        setLoginLoading(false);
        return false;
      }

      setLoggedMember(data.member.name);
      setLoggedMemberData(data.member);
      setChecked((prev) => ({
        ...prev,
        [data.member.id]: !!data.member.checked,
      }));
      setBallotStep('vote');
      setSelection({ diac: [], presb: [] });
      setVotingError('');
      setLoginLoading(false);
      return true;
    } catch {
      setLoginError('Falha ao conectar com o servidor. Verifique sua conexão.');
      setLoginLoading(false);
      return false;
    }
  }, [voterName, voterPhone]);

  const toggleCandidateSelection = useCallback(
    (id: string) => {
      const isDiac = ballotTab === 'diac';
      const limit = isDiac ? vd : vp;
      const currentList = isDiac ? selection.diac : selection.presb;
      const isSelected = currentList.includes(id);

      if (!isSelected && currentList.length >= limit) return;

      setSelection((prev) => ({
        ...prev,
        [ballotTab]: isSelected
          ? prev[ballotTab].filter((x) => x !== id)
          : [...prev[ballotTab], id],
      }));
    },
    [ballotTab, vd, vp, selection]
  );

  // Cast vote e2e with Postgres & Redis
  const confirmVote = useCallback(async () => {
    setVotingError('');

    try {
      const res = await fetch('/api/election/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: voterName,
          phone: voterPhone,
          selection,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVotingError(data.error || 'Erro ao registrar voto');
        return;
      }

      setReceipt(data.receipt);
      setBallotStep('done');
    } catch {
      setVotingError('Falha na conexão ao computar voto. Tente novamente.');
    }
  }, [voterName, voterPhone, selection]);

  // Cast paper vote for elderly or manual contingency
  const castPaperVote = useCallback(
    async (paperSelection: { diac: string[]; presb: string[] }) => {
      try {
        const res = await fetch('/api/election/vote/paper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selection: paperSelection }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: data.error || 'Erro ao computar cédula de papel' };
        }
        return { success: true, receipt: data.receipt, totalCounted: data.totalCounted };
      } catch {
        return { success: false, error: 'Falha na conexão ao registrar cédula de papel.' };
      }
    },
    []
  );

  const resetBallot = useCallback(() => {
    setBallotStep('login');
    setSelection({ diac: [], presb: [] });
    setBallotTab('diac');
    setLoggedMember(null);
    setLoggedMemberData(null);
    setLoginError('');
    setLoginLoading(false);
    setVoterName('');
    setVoterPhone('');
    setReceipt('');
    setVotingError('');
  }, []);

  const logoutAdmin = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAdminUser(null);
    }
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
    setTotalComungantes: setTotalComungantesServer,
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
    totalComungantes,
    quorumMinimo,
    voterName,
    setVoterName,
    voterPhone,
    setVoterPhone: (val: string) => setVoterPhone(maskPhone(val)),
    loggedMember,
    loggedMemberData,
    isMemberChecked,
    loginLoading,
    loginError,
    ballotStep,
    setBallotStep,
    ballotTab,
    setBallotTab,
    selection,
    toggleCandidateSelection,
    loginMember,
    confirmVote,
    castPaperVote,
    resetBallot,
    receipt,
    votingError,
    adminUser,
    isAdminAuthenticated: !!adminUser,
    logoutAdmin,
    refreshState,
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
