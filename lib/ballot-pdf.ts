import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
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
  mode?: 'all' | 'presb' | 'diac' | 'mixed';
}

export async function generateBallotPdfBuffer(options: BallotPdfOptions): Promise<Uint8Array> {
  const { candidates, vagasDiac, vagasPresb, mode = 'all' } = options;

  // First names only
  const getFirstName = (fullName: string) => fullName.trim().split(' ')[0] || fullName;

  const diacList = candidates
    .filter((c) => c.role === 'diac')
    .map((c) => ({ ...c, displayName: getFirstName(c.name) }));

  const presbList = candidates
    .filter((c) => c.role === 'presb')
    .map((c) => ({ ...c, displayName: getFirstName(c.name) }));

  // Create A4 Landscape PDF (841.89 x 595.28 pt)
  const pdfDoc = await PDFDocument.create();

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

  const primaryDark = rgb(0.027, 0.239, 0.141); // #073D24 (Presbíteros)
  const primaryGreen = rgb(0.039, 0.361, 0.212); // #0A5C36 (Diáconos)
  const textDark = rgb(0.082, 0.125, 0.102); // #15201A
  const textMuted = rgb(0.29, 0.34, 0.31); // #4A574F
  const borderColor = rgb(0.78, 0.82, 0.79); // #C7D1C9
  const cutLineColor = rgb(0.60, 0.65, 0.62); // Discrete dashed cut lines

  // Grid: 4 columns x 3 rows = 12 ballots per A4 Landscape sheet
  const COLS = 4;
  const ROWS = 3;
  const PAGE_W = 841.89;
  const PAGE_H = 595.28;
  const cellW = PAGE_W / COLS; // 210.47 pt (~74.2 mm)
  const cellH = PAGE_H / ROWS; // 198.42 pt (~70.0 mm)

  function drawSingleBallot(
    page: PDFPage,
    originX: number,
    originY: number,
    bWidth: number,
    bHeight: number,
    role: 'presb' | 'diac'
  ) {
    const isPresb = role === 'presb';
    const accentColor = isPresb ? primaryDark : primaryGreen;
    const roleTitle = isPresb ? 'PRESBÍTERO' : 'DIÁCONO';
    const roleLimit = isPresb ? vagasPresb : vagasDiac;
    const cands = isPresb ? presbList : diacList;

    const margin = 4.5;
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

    // Top decorative accent bar
    page.drawRectangle({
      x: boxX,
      y: boxY + boxH - 3.5,
      width: boxW,
      height: 3.5,
      color: accentColor,
    });

    let curY = boxY + boxH - 7;
    const padX = boxX + 6.5;
    const innerW = boxW - 13;

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
      color: accentColor,
    });

    page.drawText('Eleição de Oficiais · 08/11/2026', {
      x: headerX,
      y: curY - 12,
      size: 6.2,
      font: fontBold,
      color: textDark,
    });

    page.drawText('Cédula Oficial de Votação Presencial', {
      x: headerX,
      y: curY - 19,
      size: 5.2,
      font: fontRegular,
      color: textMuted,
    });

    curY -= 24;

    // Role Banner
    page.drawRectangle({
      x: padX,
      y: curY - 12,
      width: innerW,
      height: 12,
      color: accentColor,
    });

    const bannerText = `CÉDULA DE ${roleTitle} (VOTE EM ATÉ ${roleLimit})`;
    page.drawText(bannerText, {
      x: padX + 5,
      y: curY - 9,
      size: 6.2,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    curY -= 15;

    // Instruction Banner
    page.drawRectangle({
      x: padX,
      y: curY - 9.5,
      width: innerW,
      height: 9.5,
      color: rgb(0.96, 0.97, 0.96),
      borderColor: borderColor,
      borderWidth: 0.4,
    });

    page.drawText('Marque [X] no quadrado. Voto em branco: deixe vazio.', {
      x: padX + 4,
      y: curY - 7,
      size: 5,
      font: fontBold,
      color: accentColor,
    });

    curY -= 16;

    // Candidates list (vertical list, full width, 1st names only!)
    const rowHeight = 15;
    cands.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: padX + 4,
        y: curY - 10,
        width: 10,
        height: 10,
        borderWidth: 1.2,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // 1st Name
      page.drawText(c.displayName, {
        x: padX + 19,
        y: curY - 8,
        size: 8.5,
        font: fontBold,
        color: textDark,
      });

      curY -= rowHeight;
    });

    // Sub-footer
    page.drawLine({
      start: { x: padX, y: boxY + 10 },
      end: { x: padX + innerW, y: boxY + 10 },
      color: borderColor,
      thickness: 0.5,
    });

    page.drawText('Votação Secreta · Assembleia IPST (CI/IPB)', {
      x: padX + 3,
      y: boxY + 4,
      size: 4.8,
      font: fontRegular,
      color: textMuted,
    });
  }

  function drawCutLines(page: PDFPage) {
    const dashLength = 4;
    const gapLength = 4;

    // 3 Vertical cutting lines (at c = 1, 2, 3)
    for (let c = 1; c < COLS; c++) {
      const cutX = c * cellW;
      let y = 0;
      while (y < PAGE_H) {
        page.drawLine({
          start: { x: cutX, y },
          end: { x: cutX, y: Math.min(y + dashLength, PAGE_H) },
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
      while (x < PAGE_W) {
        page.drawLine({
          start: { x, y: cutY },
          end: { x: Math.min(x + dashLength, PAGE_W), y: cutY },
          color: cutLineColor,
          thickness: 0.6,
        });
        x += dashLength + gapLength;
      }
    }
  }

  function renderPageWithRole(role: 'presb' | 'diac') {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const oX = c * cellW;
        const oY = (ROWS - 1 - r) * cellH;
        drawSingleBallot(page, oX, oY, cellW, cellH, role);
      }
    }
    drawCutLines(page);
  }

  function renderMixedPage() {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const oX = c * cellW;
        const oY = (ROWS - 1 - r) * cellH;
        // Cols 0, 1 = Presbítero; Cols 2, 3 = Diácono
        const role = c < 2 ? 'presb' : 'diac';
        drawSingleBallot(page, oX, oY, cellW, cellH, role);
      }
    }
    drawCutLines(page);
  }

  if (mode === 'presb') {
    renderPageWithRole('presb');
  } else if (mode === 'diac') {
    renderPageWithRole('diac');
  } else if (mode === 'mixed') {
    renderMixedPage();
  } else {
    // Default 'all': Page 1 = Presbítero, Page 2 = Diácono
    renderPageWithRole('presb');
    renderPageWithRole('diac');
  }

  return await pdfDoc.save();
}
