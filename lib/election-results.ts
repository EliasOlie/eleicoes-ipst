/**
 * REGRA DE APURAÇÃO — fonte única usada pelo telão, relatório, página de
 * resultados e exportação CSV. Sem dependências de servidor/navegador.
 *
 * - Maioria exigida: 50% + 1 do total de CÉDULAS apuradas (celular + papel),
 *   contando brancas e nulas. Não existe "votos válidos".
 * - Entre os candidatos que alcançam a maioria, os mais votados ocupam as vagas.
 * - Empate na última vaga entre quem alcançou a maioria: ninguém do grupo é
 *   eleito — decisão da Mesa. Vaga sem ninguém com maioria fica em aberto.
 * - O resultado só é definitivo com a votação encerrada e todas as cédulas de
 *   papel entregues já apuradas.
 */

export type CandidateStatus =
  | 'eleito'
  | 'empate'
  | 'nao_eleito_vagas'
  | 'sem_maioria'
  | 'acima_da_maioria'
  | 'em_apuracao';

export const STATUS_LABEL: Record<CandidateStatus, string> = {
  eleito: 'Eleito',
  empate: 'Empate',
  nao_eleito_vagas: 'Não eleito (vagas)',
  sem_maioria: 'Sem maioria',
  acima_da_maioria: 'Acima da maioria',
  em_apuracao: 'Em apuração',
};

export interface TallyResult {
  id: string;
  name: string;
  votes: number;
  /** % sobre o total de cédulas apuradas */
  pctOfBallots: number;
  reachedMajority: boolean;
  tied: boolean;
  /** Eleito definitivo (apuração concluída) */
  elected: boolean;
  /** Seria eleito, mas a apuração ainda não terminou */
  provisional: boolean;
  status: CandidateStatus;
}

export function majorityOf(ballots: number): number {
  return Math.floor(ballots / 2) + 1;
}

export function isElectionFinal(s: {
  published: number;
  votingOpen: boolean;
  counted: number;
  paperCounted: number;
  paperHanded: number;
}): boolean {
  return s.published > 0 && !s.votingOpen && s.counted > 0 && s.paperCounted >= s.paperHanded;
}

export function computeOfficeResults(
  candidates: { id: string; name: string }[],
  tally: Record<string, number>,
  vagas: number,
  ballots: number,
  isFinal: boolean
): TallyResult[] {
  const majority = majorityOf(ballots);
  const sorted = candidates
    .map((c) => ({ id: c.id, name: c.name, votes: tally[c.id] || 0 }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, 'pt-BR'));

  // Elegíveis = prefixo de sorted com votos >= maioria
  const eligible = ballots > 0 ? sorted.filter((r) => r.votes >= majority) : [];
  let cutoff = -1;
  let tieAtCutoff = false;
  if (vagas > 0 && eligible.length > vagas) {
    cutoff = eligible[vagas - 1].votes;
    tieAtCutoff = eligible[vagas].votes === cutoff;
  }

  return sorted.map((r, i) => {
    const reachedMajority = ballots > 0 && r.votes >= majority;
    const tied = reachedMajority && tieAtCutoff && r.votes === cutoff;
    const wins = reachedMajority && !tied && i < vagas;
    const elected = wins && isFinal;
    const provisional = wins && !isFinal;

    let status: CandidateStatus = 'em_apuracao';
    if (isFinal) {
      status = elected ? 'eleito' : tied ? 'empate' : reachedMajority ? 'nao_eleito_vagas' : 'sem_maioria';
    } else if (provisional) {
      status = 'acima_da_maioria';
    } else if (tied) {
      status = 'empate';
    }

    return {
      ...r,
      pctOfBallots: ballots > 0 ? (r.votes / ballots) * 100 : 0,
      reachedMajority,
      tied,
      elected,
      provisional,
      status,
    };
  });
}

/** Vagas sem eleito: 0 se houver empate (as vagas restantes estão em disputa). */
export function openSeats(results: TallyResult[], vagas: number): { open: number; tied: boolean } {
  const tied = results.some((r) => r.tied);
  const filled = results.filter((r) => r.elected || r.provisional).length;
  return { open: Math.max(0, vagas - filled), tied };
}
