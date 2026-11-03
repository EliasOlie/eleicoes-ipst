import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export interface BallotCandidate {
  id: string;
  role: string;
  name: string;
}

export interface BallotPdfOptions {
  candidates: BallotCandidate[];
  vagasDiac: number;
  vagasPresb: number;
  mode?: string;
}

export async function generateBallotPdfBuffer(options: BallotPdfOptions): Promise<Uint8Array> {
  const { candidates, vagasDiac, vagasPresb } = options;

  const diacList = candidates.filter((c) => c.role === 'diac');
  const presbList = candidates.filter((c) => c.role === 'presb');

  // Create A4 Landscape PDF (841.89 x 595.28 pt)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed logo
  let logoImage: any = null;
  try {
    const logoPath = path.join(process.cwd(), 'public/assets/ipst_logo.jpg');
    const logoBytes = await fs.readFile(logoPath);
    logoImage = await pdfDoc.embedJpg(logoBytes);
  } catch (e: any) {
    console.warn('Logo image not found or failed to embed:', e.message);
  }

  const primaryDark = rgb(0.027, 0.239, 0.141); // #073D24
  const primaryGreen = rgb(0.039, 0.361, 0.212); // #0A5C36
  const textDark = rgb(0.082, 0.125, 0.102); // #15201A
  const textMuted = rgb(0.29, 0.34, 0.31); // #4A574F
  const borderColor = rgb(0.78, 0.82, 0.79); // #C7D1C9
  const cutLineColor = rgb(0.55, 0.60, 0.57); // Discrete cut line

  // Grid: 4 columns x 2 rows = 8 ballots per sheet
  const COLS = 4;
  const ROWS = 2;
  const cellW = width / COLS; // 210.47 pt (~74.2 mm)
  const cellH = height / ROWS; // 297.64 pt (~105 mm)

  function drawSingleBallot(originX: number, originY: number, bWidth: number, bHeight: number) {
    const margin = 5;
    const boxX = originX + margin;
    const boxY = originY + margin;
    const boxW = bWidth - margin * 2;
    const boxH = bHeight - margin * 2;

    // Card border
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxW,
      height: boxH,
      borderColor: borderColor,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    // Top decorative bar
    page.drawRectangle({
      x: boxX,
      y: boxY + boxH - 4,
      width: boxW,
      height: 4,
      color: primaryDark,
    });

    let curY = boxY + boxH - 12;
    const padX = boxX + 8;
    const innerW = boxW - 16;

    // Header with Logo
    if (logoImage) {
      page.drawImage(logoImage, {
        x: padX,
        y: curY - 22,
        width: 22,
        height: 22,
      });
    }

    const headerX = logoImage ? padX + 27 : padX;

    page.drawText('IP SERRA TALHADA', {
      x: headerX,
      y: curY - 4,
      size: 7.5,
      font: fontBold,
      color: primaryGreen,
    });

    page.drawText('Eleição de Oficiais · 08/11/2026', {
      x: headerX,
      y: curY - 13,
      size: 6.5,
      font: fontBold,
      color: textDark,
    });

    page.drawText('Cédula Oficial de Votação', {
      x: headerX,
      y: curY - 21,
      size: 5.5,
      font: fontRegular,
      color: textMuted,
    });

    curY -= 28;

    // Instruction Banner
    page.drawRectangle({
      x: padX,
      y: curY - 11,
      width: innerW,
      height: 12,
      color: rgb(0.96, 0.97, 0.96),
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    page.drawText('Assinale [X] seus candidatos. Em branco: não assinale.', {
      x: padX + 4,
      y: curY - 7.5,
      size: 5.2,
      font: fontBold,
      color: primaryDark,
    });

    curY -= 17;

    // Two Columns for Candidates inside Ballot
    const colGap = 8;
    const colW = (innerW - colGap) / 2;

    // --- Coluna 1: Diaconato ---
    const col1X = padX;
    let col1Y = curY;

    // Header Diaconato
    page.drawRectangle({
      x: col1X,
      y: col1Y - 12,
      width: colW,
      height: 12,
      color: primaryGreen,
    });

    page.drawText(`DIACONATO (Até ${vagasDiac})`, {
      x: col1X + 4,
      y: col1Y - 8.5,
      size: 5.8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col1Y -= 17;

    diacList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col1X + 2,
        y: col1Y - 9,
        width: 9,
        height: 9,
        borderWidth: 1.2,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name (truncate if too long for column)
      const maxLen = 16;
      const candName = c.name.length > maxLen ? c.name.substring(0, maxLen - 1) + '…' : c.name;

      page.drawText(candName, {
        x: col1X + 15,
        y: col1Y - 7,
        size: 6.2,
        font: fontBold,
        color: textDark,
      });

      col1Y -= 15;
    });

    // --- Coluna 2: Presbiterato ---
    const col2X = padX + colW + colGap;
    let col2Y = curY;

    // Header Presbiterato
    page.drawRectangle({
      x: col2X,
      y: col2Y - 12,
      width: colW,
      height: 12,
      color: primaryDark,
    });

    page.drawText(`PRESBITERATO (Até ${vagasPresb})`, {
      x: col2X + 4,
      y: col2Y - 8.5,
      size: 5.8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col2Y -= 17;

    presbList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col2X + 2,
        y: col2Y - 9,
        width: 9,
        height: 9,
        borderWidth: 1.2,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name
      const maxLen = 16;
      const candName = c.name.length > maxLen ? c.name.substring(0, maxLen - 1) + '…' : c.name;

      page.drawText(candName, {
        x: col2X + 15,
        y: col2Y - 7,
        size: 6.2,
        font: fontBold,
        color: textDark,
      });

      col2Y -= 15;
    });

    // Sub-footer
    page.drawLine({
      start: { x: padX, y: boxY + 12 },
      end: { x: padX + innerW, y: boxY + 12 },
      color: borderColor,
      thickness: 0.6,
    });

    page.drawText('Cédula Oficial Presencial · Votação Secreta (CI/IPB)', {
      x: padX + 2,
      y: boxY + 4,
      size: 4.8,
      font: fontRegular,
      color: textMuted,
    });
  }

  // Draw 8 ballots (4 columns x 2 rows)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const oX = c * cellW;
      // In PDF coordinates, (0,0) is bottom-left
      // row 0 is top (originY = cellH), row 1 is bottom (originY = 0)
      const oY = (ROWS - 1 - r) * cellH;
      drawSingleBallot(oX, oY, cellW, cellH);
    }
  }

  // Draw Cutting Lines (Discrete dashed lines between cells)
  const dashLength = 4;
  const gapLength = 4;

  // 3 Vertical cutting lines (at c = 1, 2, 3)
  for (let c = 1; c < COLS; c++) {
    const cutX = c * cellW;
    let y = 0;
    while (y < height) {
      page.drawLine({
        start: { x: cutX, y },
        end: { x: cutX, y: Math.min(y + dashLength, height) },
        color: cutLineColor,
        thickness: 0.75,
      });
      y += dashLength + gapLength;
    }
  }

  // 1 Horizontal cutting line (at r = 1)
  const cutY = cellH;
  let x = 0;
  while (x < width) {
    page.drawLine({
      start: { x, y: cutY },
      end: { x: Math.min(x + dashLength, width), y: cutY },
      color: cutLineColor,
      thickness: 0.75,
    });
    x += dashLength + gapLength;
  }

  return await pdfDoc.save();
}
