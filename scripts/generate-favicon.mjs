#!/usr/bin/env node
/**
 * Gera favicon e ícones do PWA a partir da logo da igreja (public/assets/ipst_logo.jpg).
 *  - Tamanhos pequenos (16/32/48/64): só o desenho do templo, recortado — o texto
 *    "Igreja Presbiteriana de Serra Talhada" fica ilegível nesse tamanho.
 *  - Tamanhos grandes (180/192/512): logo completa.
 * Uso: node scripts/generate-favicon.mjs
 */
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'public/assets/ipst_logo.jpg');
const GREEN = '#0A5C36';

const meta = await sharp(src).metadata();
const W = meta.width;
const H = meta.height;

// Recorte do templo + montanha (proporções medidas na logo oficial)
const crop = {
  left: Math.round(W * 0.22),
  top: Math.round(H * 0.14),
  width: Math.round(W * 0.56),
  height: Math.round(H * 0.415),
};

async function smallIcon(size) {
  // Templo em branco sobre o verde da igreja, cantos arredondados
  const mark = await sharp(src)
    .extract(crop)
    .resize(Math.round(size * 0.78), Math.round(size * 0.78), { fit: 'contain', background: '#ffffff' })
    .greyscale()
    .threshold(170) // verde → preto, fundo → branco
    .negate() // templo branco, fundo preto
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Usa o desenho como máscara alfa sobre branco
  const markRgba = await sharp({
    create: { width: mark.info.width, height: mark.info.height, channels: 3, background: '#ffffff' },
  })
    .joinChannel(mark.data, { raw: { width: mark.info.width, height: mark.info.height, channels: 1 } })
    .png()
    .toBuffer();

  const r = Math.round(size * 0.22);
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${GREEN}"/></svg>`
  );
  return sharp(bg)
    .composite([{ input: markRgba, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function fullIcon(size) {
  return sharp(src).resize(size, size, { fit: 'cover' }).png().toBuffer();
}

// ICO com PNGs embutidos (suportado por todos os navegadores atuais)
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

const ico = [];
for (const s of [16, 32, 48]) ico.push({ size: s, buf: await smallIcon(s) });

await fs.writeFile(path.join(root, 'app/favicon.ico'), buildIco(ico));
await fs.writeFile(path.join(root, 'public/favicon.png'), await smallIcon(64));
await fs.writeFile(path.join(root, 'app/icon.png'), await smallIcon(192));
await fs.writeFile(path.join(root, 'public/apple-touch-icon.png'), await fullIcon(180));
await fs.writeFile(path.join(root, 'public/icon-192.png'), await fullIcon(192));
await fs.writeFile(path.join(root, 'public/icon-512.png'), await fullIcon(512));

console.log(`✓ Favicons gerados a partir de ${path.relative(root, src)} (${W}x${H})`);
