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

  // Grid: 4 columns x 4 rows = 16 ballots per A4 Landscape sheet
  const COLS = 4;
  const ROWS = 4;
  const PAGE_W = 841.89;
  const PAGE_H = 595.28;
  const cellW = PAGE_W / COLS; // 210.47 pt (~74.2 mm)
  const cellH = PAGE_H / ROWS; // 148.82 pt (~52.5 mm)

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
    const cands = isPresb ? presbList : diacList;
    // Limite impresso = menor entre vagas e candidatos (6 vagas e 5 nomes → "até 5")
    const roleLimit = Math.min(isPresb ? vagasPresb : vagasDiac, cands.length);

    const margin = 3.5;
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
      y: boxY + boxH - 2.5,
      width: boxW,
      height: 2.5,
      color: accentColor,
    });

    let curY = boxY + boxH - 5;
    const padX = boxX + 6;
    const innerW = boxW - 12;

    // Header with Logo
    if (logoImage) {
      page.drawImage(logoImage, {
        x: padX,
        y: curY - 14,
        width: 14,
        height: 14,
      });
    }

    const headerX = logoImage ? padX + 18 : padX;

    page.drawText('IP SERRA TALHADA', {
      x: headerX,
      y: curY - 3,
      size: 6.5,
      font: fontBold,
      color: accentColor,
    });

    page.drawText('Eleição de Oficiais · 08/11/2026', {
      x: headerX,
      y: curY - 9.5,
      size: 5.5,
      font: fontBold,
      color: textDark,
    });

    page.drawText('Cédula Oficial Presencial', {
      x: headerX,
      y: curY - 15,
      size: 4.5,
      font: fontRegular,
      color: textMuted,
    });

    curY -= 18;

    // Role Banner
    page.drawRectangle({
      x: padX,
      y: curY - 10,
      width: innerW,
      height: 10,
      color: accentColor,
    });

    const bannerText = `CÉDULA DE ${roleTitle} (VOTE EM ATÉ ${roleLimit})`;
    page.drawText(bannerText, {
      x: padX + 4,
      y: curY - 7.5,
      size: 5.8,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    curY -= 12.5;

    // Instruction Banner
    page.drawRectangle({
      x: padX,
      y: curY - 7.5,
      width: innerW,
      height: 7.5,
      color: rgb(0.96, 0.97, 0.96),
      borderColor: borderColor,
      borderWidth: 0.4,
    });

    page.drawText('Marque [X] no quadrado. Voto em branco: deixe vazio.', {
      x: padX + 3,
      y: curY - 5.5,
      size: 4.5,
      font: fontBold,
      color: accentColor,
    });

    curY -= 10;

    // Candidates list (vertical list, full width, 1st names only!)
    const rowHeight = 13.5;
    cands.forEach((c) => {
      // Checkbox
      page.drawRectangle({
        x: padX + 3,
        y: curY - 9,
        width: 8.5,
        height: 8.5,
        borderWidth: 1.0,
        borderColor: textDark,
        color: rgb(1, 1, 1),
      });

      // 1st Name
      page.drawText(c.displayName, {
        x: padX + 16,
        y: curY - 7.5,
        size: 8.0,
        font: fontBold,
        color: textDark,
      });

      curY -= rowHeight;
    });

    // Sub-footer
    page.drawLine({
      start: { x: padX, y: boxY + 8.5 },
      end: { x: padX + innerW, y: boxY + 8.5 },
      color: borderColor,
      thickness: 0.5,
    });

    page.drawText('Votação Secreta · Assembleia IPST (CI/IPB)', {
      x: padX + 2,
      y: boxY + 3,
      size: 4.2,
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

    // 3 Horizontal cutting lines (at r = 1, 2, 3)
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
        // Cols 0, 1 = Presbítero (8 cédulas); Cols 2, 3 = Diácono (8 cédulas)
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
    // Default 'all': Page 1 = Presbítero (16 cédulas), Page 2 = Diácono (16 cédulas)
    renderPageWithRole('presb');
    renderPageWithRole('diac');
  }

  return await pdfDoc.save();
}
