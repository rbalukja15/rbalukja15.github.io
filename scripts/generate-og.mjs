// Renders scripts/og-template.html to public/images/og.png (1200x630).
// Requires @playwright/test installed and `npx playwright install chromium`.
// Run: node scripts/generate-og.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('scripts/og-template.html');
const outPath = path.resolve('public/images/og.png');
mkdirSync(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(htmlPath).href);
await page.screenshot({ path: outPath });
await browser.close();
console.log(`Wrote ${outPath}`);
