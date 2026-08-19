import { test, expect } from '@playwright/test';

/** WCAG 2.1 relative luminance for a #rrggbb string. */
function luminance(hex: string): number {
  const value = hex.trim().replace('#', '');
  // Fail closed: a gate that cannot parse a colour must break loudly, never pass silently.
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`expected a 6-digit hex colour, got "${hex}"`);
  }
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = (value.match(/.{2}/g) as string[]).map((h) => parseInt(h, 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('token palette meets WCAG AA for body text', async ({ page }) => {
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    const get = (name: string) => s.getPropertyValue(name).trim();
    return {
      bg: get('--bg'),
      surface: get('--surface'),
      surfaceAlt: get('--surface-alt'),
      ink: get('--ink'),
      inkSoft: get('--ink-soft'),
      inkFaint: get('--ink-faint'),
      accent: get('--accent'),
      statusLive: get('--status-live'),
      statusOss: get('--status-oss'),
      statusNpm: get('--status-npm'),
    };
  });

  for (const [name, value] of Object.entries(tokens)) {
    expect(value, `token ${name} is missing from :root`).not.toBe('');
  }

  // Every pair that carries real text. 4.5:1 is the AA minimum for body copy.
  const pairs: Array<[string, string, string]> = [
    ['--ink on --bg', tokens.ink, tokens.bg],
    ['--ink on --surface', tokens.ink, tokens.surface],
    ['--ink on --surface-alt', tokens.ink, tokens.surfaceAlt],
    ['--ink-soft on --bg', tokens.inkSoft, tokens.bg],
    ['--ink-soft on --surface', tokens.inkSoft, tokens.surface],
    ['--ink-soft on --surface-alt', tokens.inkSoft, tokens.surfaceAlt],
    ['--ink-faint on --bg', tokens.inkFaint, tokens.bg],
    ['--ink-faint on --surface', tokens.inkFaint, tokens.surface],
    ['--ink-faint on --surface-alt', tokens.inkFaint, tokens.surfaceAlt],
    ['--accent on --bg', tokens.accent, tokens.bg],
    ['--accent on --surface', tokens.accent, tokens.surface],
    ['--accent on --surface-alt', tokens.accent, tokens.surfaceAlt],
    ['--status-live on --surface', tokens.statusLive, tokens.surface],
    ['--status-oss on --surface', tokens.statusOss, tokens.surface],
    ['--status-npm on --surface', tokens.statusNpm, tokens.surface],
  ];

  const failures = pairs
    .map(([name, fg, bgc]) => ({ name, ratio: contrast(fg, bgc) }))
    .filter((r) => r.ratio < 4.5)
    .map((r) => `${r.name} = ${r.ratio.toFixed(2)}`);

  expect(failures, `below 4.5:1 — ${failures.join(', ')}`).toEqual([]);
});

test('the site ships a dark theme', async ({ page }) => {
  const bg = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  );
  // Not pinned to an exact hex: the guarantee is "dark", so aesthetic tweaks stay free.
  // The light theme this replaced was #faf9f6, luminance ~0.95.
  expect(luminance(bg), `--bg is ${bg}, which is not dark`).toBeLessThan(0.05);
});
