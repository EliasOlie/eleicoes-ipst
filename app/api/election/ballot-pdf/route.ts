import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateBallotPdfBuffer } from '@/lib/ballot-pdf';

export async function GET(req: NextRequest) {
  try {
    const mode = (req.nextUrl.searchParams.get('mode') as '2-up' | '4-up') || '2-up';

    // Fetch live candidates and vacancies from DB
    const [cands, config] = await Promise.all([
      sql`SELECT id, role, name FROM candidates WHERE active = true ORDER BY name ASC`,
      sql`SELECT vagas_diac, vagas_presb FROM election_config WHERE id = 1`,
    ]);

    const vagasDiac = config[0]?.vagas_diac || 3;
    const vagasPresb = config[0]?.vagas_presb || 2;

    const candidates = cands.map((c) => ({
      id: c.id,
      role: c.role,
      name: c.name,
    }));

    const pdfBytes = await generateBallotPdfBuffer({
      candidates,
      vagasDiac,
      vagasPresb,
      mode,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="cedula-eleicao-ipst-2026.pdf"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error generating ballot PDF:', err);
    return NextResponse.json({ error: 'Erro ao gerar cédula em PDF' }, { status: 500 });
  }
}
