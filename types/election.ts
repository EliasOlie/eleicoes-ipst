export interface Candidate {
  id: string;
  name: string;
  weight: number;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  time: string;
  hasVoted?: boolean;
  votedOnPaper?: boolean;
}

export interface CandidateResult {
  id: string;
  name: string;
  initials: string;
  votes: number;
  width: string;
  pct: string;
  elected: boolean;
  /** Empatado na última vaga — decisão da Mesa */
  tied?: boolean;
  /** Seria eleito, mas a apuração ainda não terminou */
  provisional?: boolean;
  reachedMajority?: boolean;
  bar: string;
  sit: string;
  sitColor: string;
  sitBg: string;
}

export interface ElectionState {
  // Candidate configuration
  diac: [string, string, number][]; // [id, name, weight]
  presb: [string, string, number][];
  vd: number; // vagas diaconato
  vp: number; // vagas presbiterato
  newD: string;
  newP: string;

  // Quorum & Mesa
  members: Member[];
  checked: Record<number, boolean>;
  votingOpen: boolean;
  published: number;
  publishedAt: string;
  filter: 'all' | 'pend';
  q: string;

  // Real-time counting / Tally
  counted: number;
  tally: Record<string, number>;
  blanks: number;
  simulationActive: boolean;
  speedMs: number;

  // Current Voter Session
  voterName: string;
  voterPhone: string;
  loggedMember: string | null;
  ballotStep: 'login' | 'vote' | 'review' | 'done';
  ballotTab: 'diac' | 'presb';
  selection: {
    diac: string[];
    presb: string[];
  };
  receipt: string;
}
