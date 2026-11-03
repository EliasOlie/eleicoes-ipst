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
  const cutLineColor = rgb(0.60, 0.65, 0.62); // Discrete dashed cut lines

  // Grid: 4 columns x 3 rows = 12 ballots per A4 Landscape sheet
  const COLS = 4;
  const ROWS = 3;
  const cellW = width / COLS; // 210.47 pt (~74.2 mm)
  const cellH = height / ROWS; // 198.42 pt (~70.0 mm)

  function drawSingleBallot(originX: number, originY: number, bWidth: number, bHeight: number) {
    const margin = 4;
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
      borderWidth: 0.8,
      color: rgb(1, 1, 1),
    });

    // Top decorative green bar
    page.drawRectangle({
      x: boxX,
      y: boxY + boxH - 3,
      width: boxW,
      height: 3,
      color: primaryDark,
    });

    let curY = boxY + boxH - 7;
    const padX = boxX + 6;
    const innerW = boxW - 12;

    // Header with Logo
    if (logoImage) {
      page.drawImage(logoImage, {
        x: padX,
        y: curY - 18,
        width: 18,
        height: 18,
      });
    }

    const headerX = logoImage ? padX + 22 : padX;

    page.drawText('IP SERRA TALHADA', {
      x: headerX,
      y: curY - 4,
      size: 7.2,
      font: fontBold,
      color: primaryGreen,
    });

    page.drawText('Eleição de Oficiais · 08/11/2026', {
      x: headerX,
      y: curY - 12,
      size: 6.2,
      font: fontBold,
      color: textDark,
    });

    page.drawText('Cédula Oficial de Votação', {
      x: headerX,
      y: curY - 19,
      size: 5.2,
      font: fontRegular,
      color: textMuted,
    });

    curY -= 23;

    // Instruction Banner
    page.drawRectangle({
      x: padX,
      y: curY - 9,
      width: innerW,
      height: 9.5,
      color: rgb(0.96, 0.97, 0.96),
      borderColor: borderColor,
      borderWidth: 0.4,
    });

    page.drawText('Marque [X] seus candidatos. Em branco: não assinale.', {
      x: padX + 3,
      y: curY - 6.5,
      size: 4.8,
      font: fontBold,
      color: primaryDark,
    });

    curY -= 13;

    // Two Columns for Candidates inside Ballot
    const colGap = 6;
    const colW = (innerW - colGap) / 2;

    // --- Coluna 1: Diaconato ---
    const col1X = padX;
    let col1Y = curY;

    // Header Diaconato
    page.drawRectangle({
      x: col1X,
      y: col1Y - 10,
      width: colW,
      height: 10,
      color: primaryGreen,
    });

    page.drawText(`DIÁCONO (Até ${vagasDiac})`, {
      x: col1X + 3,
      y: col1Y - 7.5,
      size: 5.2,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col1Y -= 13;

    diacList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col1X + 1,
        y: col1Y - 7,
        width: 7.5,
        height: 7.5,
        borderWidth: 1,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name
      const maxLen = 17;
      const candName = c.name.length > maxLen ? c.name.substring(0, maxLen - 1) + '…' : c.name;

      page.drawText(candName, {
        x: col1X + 11,
        y: col1Y - 5.5,
        size: 5.5,
        font: fontBold,
        color: textDark,
      });

      col1Y -= 11.5;
    });

    // --- Coluna 2: Presbiterato ---
    const col2X = padX + colW + colGap;
    let col2Y = curY;

    // Header Presbiterato
    page.drawRectangle({
      x: col2X,
      y: col2Y - 10,
      width: colW,
      height: 10,
      color: primaryDark,
    });

    page.drawText(`PRESBÍTERO (Até ${vagasPresb})`, {
      x: col2X + 3,
      y: col2Y - 7.5,
      size: 5.2,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    col2Y -= 13;

    presbList.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: col2X + 1,
        y: col2Y - 7,
        width: 7.5,
        height: 7.5,
        borderWidth: 1,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // Name
      const maxLen = 17;
      const candName = c.name.length > maxLen ? c.name.substring(0, maxLen - 1) + '…' : c.name;

      page.drawText(candName, {
        x: col2X + 11,
        y: col2Y - 5.5,
        size: 5.5,
        font: fontBold,
        color: textDark,
      });

      col2Y -= 11.5;
    });

    // Sub-footer
    page.drawLine({
      start: { x: padX, y: boxY + 9 },
      end: { x: padX + innerW, y: boxY + 9 },
      color: borderColor,
      thickness: 0.5,
    });

    page.drawText('Cédula Oficial Presencial · Votação Secreta (CI/IPB)', {
      x: padX + 2,
      y: boxY + 3.5,
      size: 4.5,
      font: fontRegular,
      color: textMuted,
    });
  }

  // Draw 12 ballots (4 columns x 3 rows)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const oX = c * cellW;
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
        thickness: 0.6,
      });
      y += dashLength + gapLength;
    }
  }

  // 2 Horizontal cutting lines (at r = 1, 2)
  for (let r = 1; r < ROWS; r++) {
    const cutY = r * cellH;
    let x = 0;
    while (x < width) {
      page.drawLine({
        start: { x, y: cutY },
        end: { x: Math.min(x + dashLength, width), y: cutY },
        color: cutLineColor,
        thickness: 0.6,
      });
      x += dashLength + gapLength;
    }
  }

  return await pdfDoc.save();
}
