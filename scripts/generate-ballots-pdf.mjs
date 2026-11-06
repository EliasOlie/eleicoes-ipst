import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';
import { generateBallotPdfBuffer } from '../lib/ballot-pdf.ts';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

async function generate() {
  console.log('Generating A4 Landscape Election Ballots PDF (16 per sheet)...');

  const sql = postgres(connectionString);
  let candidates = [];
  let vagasDiac = 5;
  let vagasPresb = 5;

  try {
    const [cands, config] = await Promise.all([
      sql`SELECT id, role, name FROM candidates WHERE active = true ORDER BY name ASC`,
      sql`SELECT vagas_diac, vagas_presb FROM election_config WHERE id = 1`,
    ]);

    candidates = cands.map((c) => ({ id: c.id, role: c.role, name: c.name }));
    if (config[0]) {
      vagasDiac = config[0].vagas_diac || 5;
      vagasPresb = config[0].vagas_presb || 5;
    }
    await sql.end();
  } catch (err) {
    console.warn('Could not fetch DB candidates, using defaults:', err.message);
    candidates = [
      { id: 'd1', role: 'diac', name: 'Armando' },
      { id: 'd2', role: 'diac', name: 'João' },
      { id: 'd3', role: 'diac', name: 'Jesus' },
      { id: 'd4', role: 'diac', name: 'Cícero' },
      { id: 'd5', role: 'diac', name: 'Hélio' },
      { id: 'p1', role: 'presb', name: 'Antônio' },
      { id: 'p2', role: 'presb', name: 'Reginaldo' },
      { id: 'p3', role: 'presb', name: 'Emanuel' },
      { id: 'p4', role: 'presb', name: 'Jonas' },
      { id: 'p5', role: 'presb', name: 'Cláudio' },
    ];
  }

  const pdfBytes = await generateBallotPdfBuffer({
    candidates,
    vagasDiac,
    vagasPresb,
    mode: 'all',
  });

  const outputPath = path.join(process.cwd(), 'public/cedula-eleicao-ipst-2026.pdf');
  await fs.writeFile(outputPath, pdfBytes);
  console.log(`✓ 16-up 2-page PDF (Presbíteros + Diáconos separados) successfully generated at: ${outputPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

generate().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
