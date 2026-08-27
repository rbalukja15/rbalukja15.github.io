// Renders scripts/og-template.html to public/images/og.png (1200x630).
// Requires @playwright/test installed and `npx playwright install chromium`.
// Run: node scripts/generate-og.mjs
//
// NOTE: The kicker and headline baked into scripts/og-template.html are copied by hand
// from src/components/Hero.astro ("Multi-tenant B2B SaaS · Access control" / "I build
// multi-tenant systems and prove they hold."). There is no build-time link between the
// two, so whenever the hero copy changes, update og-template.html to match, re-run this
// script, AND update the meta description in src/pages/index.astro — otherwise the
// LinkedIn/Slack/Twitter/iMessage card keeps showing copy the site no longer says.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const htmlPath = path.resolve('scripts/og-template.html');
const outPath = path.resolve('public/images/og.png');
mkdirSync(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(htmlPath).href);

  // Fraunces is loaded from a local woff2 via an absolute file:// URL in the template's
  // @font-face rule, with Georgia as the fallback. If that font-face silently fails to
  // load (bad path, bad format, etc.) the browser falls back to Georgia and the card
  // stops matching the site without any visible error. Prove it actually loaded by
  // checking the FontFace API AND comparing rendered text width against an explicit
  // Georgia rendering of the same string — Fraunces 600 and Georgia measure differently,
  // so identical widths mean the fallback silently kicked in.
  await page.evaluate(() => document.fonts.ready);
  const fontProof = await page.evaluate(() => {
    const checked = document.fonts.check("600 82px 'Fraunces'");
    const measure = (family) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `600 82px ${family}`;
      return ctx.measureText('Romarjo Balukja').width;
    };
    const frauncesWidth = measure("'Fraunces', Georgia, 'Times New Roman', serif");
    const georgiaWidth = measure("Georgia, 'Times New Roman', serif");
    return { checked, frauncesWidth, georgiaWidth, differs: frauncesWidth !== georgiaWidth };
  });
  console.log(
    `Fraunces load check: document.fonts.check=${fontProof.checked}, ` +
      `renderedWidth(Fraunces)=${fontProof.frauncesWidth.toFixed(2)}px, ` +
      `renderedWidth(Georgia)=${fontProof.georgiaWidth.toFixed(2)}px`
  );
  if (!fontProof.checked || !fontProof.differs) {
    throw new Error(
      'Fraunces did not load (silently fell back to Georgia) — fix the @font-face src ' +
        'in scripts/og-template.html before regenerating og.png.'
    );
  }

  await page.screenshot({ path: outPath });
} finally {
  await browser.close();
}
console.log(`Wrote ${outPath}`);
