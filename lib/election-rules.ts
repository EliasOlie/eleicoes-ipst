import crypto from 'crypto';
import type postgres from 'postgres';

type Sql = postgres.Sql | postgres.TransactionSql;

/** Nome comparável: sem acento, minúsculo, espaços simples. "  João   Pedro " → "joao pedro" */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nome para gravar: só colapsa espaços (mantém acentos e maiúsculas digitados). */
export function cleanDisplayName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

/** Só dígitos, sem o +55 do país. */
export function phoneDigits(phone: string): string {
  let d = String(phone ?? '').replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  return d;
}

/**
 * Chave de comparação do telefone: DDD + últimos 8 dígitos.
 * Ignora o 9º dígito e a formatação, mas diferencia DDDs.
 */
export function phoneKey(phone: string): string {
  const d = phoneDigits(phone);
  if (d.length < 10) return '';
  return d.slice(0, 2) + d.slice(-8);
}

export function newReceipt(): string {
  // 8 caracteres sem ambiguidade (sem 0/O/1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

export class SelectionError extends Error {}

/**
 * Valida a cédula no servidor: listas de IDs sem repetição, candidatos ativos
 * do cargo certo e no máximo o número de vagas configurado.
 */
export async function validateSelection(
  sql: Sql,
  selection: unknown
): Promise<{ diac: string[]; presb: string[] }> {
  const sel = (selection ?? {}) as { diac?: unknown; presb?: unknown };
  const asList = (v: unknown, label: string): string[] => {
    if (v === undefined || v === null) return [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string')) {
      throw new SelectionError(`Cédula inválida (${label}).`);
    }
    if (new Set(v).size !== v.length) {
      throw new SelectionError(`Cédula inválida: candidato repetido no ${label}.`);
    }
    return v as string[];
  };

  const diac = asList(sel.diac, 'diaconato');
  const presb = asList(sel.presb, 'presbiterato');

  const [config] = await sql`SELECT vagas_diac, vagas_presb FROM election_config WHERE id = 1`;
  const vagasDiac = Number(config?.vagas_diac ?? 0);
  const vagasPresb = Number(config?.vagas_presb ?? 0);

  if (diac.length > vagasDiac) {
    throw new SelectionError(`Máximo de ${vagasDiac} candidato(s) ao diaconato.`);
  }
  if (presb.length > vagasPresb) {
    throw new SelectionError(`Máximo de ${vagasPresb} candidato(s) ao presbiterato.`);
  }

  const ids = [...diac, ...presb];
  if (ids.length) {
    const rows = await sql`SELECT id, role FROM candidates WHERE active = true AND id IN ${sql(ids)}`;
    const roleById = new Map(rows.map((r) => [r.id as string, r.role as string]));
    for (const id of diac) {
      if (roleById.get(id) !== 'diac') throw new SelectionError('Cédula inválida: candidato ao diaconato não encontrado.');
    }
    for (const id of presb) {
      if (roleById.get(id) !== 'presb') throw new SelectionError('Cédula inválida: candidato ao presbiterato não encontrado.');
    }
  }

  return { diac, presb };
}

export async function computeTally(sql: Sql) {
  await ensureSchema(sql);
  const [counts] = await sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE is_blank)::int AS blanks,
           count(*) FILTER (WHERE is_null)::int AS nulls
    FROM votes
  `;
  const tallyRows = await sql`
    SELECT candidate_id, count(*)::int AS votes FROM vote_candidates GROUP BY candidate_id
  `;
  const tally: Record<string, number> = {};
  tallyRows.forEach((r) => {
    tally[r.candidate_id] = r.votes;
  });
  return { counted: counts?.total || 0, blanks: counts?.blanks || 0, nulls: counts?.nulls || 0, tally };
}

/**
 * Com a votação aberta, quem é conferido depois da aprovação também vota —
 * então o total de aptos (e a maioria exibida) acompanha a ata em tempo real.
 * Retorna o novo total publicado, ou null se a votação está fechada.
 */
export async function syncPublishedQuorum(sql: Sql): Promise<number | null> {
  const rows = await sql`
    UPDATE election_config
    SET published_quorum = (SELECT count(*)::int FROM members WHERE checked_in = true),
        updated_at = NOW()
    WHERE id = 1 AND voting_open = true
    RETURNING published_quorum, published_at
  `;
  return rows.length ? Number(rows[0].published_quorum) : null;
}

/**
 * Migrações idempotentes do schema. Rodam uma vez por processo; todas são seguras
 * com o app no ar (IF NOT EXISTS / DROP DEFAULT / UPDATE ... WHERE ... IS NOT NULL).
 */
const globalForSchema = globalThis as unknown as { schemaReady?: Promise<void> };
export function ensureSchema(sql: Sql): Promise<void> {
  if (!globalForSchema.schemaReady) {
    globalForSchema.schemaReady = (async () => {
      // "Recebeu cédula de papel"
      await sql`ALTER TABLE members ADD COLUMN IF NOT EXISTS voted_on_paper BOOLEAN NOT NULL DEFAULT FALSE`;
      // Cédula de papel anulada pela Mesa: entra na base dos 50%+1, sem votos para ninguém
      await sql`ALTER TABLE votes ADD COLUMN IF NOT EXISTS is_null BOOLEAN NOT NULL DEFAULT FALSE`;

      // SIGILO: membro.voted_at e cédula.created_at eram gravados na mesma transação
      // com o mesmo NOW() — cruzando os horários, dava para saber em quem cada um votou.
      // Nenhum horário é gravado na cédula nem no momento do voto do membro.
      await sql`ALTER TABLE votes ALTER COLUMN created_at DROP DEFAULT`;
      await sql`UPDATE votes SET created_at = NULL WHERE created_at IS NOT NULL`;
      await sql`UPDATE members SET voted_at = NULL WHERE voted_at IS NOT NULL`;
    })().catch((err) => {
      globalForSchema.schemaReady = undefined; // tenta de novo na próxima requisição
      throw err;
    });
  }
  return globalForSchema.schemaReady;
}

/** Feature flag da rota de stress test — desligada por padrão. */
export function isStressTestEnabled(): boolean {
  return process.env.ENABLE_STRESS_TEST === 'true';
}
