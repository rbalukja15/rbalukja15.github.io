// Renders public/favicon.svg to a single 32x32 PNG and wraps it in a minimal
// PNG-encoded .ico (one entry). Modern browsers use favicon.svg; the .ico is a
// small fallback for older browsers and bare /favicon.ico requests.
//
// Why not png-to-ico: it always upscales to 256x256 and packs four *uncompressed*
// 32bpp BMP entries, producing a ~285 KB file. A single PNG-encoded 32x32 entry
// is ~1 KB and is valid ICO (supported since IE11).
//
// Depends only on @playwright/test (already a devDependency): a real browser
// renders the "RB" text with the correct font and rasterizes the SVG natively
// at the final 32x32 size — no separate image library needed.
//
// Run: node scripts/generate-favicon.mjs
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const SIZE = 32;
const svg = readFileSync(path.resolve('public/favicon.svg'), 'utf8')
  // The source SVG is authored at 64x64; scale it to the icon size. Its viewBox
  // makes the scale exact, so the browser rasterizes crisply at 32x32.
  .replace(/width="\d+"/, `width="${SIZE}"`)
  .replace(/height="\d+"/, `height="${SIZE}"`);

const browser = await chromium.launch();
let png;
try {
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0}</style>${svg}`
  );
  png = await page.locator('svg').screenshot({ omitBackground: true });
} finally {
  await browser.close();
}

// Minimal ICO container: 6-byte ICONDIR + one 16-byte ICONDIRENTRY + PNG payload.
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(1, 4); // number of images

const entry = Buffer.alloc(16);
entry.writeUInt8(SIZE, 0); // width
entry.writeUInt8(SIZE, 1); // height
entry.writeUInt8(0, 2); // color palette count (0 = no palette)
entry.writeUInt8(0, 3); // reserved
entry.writeUInt16LE(1, 4); // color planes
entry.writeUInt16LE(32, 6); // bits per pixel
entry.writeUInt32LE(png.length, 8); // size of PNG data
entry.writeUInt32LE(header.length + 16, 12); // offset to PNG data

writeFileSync(path.resolve('public/favicon.ico'), Buffer.concat([header, entry, png]));
console.log(`Wrote public/favicon.ico (${header.length + 16 + png.length} bytes)`);
