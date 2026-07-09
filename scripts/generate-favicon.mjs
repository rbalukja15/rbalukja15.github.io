// Renders public/favicon.svg to a 64x64 PNG, converts to public/favicon.ico.
// Run: node scripts/generate-favicon.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import pngToIco from 'png-to-ico';

const svgPath = path.resolve('public/favicon.svg');
const tmpPng = path.resolve('scripts/.favicon-64.png');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
await page.goto(pathToFileURL(svgPath).href);
await page.screenshot({ path: tmpPng });
await browser.close();

writeFileSync(path.resolve('public/favicon.ico'), await pngToIco(tmpPng));
rmSync(tmpPng);
console.log('Wrote public/favicon.ico');
