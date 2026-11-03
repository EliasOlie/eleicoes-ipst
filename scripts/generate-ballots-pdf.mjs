import { PDFDocument, rgb, StandardFonts, LineCapStyle } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://app_ipst_admin:8xYVEXYMs6WxaDXv0LVe4Wvq@i1-db.eliasolie.com.br:6432/app_ipst?sslmode=disable';

async function generate() {
  console.log('Generating A4 Landscape Election Ballots PDF...');

  // 1. Fetch Candidates & Vacancies from DB
  const sql = postgres(connectionString);
  let diacList = [];
  let presbList = [];
  let vagasDiac = 3;
  let vagasPresb = 2;

  try {
    const [cands, config] = await Promise.all([
      sql`SELECT id, role, name FROM candidates WHERE active = true ORDER BY name ASC`,
      sql`SELECT vagas_diac, vagas_presb FROM election_config WHERE id = 1`,
    ]);

    diacList = cands.filter((c) => c.role === 'diac');
    presbList = cands.filter((c) => c.role === 'presb');
    if (config[0]) {
      vagasDiac = config[0].vagas_diac || 3;
      vagasPresb = config[0].vagas_presb || 2;
    }
    await sql.end();
  } catch (err) {
    console.warn('Could not fetch DB candidates, using defaults:', err.message);
    diacList = [
      { id: 'd1', name: 'André Lucas Ferraz' },
      { id: 'd2', name: 'Benedito Alves Nogueira' },
      { id: 'd3', name: 'Cícero Monteiro Lima' },
      { id: 'd4', name: 'Daniel Bezerra Torres' },
      { id: 'd5', name: 'Elias Cavalcanti Souza' },
      { id: 'd6', name: 'Fábio Rodrigues Araújo' },
    ];
    presbList = [
      { id: 'p1', name: 'Gilberto Magalhães Silva' },
      { id: 'p2', name: 'Hélio Pereira Barbosa' },
      { id: 'p3', name: 'Isaías Ferreira Lima' },
      { id: 'p4', name: 'Jonas Araújo Bezerra' },
    ];
  }

  // 2. Create PDF in A4 Landscape (841.89 x 595.28 pt)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Embed logo
  let logoImage = null;
  try {
    const logoBytes = await fs.readFile(path.join(process.cwd(), 'public/assets/ipst_logo.jpg'));
    logoImage = await pdfDoc.embedJpg(logoBytes);
  } catch (e) {
    console.warn('Logo image not found or failed to embed:', e.message);
  }

  const primaryDark = rgb(0.027, 0.239, 0.141); // #073D24
  const primaryGreen = rgb(0.039, 0.361, 0.212); // #0A5C36
  const textDark = rgb(0.082, 0.125, 0.102); // #15201A
  const textMuted = rgb(0.29, 0.34, 0.31); // #4A574F
  const borderColor = rgb(0.796, 0.835, 0.808); // #CBD5CE
  const lightBg = rgb(0.965, 0.973, 0.961); // #F6F8F5

  // Half width per ballot: 841.89 / 2 = 420.945 pt
  const halfW = width / 2;

  // Helper to draw one ballot
  function drawBallot(originX, originY, ballotWidth, ballotHeight) {
    const padding = 24;
    const innerX = originX + padding;
    const innerW = ballotWidth - padding * 2;

    // Outer ballot border
    page.drawRectangle({
      x: originX + 10,
      y: originY + 10,
      width: ballotWidth - 20,
      height: ballotHeight - 20,
      borderColor: borderColor,
      borderWidth: 1.5,
      color: rgb(1, 1, 1),
    });

    // Top decorative bar
    page.drawRectangle({
      x: originX + 10,
      y: originY + ballotHeight - 16,
      width: ballotWidth - 20,
      height: 6,
      color: primaryDark,
    });

    let curY = originY + ballotHeight - 34;

    // Logo & Header
    if (logoImage) {
      page.drawImage(logoImage, {
        x: innerX,
        y: curY - 32,
        width: 32,
        height: 32,
      });
    }

    const headerTextX = logoImage ? innerX + 40 : innerX;

    page.drawText('IGREJA PRESBITERIANA DE SERRA TALHADA', {
      x: headerTextX,
      y: curY - 6,
      size: 9.5,
      font: fontBold,
      color: primaryGreen,
    });

    page.drawText('Assembleia Geral Extraordinária para Eleição de Oficiais', {
      x: headerTextX,
      y: curY - 18,
      size: 9,
      font: fontBold,
      color: textDark,
    });

    page.drawText('Data: 08/11/2026   ·   CÉDULA OFICIAL DE VOTAÇÃO', {
      x: headerTextX,
      y: curY - 30,
      size: 7.5,
      font: fontRegular,
      color: textMuted,
    });

    curY -= 48;

    // Instruction Box
    page.drawRectangle({
      x: innerX,
      y: curY - 20,
      width: innerW,
      height: 22,
      color: lightBg,
      borderColor: borderColor,
      borderWidth: 0.8,
    });

    page.drawText('INSTRUÇÃO: Assinale com um X seus candidatos. Voto em branco: deixe sem assinalar.', {
      x: innerX + 8,
      y: curY - 14,
      size: 7.2,
      font: fontBold,
      color: primaryDark,
    });

    curY -= 32;

    // Split candidates in 2 columns: Diaconato (left) & Presbiterato (right)
    const colGap = 16;
    const colW = (innerW - colGap) / 2;

    // --- Coluna 1: Diaconato ---
    const col1X = innerX;
    let col1Y = curY;

    // Header Diaconato
    page.drawRectangle({
      x: col1X,
      y: col1Y - 18,
      width: colW,
      height: 18,
      color: primaryGreen,
    });

    page.drawText(`DIACONATO (Vote em até ${vagasDiac})`, {
      x: col1X + 6,
      y: col1Y - 13,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col1Y -= 26;

    diacList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col1X + 4,
        y: col1Y - 15,
        width: 15,
        height: 15,
        borderWidth: 1.5,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name
      const candName = c.name.length > 25 ? c.name.substring(0, 24) + '...' : c.name;
      page.drawText(candName, {
        x: col1X + 25,
        y: col1Y - 12,
        size: 9.5,
        font: fontBold,
        color: textDark,
      });

      col1Y -= 24;
    });

    // --- Coluna 2: Presbiterato ---
    const col2X = innerX + colW + colGap;
    let col2Y = curY;

    // Header Presbiterato
    page.drawRectangle({
      x: col2X,
      y: col2Y - 18,
      width: colW,
      height: 18,
      color: primaryDark,
    });

    page.drawText(`PRESBITERATO (Vote em até ${vagasPresb})`, {
      x: col2X + 6,
      y: col2Y - 13,
      size: 8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col2Y -= 26;

    presbList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col2X + 4,
        y: col2Y - 15,
        width: 15,
        height: 15,
        borderWidth: 1.5,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name
      const candName = c.name.length > 25 ? c.name.substring(0, 24) + '...' : c.name;
      page.drawText(candName, {
        x: col2X + 25,
        y: col2Y - 12,
        size: 9.5,
        font: fontBold,
        color: textDark,
      });

      col2Y -= 24;
    });

    // Bottom Validation Block (Rubrica da Mesa)
    const bottomY = originY + 20;

    page.drawLine({
      start: { x: innerX, y: bottomY + 36 },
      end: { x: innerX + innerW, y: bottomY + 36 },
      color: borderColor,
      thickness: 1,
    });

    page.drawText('Rubrica da Mesa Eleitoral / Escrutinadora:', {
      x: innerX,
      y: bottomY + 22,
      size: 7.5,
      font: fontBold,
      color: textMuted,
    });

    page.drawLine({
      start: { x: innerX + 175, y: bottomY + 22 },
      end: { x: innerX + innerW - 60, y: bottomY + 22 },
      color: textDark,
      thickness: 1,
    });

    page.drawText('Voto Secreto', {
      x: innerX + innerW - 52,
      y: bottomY + 22,
      size: 7,
      font: fontOblique,
      color: primaryGreen,
    });

    page.drawText('Cédula válida exclusivamente com a rubrica oficial de ao menos um membro da Mesa Escrutinadora.', {
      x: innerX,
      y: bottomY + 8,
      size: 6.5,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.47),
    });
  }

  // Draw Left Ballot
  drawBallot(0, 0, halfW, height);

  // Draw Right Ballot
  drawBallot(halfW, 0, halfW, height);

  // Center Cut Guide Line (Dashed)
  const cutX = halfW;
  const dashLength = 8;
  const gapLength = 6;
  let lineY = 15;

  while (lineY < height - 15) {
    page.drawLine({
      start: { x: cutX, y: lineY },
      end: { x: cutX, y: Math.min(lineY + dashLength, height - 15) },
      color: rgb(0.5, 0.55, 0.52),
      thickness: 1,
    });
    lineY += dashLength + gapLength;
  }

  // Draw Scissor Cut Marks (vector graphics)
  function drawScissors(x, y) {
    page.drawCircle({ x: x - 4, y: y, size: 2.5, borderWidth: 1, borderColor: rgb(0.3, 0.35, 0.32) });
    page.drawCircle({ x: x + 4, y: y, size: 2.5, borderWidth: 1, borderColor: rgb(0.3, 0.35, 0.32) });
    page.drawLine({ start: { x: x - 3, y: y }, end: { x: x + 5, y: y + 8 }, thickness: 1, color: rgb(0.3, 0.35, 0.32) });
    page.drawLine({ start: { x: x + 3, y: y }, end: { x: x - 5, y: y + 8 }, thickness: 1, color: rgb(0.3, 0.35, 0.32) });
  }

  drawScissors(cutX, height - 25);

  page.drawText('LINHA DE CORTE (RECORTE AQUI)', {
    x: cutX - 52,
    y: height / 2 + 10,
    size: 6.5,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.42),
  });

  drawScissors(cutX, 20);

  // 3. Save PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.join(process.cwd(), 'public/cedula-eleicao-ipst-2026.pdf');
  await fs.writeFile(outputPath, pdfBytes);
  console.log(`✓ PDF successfully generated at: ${outputPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

generate().catch((err) => {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
});
