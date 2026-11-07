'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Member, CandidateResult } from '@/types/election';
import { getInitials, maskPhone } from '@/lib/mock-data';
import {
  STATUS_LABEL,
  computeOfficeResults,
  isElectionFinal,
  majorityOf,
} from '@/lib/election-results';

async function readError(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) return 'Sessão da Mesa expirada ou não autenticada. Entre novamente com a senha.';
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

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
  /** Máximo de marcações por cédula = menor entre vagas e candidatos do cargo */
  maxMarksDiac: number;
  maxMarksPresb: number;
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
  /** Cédulas de papel anuladas pela Mesa (entram na base dos 50%+1) */
  nulls: number;
  /** 50%+1 das cédulas apuradas (brancas e nulas incluídas) */
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
  castPaperVote: (
    selection: { diac: string[]; presb: string[] },
    nullBallot?: boolean
  ) => Promise<{ success: boolean; receipt?: string; error?: string }>;
  resetBallot: () => void;
  receipt: string;
  votingError: string;
  voteSubmitting: boolean;

  // Cédula de papel: entregues pela Mesa x apuradas pelos escrutinadores
  paperHanded: number;
  paperCounted: number;
  markPaperHanded: (memberId: number) => Promise<boolean>;

  // Admin Session
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  authChecked: boolean;
  features: { stressTest: boolean };
  logoutAdmin: () => Promise<void>;
  refreshState: () => Promise<void>;

  // Erro da última ação da Mesa/Admin (nada é mostrado como salvo sem o servidor confirmar)
  actionError: string;
  clearActionError: () => void;
}

const ElectionContext = createContext<ElectionContextType | null>(null);

