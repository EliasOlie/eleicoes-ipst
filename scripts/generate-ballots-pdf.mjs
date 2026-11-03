import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';
import { generateBallotPdfBuffer } from '../lib/ballot-pdf.ts';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

async function generate() {
  console.log('Generating A4 Landscape Election Ballots PDF (12 per sheet)...');

  const sql = postgres(connectionString);
  let candidates = [];
  let vagasDiac = 3;
  let vagasPresb = 2;

  try {
    const [cands, config] = await Promise.all([
      sql`SELECT id, role, name FROM candidates WHERE active = true ORDER BY name ASC`,
      sql`SELECT vagas_diac, vagas_presb FROM election_config WHERE id = 1`,
    ]);

    candidates = cands.map((c) => ({ id: c.id, role: c.role, name: c.name }));
    if (config[0]) {
      vagasDiac = config[0].vagas_diac || 3;
      vagasPresb = config[0].vagas_presb || 2;
    }
    await sql.end();
  } catch (err) {
    console.warn('Could not fetch DB candidates, using defaults:', err.message);
    candidates = [
      { id: 'd1', role: 'diac', name: 'André Lucas Ferraz' },
      { id: 'd2', role: 'diac', name: 'Benedito Alves Nogueira' },
      { id: 'd3', role: 'diac', name: 'Cícero Monteiro Lima' },
      { id: 'd4', role: 'diac', name: 'Daniel Bezerra Torres' },
      { id: 'd5', role: 'diac', name: 'Elias Cavalcanti Souza' },
      { id: 'd6', role: 'diac', name: 'Fábio Rodrigues Araújo' },
      { id: 'p1', role: 'presb', name: 'Gilberto Magalhães Silva' },
      { id: 'p2', role: 'presb', name: 'Hélio Pereira Barbosa' },
      { id: 'p3', role: 'presb', name: 'Isaías Ferreira Lima' },
      { id: 'p4', role: 'presb', name: 'Jonas Araújo Bezerra' },
    ];
  }

  const pdfBytes = await generateBallotPdfBuffer({
    candidates,
    vagasDiac,
    vagasPresb,
  });

  const outputPath = path.join(process.cwd(), 'public/cedula-eleicao-ipst-2026.pdf');
  await fs.writeFile(outputPath, pdfBytes);
  console.log(`✓ 8-up PDF successfully generated at: ${outputPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

generate().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
