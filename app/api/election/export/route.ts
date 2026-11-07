import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ensureSchema } from '@/lib/election-rules';
import {
  STATUS_LABEL,
  computeOfficeResults,
  isElectionFinal,
  majorityOf,
} from '@/lib/election-results';

/**
 * Exportação CSV (Mesa autenticada, apenas com a apuração concluída).
 *   ?tipo=resultado → votos por candidato, brancos, nulos e totais
 *   ?tipo=cedulas   → uma linha por cédula, EMBARALHADA, sem ID, horário ou
 *                     comprovante (no espírito do RDV do TSE): permite a qualquer
 *                     pessoa recontar a eleição sem identificar ninguém.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Mesa' }, { status: 401 });
    }

    const tipo = req.nextUrl.searchParams.get('tipo');
    if (tipo !== 'resultado' && tipo !== 'cedulas') {
      return NextResponse.json({ error: 'Use ?tipo=resultado ou ?tipo=cedulas' }, { status: 400 });
    }

    await ensureSchema(sql);

    const [config] = await sql`SELECT * FROM election_config WHERE id = 1`;
    const candidates = await sql`SELECT id, role, name FROM candidates WHERE active = true ORDER BY name`;
    const [counts] = await sql`
      SELECT count(*)::int AS total,
             count(*) FILTER (WHERE is_blank)::int AS blanks,
             count(*) FILTER (WHERE is_null)::int AS nulls,
             count(*) FILTER (WHERE receipt LIKE 'PAPEL-%')::int AS paper
      FROM votes
    `;
    const [handed] = await sql`SELECT count(*)::int AS total FROM members WHERE voted_on_paper`;

    const isFinal = isElectionFinal({
      published: Number(config?.published_quorum || 0),
      votingOpen: !!config?.voting_open,
      counted: counts.total,
      paperCounted: counts.paper,
      paperHanded: handed.total,
    });
    if (!isFinal) {
      return NextResponse.json(
        {
          error:
            'A exportação só fica disponível com a apuração concluída: votação encerrada e todas as cédulas de papel entregues apuradas.',
        },
        { status: 409 }
      );
    }

    const nameById = new Map(candidates.map((c) => [c.id as string, c.name as string]));
    const roleById = new Map(candidates.map((c) => [c.id as string, c.role as string]));
    const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Recife' });

    let rows: (string | number)[][];
    let filename: string;

    if (tipo === 'resultado') {
      const tallyRows = await sql`SELECT candidate_id, count(*)::int AS votes FROM vote_candidates GROUP BY candidate_id`;
      const tally: Record<string, number> = {};
      tallyRows.forEach((r) => (tally[r.candidate_id] = r.votes));

      rows = [['cargo', 'posicao', 'candidato', 'votos', 'percentual_das_cedulas', 'situacao']];
      for (const [role, label, vagas] of [
        ['diac', 'Diaconato', Number(config.vagas_diac)],
        ['presb', 'Presbiterato', Number(config.vagas_presb)],
      ] as const) {
        const list = candidates.filter((c) => c.role === role).map((c) => ({ id: c.id, name: c.name }));
        const res = computeOfficeResults(list, tally, vagas, counts.total, true);
        res.forEach((r, i) =>
          rows.push([label, i + 1, r.name, r.votes, r.pctOfBallots.toFixed(2).replace('.', ','), STATUS_LABEL[r.status]])
        );
      }
      rows.push([]);
      rows.push(['total', '', 'Cédulas apuradas (base dos 50%+1)', counts.total, '100,00', '']);
      rows.push(['total', '', 'Maioria exigida (50%+1)', majorityOf(counts.total), '', '']);
      rows.push(['total', '', 'Cédulas em branco', counts.blanks, '', '']);
      rows.push(['total', '', 'Cédulas nulas', counts.nulls, '', '']);
      rows.push(['total', '', 'Cédulas de papel', counts.paper, '', '']);
      rows.push(['total', '', 'Membros aptos na ata', Number(config.published_quorum), '', '']);
      filename = `resultado-eleicao-ipst-${date}.csv`;
    } else {
      const ballots = await sql`
        SELECT v.is_blank, v.is_null, (v.receipt LIKE 'PAPEL-%') AS papel,
               COALESCE(ARRAY_AGG(vc.candidate_id) FILTER (WHERE vc.candidate_id IS NOT NULL), '{}') AS ids
        FROM votes v
        LEFT JOIN vote_candidates vc ON vc.vote_id = v.id
        GROUP BY v.id
      `;
      // Embaralha (Fisher-Yates criptográfico): a ordem não revela a ordem de votação
      const list = [...ballots];
      for (let i = list.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [list[i], list[j]] = [list[j], list[i]];
      }

      rows = [['cedula', 'origem', 'tipo', 'diaconato', 'presbiterato']];
      list.forEach((b, i) => {
        const ids: string[] = b.ids || [];
        const pick = (role: string) =>
          ids
            .filter((id) => roleById.get(id) === role)
            .map((id) => nameById.get(id) || id)
            .sort((a, z) => a.localeCompare(z, 'pt-BR'))
            .join(' | ');
        const tipoCedula = b.is_null ? 'nula' : b.is_blank ? 'branca' : 'com voto';
        rows.push([i + 1, b.papel ? 'papel' : 'celular', tipoCedula, pick('diac'), pick('presb')]);
      });
      filename = `cedulas-eleicao-ipst-${date}.csv`;
    }

    const esc = (v: string | number) => {
      const s = String(v ?? '');
      return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = '﻿' + rows.map((r) => r.map(esc).join(';')).join('\r\n') + '\r\n';

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return NextResponse.json({ error: 'Erro ao exportar' }, { status: 500 });
  }
}