export function ElectionProvider({ children }: { children: React.ReactNode }) {
  // Config
  const [diac, setDiac] = useState<[string, string, number][]>([]);
  const [presb, setPresb] = useState<[string, string, number][]>([]);
  const [vd, setVdInternal] = useState(5);
  const [vp, setVpInternal] = useState(5);

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
  const [nulls, setNulls] = useState(0);

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
  const [totalComungantes, setTotalComungantes] = useState<number>(300);

  // Admin user state
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [features, setFeatures] = useState<{ stressTest: boolean }>({ stressTest: false });
  const [actionError, setActionError] = useState('');
  const [voteSubmitting, setVoteSubmitting] = useState(false);
  const [paperHanded, setPaperHanded] = useState(0);
  const [paperCounted, setPaperCounted] = useState(0);
  const voteInFlight = useRef(false);
  const isAdminRef = useRef(false);
  useEffect(() => {
    isAdminRef.current = !!adminUser;
  }, [adminUser]);

  const restartSimulation = useCallback(async () => {
    if (!window.confirm('Apagar TODOS os votos registrados e reiniciar a apuração? Esta ação não pode ser desfeita.')) {
      return;
    }
    const res = await fetch('/api/election/reset', { method: 'POST' }).catch(() => null);
    if (!res || !res.ok) {
      setActionError(res ? await readError(res, 'Erro ao reiniciar apuração.') : 'Falha de conexão.');
    }
  }, []);

  // 1. Fetch State from Postgres API
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch('/api/election/state', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      if (data.config) {
        setVotingOpen(!!data.config.votingOpen);
        setPublished(data.config.published ?? 0);
        setPublishedAt(data.config.publishedAt || '');
        setVdInternal(data.config.vagasDiac || 5);
        setVpInternal(data.config.vagasPresb || 5);
        if (data.config.totalComungantes) {
          setTotalComungantes(data.config.totalComungantes);
        }
      }

      if (data.candidates) {
        setDiac(data.candidates.diac || []);
        setPresb(data.candidates.presb || []);
      }

      if (data.members) {
        // Nome/telefone só chegam para a Mesa autenticada
        setMembers(
          data.members.map((m: any) => ({
            id: m.id,
            name: m.name ?? '',
            phone: m.phone ?? '',
            time: m.time || '',
            hasVoted: !!m.hasVoted,
            votedOnPaper: !!m.votedOnPaper,
          }))
        );
        setPaperHanded(data.paperHanded ?? 0);
        setPaperCounted(data.paperCounted ?? 0);

        const checkMap: Record<number, boolean> = {};
        data.members.forEach((m: any) => {
          checkMap[m.id] = !!m.checked;
        });
        setChecked(checkMap);
      }

      setCounted(data.counted || 0);
      setBlanks(data.blanks || 0);
      setNulls(data.nulls || 0);
      setTally(data.tally || {});
    } catch (e) {
      console.warn('Could not sync with Postgres API, using cached state:', e);
    }
  }, []);

  // 2. Check Admin Session (e recarrega o estado: a Mesa recebe nomes/telefones)
  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setFeatures({ stressTest: !!data.features?.stressTest });
        if (data.authenticated && data.admin) {
          setAdminUser(data.admin);
          refreshState();
        } else {
          setAdminUser(null);
        }
      })
      .catch(() => setAdminUser(null))
      .finally(() => setAuthChecked(true));
  }, [refreshState]);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // 3. Connect to Realtime SSE (Redis Pub/Sub stream)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isMounted = true;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // Mesa: novos cadastros chegam sem telefone pelo canal público; busca a lista completa (agrupado)
    const scheduleAdminRefresh = () => {
      if (!isAdminRef.current || refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshState();
      }, 800);
    };

    // Plano B: enquanto o tempo real (Redis/SSE) não estiver confirmado, atualiza a cada 10s.
    // "Saudável" = recebeu CONNECTED (só chega quando o servidor assinou o Redis).
    let sseHealthy = false;
    const pollTimer = setInterval(() => {
      if (!sseHealthy) refreshState();
    }, 10000);

    try {
      eventSource = new EventSource('/api/realtime');

      eventSource.onmessage = (event) => {
        if (!isMounted || !event.data) return;
        try {
          const payload = JSON.parse(event.data);

          switch (payload.type) {
            case 'CONNECTED':
              // (Re)conectou: sincroniza o que pode ter sido perdido enquanto estava fora
              if (!sseHealthy) {
                sseHealthy = true;
                refreshState();
              }
              break;

            case 'VOTE_CAST':
              if (payload.counted !== undefined) setCounted(payload.counted);
              if (payload.blanks !== undefined) setBlanks(payload.blanks);
              if (payload.nulls !== undefined) setNulls(payload.nulls);
              if (payload.tally) setTally(payload.tally);
              if (typeof payload.paperCounted === 'number') setPaperCounted(payload.paperCounted);
              // Mesa: atualiza o status "votou" da lista (o evento não diz quem votou — sigilo)
              scheduleAdminRefresh();
              break;

            case 'PAPER_HANDED':
              if (typeof payload.paperHanded === 'number') setPaperHanded(payload.paperHanded);
              if (typeof payload.paperCounted === 'number') setPaperCounted(payload.paperCounted);
              scheduleAdminRefresh();
              break;

            case 'QUORUM_PUBLISHED':
              setVotingOpen(true);
              if (payload.published) setPublished(payload.published);
              if (payload.publishedAt) setPublishedAt(payload.publishedAt);
              break;

            case 'QUORUM_UPDATED':
              if (typeof payload.published === 'number') setPublished(payload.published);
              break;

            case 'VOTING_RELOCKED':
              setVotingOpen(false);
              break;

            case 'DATABASE_CLEANED':
              refreshState();
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
                setChecked((prev) => ({
                  ...prev,
                  [payload.member.id]: !!payload.member.checked,
                }));
                scheduleAdminRefresh();
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
        // O navegador reconecta sozinho; até lá o polling acima cobre
        sseHealthy = false;
      };
    } catch {
      // SSE unsupported or offline
    }

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
      if (eventSource) eventSource.close();
    };
  }, [refreshState]);

  // Derived Mesa counters
  const confirmedCount = useMemo(() => {
    return Object.values(checked).filter(Boolean).length;
  }, [checked]);

  const loggedCount = members.length;
  const pendingCount = loggedCount - confirmedCount;
  // Regra da eleição (fonte única em lib/election-results.ts): eleito precisa de
  // 50%+1 das CÉDULAS APURADAS (brancas e nulas incluídas).
  const majority = majorityOf(counted);
  // Resultado só é definitivo com a votação encerrada e todo o papel entregue apurado
  const isCompleted = isElectionFinal({ published, votingOpen, counted, paperCounted, paperHanded });
  // Quórum estatutário da Assembleia IPB: 50% dos membros comungantes
  const quorumMinimo = Math.ceil(totalComungantes * 0.5);
  const currentAttendance = votingOpen ? published : confirmedCount;
  const quorumAtingido = currentAttendance >= quorumMinimo;

  // Verificação individual do membro logado pela mesa
  const isMemberChecked = useMemo(() => {
    if (!loggedMemberData) return false;
    return checked[loggedMemberData.id] !== undefined
      ? !!checked[loggedMemberData.id]
      : !!loggedMemberData.checked;
  }, [loggedMemberData, checked]);

  const statusLabel = isCompleted
    ? 'Apuração concluída'
    : votingOpen
    ? 'Votação em andamento'
    : published > 0
    ? 'Votação encerrada · apurando cédulas de papel'
    : 'Votação não iniciada';

  const statusColor = isCompleted || votingOpen ? '#0A5C36' : '#8A6A12';
  const statusBg = isCompleted || votingOpen ? '#E7F0EA' : '#FBF3DC';

  // Toggle member checked in ata (Postgres + Redis)
  const toggleMemberCheck = useCallback(
    async (id: number) => {
      const nextVal = !checked[id];
      // Otimista, mas desfaz se o servidor não confirmar
      setChecked((prev) => ({ ...prev, [id]: nextVal }));
      setActionError('');

      try {
        const res = await fetch('/api/election/mesa/toggle-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: id, checked: nextVal }),
        });
        if (!res.ok) {
          setChecked((prev) => ({ ...prev, [id]: !nextVal }));
          setActionError(await readError(res, 'Não foi possível salvar a conferência.'));
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (typeof data.published === 'number') setPublished(data.published);
      } catch {
        setChecked((prev) => ({ ...prev, [id]: !nextVal }));
        setActionError('Falha de conexão: a conferência NÃO foi salva. Tente novamente.');
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
    setActionError('');

    try {
      const res = await fetch('/api/election/mesa/publish-quorum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishedAt: timeStr }),
      });
      if (!res.ok) {
        setActionError(await readError(res, 'Não foi possível liberar a votação.'));
        return;
      }
      const data = await res.json();
      setVotingOpen(true);
      setPublished(data.published ?? 0);
      setPublishedAt(data.publishedAt || timeStr);
    } catch {
      setActionError('Falha de conexão: a votação NÃO foi liberada. Tente novamente.');
    }
  }, []);

  const relockVoting = useCallback(async () => {
    setActionError('');
    try {
      const res = await fetch('/api/election/mesa/relock', { method: 'POST' });
      if (!res.ok) {
        setActionError(await readError(res, 'Não foi possível bloquear a votação.'));
        return;
      }
      setVotingOpen(false);
    } catch {
      setActionError('Falha de conexão: a votação NÃO foi bloqueada. Tente novamente.');
    }
  }, []);

  // Configuração (vagas / rol): só altera a tela depois que o servidor confirmar
  const saveConfig = useCallback(async (body: Record<string, number>): Promise<boolean> => {
    setActionError('');
    try {
      const res = await fetch('/api/election/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setActionError(await readError(res, 'Não foi possível salvar a configuração.'));
        return false;
      }
      return true;
    } catch {
      setActionError('Falha de conexão: a alteração NÃO foi salva.');
      return false;
    }
  }, []);

  const setVd = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(vd) : val;
      if (await saveConfig({ vagasDiac: nextVal })) setVdInternal(nextVal);
    },
    [vd, saveConfig]
  );

  const setVp = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(vp) : val;
      if (await saveConfig({ vagasPresb: nextVal })) setVpInternal(nextVal);
    },
    [vp, saveConfig]
  );

  const setTotalComungantesServer = useCallback(
    async (val: number | ((prev: number) => number)) => {
      const nextVal = typeof val === 'function' ? val(totalComungantes) : val;
      if (await saveConfig({ totalComungantes: nextVal })) setTotalComungantes(nextVal);
    },
    [totalComungantes, saveConfig]
  );

  // Add / Remove Candidates (Postgres + Redis)
  const addCandidate = useCallback(
    async (role: 'diac' | 'presb', name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setActionError('');
      try {
        const res = await fetch('/api/election/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, name: trimmed }),
        });
        if (!res.ok) {
          setActionError(await readError(res, 'Não foi possível adicionar o candidato.'));
          return;
        }
        const data = await res.json();
        if (role === 'diac') {
          setDiac((prev) => [...prev, [data.id, data.name, 2]]);
        } else {
          setPresb((prev) => [...prev, [data.id, data.name, 2]]);
        }
        setTally((prev) => ({ ...prev, [data.id]: 0 }));
      } catch {
        setActionError('Falha de conexão: o candidato NÃO foi adicionado.');
      }
    },
    []
  );

  const removeCandidate = useCallback(async (role: 'diac' | 'presb', id: string) => {
    setActionError('');
    try {
      const res = await fetch('/api/election/candidates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setActionError(await readError(res, 'Não foi possível remover o candidato.'));
        return;
      }
      if (role === 'diac') {
        setDiac((prev) => prev.filter((c) => c[0] !== id));
        setSelection((prev) => ({ ...prev, diac: prev.diac.filter((x) => x !== id) }));
      } else {
        setPresb((prev) => prev.filter((c) => c[0] !== id));
        setSelection((prev) => ({ ...prev, presb: prev.presb.filter((x) => x !== id) }));
      }
    } catch {
      setActionError('Falha de conexão: o candidato NÃO foi removido.');
    }
  }, []);

  // Compute results
  const computeResults = useCallback(
    (list: [string, string, number][], vagasLimit: number): CandidateResult[] => {
      // Regra em lib/election-results.ts (mesma usada no CSV e em /relatorios)
      const core = computeOfficeResults(
        list.map(([id, name]) => ({ id, name })),
        tally,
        vagasLimit,
        counted,
        isCompleted
      );
      return core.map((r) => ({
        id: r.id,
        name: r.name,
        initials: getInitials(r.name),
        votes: r.votes,
        elected: r.elected,
        provisional: r.provisional,
        tied: r.tied,
        reachedMajority: r.reachedMajority,
        width: `${Math.min(100, r.pctOfBallots)}%`,
        bar: r.elected ? '#9FD3B1' : r.provisional ? '#7CC497' : r.tied ? '#E8C46A' : '#5FA57B',
        pct: `${Math.round(r.pctOfBallots)}%`,
        sit: STATUS_LABEL[r.status],
        sitColor: r.elected || r.provisional ? '#0A5C36' : r.tied ? '#8A6A12' : '#6B776F',
        sitBg: r.elected ? '#E7F0EA' : r.provisional ? '#EEF6F0' : r.tied ? '#FBF3DC' : '#F1F3F1',
      }));
    },
    [tally, isCompleted, counted]
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
      const limit = isDiac
        ? diac.length ? Math.min(vd, diac.length) : vd
        : presb.length ? Math.min(vp, presb.length) : vp;
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
    [ballotTab, vd, vp, selection, diac.length, presb.length]
  );

  // Cast vote e2e with Postgres & Redis
  const confirmVote = useCallback(async () => {
    // Trava síncrona: toque duplo / clique duplo não envia duas vezes
    if (voteInFlight.current) return;
    voteInFlight.current = true;
    setVoteSubmitting(true);
    setVotingError('');

    try {
      const res = await fetch('/api/election/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: loggedMemberData?.id,
          name: voterName,
          phone: voterPhone,
          selection,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setVotingError(data.error || 'Erro ao registrar voto');
        return;
      }

      setReceipt(data.receipt);
      setBallotStep('done');
    } catch {
      setVotingError('Falha na conexão ao computar voto. Verifique a internet e toque em Confirmar novamente.');
    } finally {
      voteInFlight.current = false;
      setVoteSubmitting(false);
    }
  }, [voterName, voterPhone, selection, loggedMemberData]);

  // Mesa entrega cédula de papel: o membro passa a constar como "já votou"
  const markPaperHanded = useCallback(
    async (memberId: number): Promise<boolean> => {
      setActionError('');
      try {
        const res = await fetch('/api/election/mesa/paper-handout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId }),
        });
        if (!res.ok) {
          setActionError(await readError(res, 'Não foi possível registrar a entrega da cédula.'));
          return false;
        }
        const data = await res.json();
        setPaperHanded(data.paperHanded ?? 0);
        setPaperCounted(data.paperCounted ?? 0);
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, hasVoted: true, votedOnPaper: true } : m))
        );
        return true;
      } catch {
        setActionError('Falha de conexão: a entrega da cédula NÃO foi registrada.');
        return false;
      }
    },
    []
  );

  // Cast paper vote for elderly or manual contingency
  const castPaperVote = useCallback(
    async (paperSelection: { diac: string[]; presb: string[] }, nullBallot = false) => {
      try {
        const res = await fetch('/api/election/vote/paper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nullBallot ? { nullBallot: true } : { selection: paperSelection }),
        });
        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: res.status === 401 ? 'Sessão expirada. Entre novamente.' : data.error || 'Erro ao computar cédula de papel',
          };
        }
        if (typeof data.paperCount === 'number') setPaperCounted(data.paperCount);
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
      // Recarrega para limpar nomes/telefones que estavam na memória da tela
      window.location.href = '/admin/login';
    }
  }, []);

  const value = {
    diac,
    presb,
    vd,
    vp,
    vagasDiac: vd,
    vagasPresb: vp,
    // Ex.: 6 vagas e 5 candidatos → a cédula diz "até 5" (a 6ª vaga fica não preenchida)
    // (lista ainda vazia = carregando → usa as vagas para não exibir "até 0")
    maxMarksDiac: diac.length ? Math.min(vd, diac.length) : vd,
    maxMarksPresb: presb.length ? Math.min(vp, presb.length) : vp,
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
    nulls,
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
    voteSubmitting,
    paperHanded,
    paperCounted,
    markPaperHanded,
    adminUser,
    isAdminAuthenticated: !!adminUser,
    authChecked,
    features,
    logoutAdmin,
    refreshState,
    actionError,
    clearActionError: () => setActionError(''),
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
