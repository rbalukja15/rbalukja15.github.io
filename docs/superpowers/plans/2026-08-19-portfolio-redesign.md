# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the portfolio's light minimal-editorial visual layer with a committed dark editorial one, and correct the case-study content that has gone factually out of date.

**Architecture:** Astro 6 static site. This is a design-layer plus content change: no routing, schema, build, or deployment changes beyond one added content field (`status`). All styling lives in CSS custom properties in `src/styles/global.css` plus scoped `<style>` blocks in each `.astro` component. The existing Playwright suite is the safety net and must stay green.

**Tech Stack:** Astro 6.4.8, TypeScript, Playwright 1.61, `@fontsource` (Fraunces already present; Inter and JetBrains Mono added), sharp (already present, used by the screenshot pipeline).

---

## Environment

Every command in this plan assumes:

```bash
export PATH="/opt/homebrew/opt/node/bin:$PATH"   # machine default node is v18; Astro 6 needs >=22.12
cd ~/Desktop/rbalukja15.github.io
```

The Playwright config builds the site and serves it on **port 4399** (not 4321 — avoids a clash with `astro dev`). `npm test` handles this for you; do not start a server by hand.

## File structure

| File | Change | Responsibility |
| --- | --- | --- |
| `src/styles/global.css` | modify | Design tokens, base element styles, reveal + reduced-motion rules |
| `package.json` | modify | Add `@fontsource/inter`, `@fontsource/jetbrains-mono` |
| `src/layouts/BaseLayout.astro` | modify | Font imports + preload, meta/OG |
| `src/layouts/CaseStudyLayout.astro` | modify | Case-study prose styling for dark |
| `src/components/Nav.astro` | modify | Sticky header on dark |
| `src/components/Hero.astro` | modify | Two-column hero, new copy, above-fold image |
| `src/components/ProjectCard.astro` | modify | Status pill, dark card styling |
| `src/components/Skills.astro` | modify | Dark styling; keeps all six groups |
| `src/components/ExperienceTimeline.astro` | modify | Mono years; keeps all five roles |
| `src/components/Footer.astro` | modify | Restyled contact block (stays `<footer>`) |
| `src/pages/index.astro` | modify | Hero no longer reveal-gated |
| `src/pages/404.astro` | modify | Dark styling only |
| `src/content.config.ts` | modify | Add optional `status` field |
| `src/content/projects/tenantiq.md` | modify | Rewrite to M0–M4 reality |
| `src/content/projects/vetapp.md` | modify | Correct counts |
| `src/content/projects/react-ui-kit.md` | modify | Add `status` only |
| `scripts/generate-og.mjs` | modify | Dark OG template |
| `tests/contrast.spec.ts` | **create** | Permanent WCAG gate on the token palette |
| `tests/home.spec.ts` | modify | Hero copy assertions follow the new positioning |
| `tests/quality.spec.ts` | modify | Reveal assertions follow the un-gated hero |

## Gates — do not skip

Three items are unresolved on purpose. Each has a task; none may be silently guessed.

1. **The hero headline is a placeholder.** "Multi-tenant systems that don't leak." was written by Claude. Task 12 blocks launch on Romarjo rewriting it.
2. **The vetapp migration count is unverified.** The site says 52; the repo has 45 files. Task 10 removes the claim rather than publishing an unbacked number.
3. ~~**Employer naming is unconfirmed.**~~ **RESOLVED — no action needed.** Commit
   `15eb099` (2026-07-29, authored by Romarjo) deliberately replaced "Public-transport
   e-ticketing company" with the real names, reasoning that the anonymous form "read as
   unverifiable". That decision supersedes the 2026-07-05 spec §11 anonymity rule.
   **`src/data/experience.ts` is correct as it stands — do not edit it in any task.**

---

### Task 1: Contrast gate (test first)

Locks the palette before any of it is written. This test is the reason the plan caught
`--ink-faint` failing at 4.07 before implementation.

**Files:**
- Create: `tests/contrast.spec.ts`

- [ ] **Step 1: Write the failing test**

Two properties matter and they are different: the palette must clear WCAG AA, and the
theme must actually be dark. The parser fails **closed** — a gate that cannot read a
colour must break loudly, because `NaN < 4.5` is `false` and would otherwise let a bad
palette through silently.

```ts
// tests/contrast.spec.ts
import { test, expect } from '@playwright/test';

/** WCAG 2.1 relative luminance for a #rrggbb string. Throws on anything else. */
function luminance(hex: string): number {
  const value = hex.trim().replace('#', '');
  // Fail closed: an unparseable colour must break the gate, never skip a pair.
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

  // A renamed or deleted token must break the gate, not quietly drop a pair.
  for (const [name, value] of Object.entries(tokens)) {
    expect(value, `token ${name} is missing from :root`).not.toBe('');
  }

  // Every foreground against every background it actually sits on. --surface-alt is the
  // darkest of the three (Skills and the footer use it) and was the easiest to forget.
  const backgrounds: Array<[string, string]> = [
    ['--bg', tokens.bg],
    ['--surface', tokens.surface],
    ['--surface-alt', tokens.surfaceAlt],
  ];
  const foregrounds: Array<[string, string]> = [
    ['--ink', tokens.ink],
    ['--ink-soft', tokens.inkSoft],
    ['--ink-faint', tokens.inkFaint],
    ['--accent', tokens.accent],
  ];

  const pairs: Array<[string, string, string]> = [];
  for (const [fgName, fg] of foregrounds) {
    for (const [bgName, bg] of backgrounds) {
      pairs.push([`${fgName} on ${bgName}`, fg, bg]);
    }
  }
  // Status pills render as text on card surfaces — spec §8 calls these highest-risk.
  pairs.push(['--status-live on --surface', tokens.statusLive, tokens.surface]);
  pairs.push(['--status-oss on --surface', tokens.statusOss, tokens.surface]);
  pairs.push(['--status-npm on --surface', tokens.statusNpm, tokens.surface]);

  const failures = pairs
    .map(([name, fg, bg]) => ({ name, ratio: contrast(fg, bg) }))
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
```

All 15 pairs were pre-verified against the Task 2 palette. Thinnest margin is
`--ink-faint on --surface` at **4.68**. This gate is achievable, not aspirational.

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- tests/contrast.spec.ts`
Expected: FAIL. Both tests should be red — the palette test because `--status-*` do not
exist yet (Task 2 adds them), and the dark-theme test because `--bg` is still `#faf9f6`.
Confirm the failure names the missing tokens; a syntax error is not a valid red.

- [ ] **Step 3: Commit the failing gate**

```bash
git add tests/contrast.spec.ts
git commit -m "test(a11y): add a WCAG contrast gate over the token palette"
```

---

### Task 2: Dark tokens and fonts

**Files:**
- Modify: `src/styles/global.css:1-21` (the `:root` block)
- Modify: `package.json`
- Modify: `src/layouts/BaseLayout.astro:1-5`

- [ ] **Step 1: Install the two new typefaces**

```bash
npm install @fontsource/inter@^5 @fontsource/jetbrains-mono@^5
```

Expected: both added to `dependencies`; `package-lock.json` updated.

- [ ] **Step 2: Replace the `:root` block in `src/styles/global.css`**

Replace lines 1–21 (everything from `:root {` through the closing `}`) with:

```css
:root {
  --bg: #100f0d;
  --surface: #17140f;
  --surface-alt: #0d0c0a;
  --ink: #f4f1ea;
  --ink-soft: #a89e90;
  /* #7d7264 was the first choice and measured 4.07:1 on --bg — below AA.
     Do not darken this without re-running tests/contrast.spec.ts. */
  --ink-faint: #8a7f70;
  --accent: #d98a3d;
  --border: #221f1a;
  --border-strong: #2a251d;
  --chip-bg: #221d16;

  --status-live: #5cb87f;
  --status-oss: #d98a3d;
  --status-npm: #c98bdb;

  --font-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

  --radius: 8px;
  --shadow-hover: 0 18px 38px -14px rgb(0 0 0 / 0.75);
  --dur: 250ms;
  --container: 1040px;
  --container-prose: 760px;
}
```

`--container` grows from 760px to 1040px because the hero becomes two columns.
`--container-prose` keeps the old measure for case-study pages, whose header would
otherwise strand — a 147px `h1` inside a 1000px box reads as an unfinished layout.
Task 7 applies it; only define it here.

- [ ] **Step 3: Add the section-label utility to `src/styles/global.css`**

Append to the end of the file. Only this one class — a general `.mono` helper was tried
and removed as dead code, because every consumer below declares its own mono properties.

```css
/* One focus ring for the whole site. Components must not redefine this — per-component
   copies drifted, leaving project-card and case-study links with no focus style at all. */
a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* Section numbering used by home sections */
.section-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.7rem;
}
```

- [ ] **Step 4: Import the new fonts in `src/layouts/BaseLayout.astro`**

Replace lines 1–5 of the frontmatter with:

```astro
---
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import fraunces600 from '@fontsource/fraunces/files/fraunces-latin-600-normal.woff2?url';
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
```

Only Fraunces 600 stays preloaded. **Note the original reasoning here was wrong** and is
corrected by measurement: the LCP element is not the headline, it is `<p class="intro">`,
which renders in Inter 400. Preloading Inter 400 as well was tried and measured — it gains
FCP 1.2s → 1.1s but leaves LCP unchanged at 1.4s, so it is not worth a second competing
font fetch. Fonts are already discovered at ~68ms from the inlined CSS.

- [ ] **Step 5: Keep the stylesheet inlined**

Adding three `@font-face` blocks grows the `BaseLayout` CSS chunk to ~4.7KB. Astro's
default `build.inlineStylesheets: 'auto'` only inlines under **4096 bytes**, so the build
silently flips to an external `<link rel="stylesheet">` — a render-blocking round trip on
every page. Measured cost when this happened: **LCP 1052ms → 1503ms (+43%)**, FCP +50%,
while the Lighthouse Performance score still rounded to 100.

Add to `astro.config.mjs` inside `defineConfig({...})`:

```js
  // The stylesheet is ~4.7KB, just over Astro's 4KB auto-inline threshold. Letting it go
  // external costs a render-blocking round trip on every page (measured: LCP +43%).
  // Inlining always is the better trade for a 5-page static site.
  build: { inlineStylesheets: 'always' },
```

Verify:

```bash
npm run build
grep -c '<link rel="stylesheet"' dist/index.html || echo 0   # must be 0
ls dist/_astro/*.css 2>/dev/null | wc -l                     # must be 0
```

- [ ] **Step 6: Run the contrast gate**

Run: `npm test -- tests/contrast.spec.ts`
Expected: PASS — both tests. If any pair reports below 4.5, fix the token, do not lower the threshold.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/styles/global.css src/layouts/BaseLayout.astro astro.config.mjs
git commit -m "feat(design): dark editorial tokens, Inter and JetBrains Mono"
```

---

### Task 3: Nav and Footer

**Files:**
- Modify: `src/components/Nav.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Restyle the nav**

In `src/components/Nav.astro`, replace the whole `<style>` block with:

```astro
<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg); /* fallback: color-mix() failing would leave this transparent */
    background: color-mix(in srgb, var(--bg) 92%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
  }
  nav {
    display: flex;
    align-items: center;
    gap: 1.1rem;
    padding-top: 0.85rem;
    padding-bottom: 0.85rem;
  }
  .brand {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--ink);
    margin-right: auto;
  }
  .section-links {
    display: flex;
    gap: 1.4rem;
  }
  .section-links a {
    color: var(--ink-soft);
    font-size: 0.875rem;
    transition: color var(--dur) ease;
  }
  .section-links a:hover {
    color: var(--ink);
  }
  .cv-btn {
    background: var(--accent);
    color: #170f06;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.5rem 1rem;
    border-radius: 3px;
    transition: opacity var(--dur) ease;
  }
  .cv-btn:hover {
    opacity: 0.88;
  }
  /* Focus rings live in global.css — do not redefine them per component. */
  /* Mobile: name + CV only — no hamburger, no JS (spec §3.1) */
  @media (max-width: 640px) {
    .section-links {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Restyle the footer as the contact block**

In `src/components/Footer.astro`, keep the markup exactly as it is — a test asserts
`footer` exists and the links are reachable — and replace only the `<style>` block:

```astro
<style>
  footer {
    border-top: 1px solid var(--border);
    background: var(--surface-alt);
    text-align: center;
    padding-block: 4rem;
  }
  .closer {
    font-family: var(--font-serif);
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    color: var(--ink);
    letter-spacing: -0.02em;
    margin-bottom: 0.9rem;
  }
  .links {
    color: var(--ink-soft);
    font-size: 0.9rem;
    margin: 0;
  }
  .links a {
    color: var(--ink-soft);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .links a:hover {
    color: var(--accent);
  }
  .links a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
  }
</style>
```

The underline stays: colour alone must not signal a link (WCAG F73).

- [ ] **Step 3: Build and eyeball nothing — run the suite**

Run: `npm test -- tests/quality.spec.ts tests/links.spec.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro src/components/Footer.astro
git commit -m "feat(design): dark nav and contact footer"
```

---

### Task 4: Hero

The whole redesign exists because this viewport was ~60% empty. The hero image is now
**above the fold**, so it must be eager-loaded with explicit dimensions or LCP and CLS
both regress.

**Files:**
- Modify: `src/components/Hero.astro`
- Modify: `tests/home.spec.ts:16-22`

- [ ] **Step 1: Update the hero test to the new positioning**

In `tests/home.spec.ts`, replace the `hero states title and positioning` test with:

```ts
test('hero states title and positioning', async ({ page }) => {
  await expect(page.locator('#hero .section-label')).toHaveText(
    'Multi-tenant B2B SaaS · Access control'
  );
  await expect(page.locator('#hero h1')).toBeVisible();
  await expect(page.locator('#hero')).toContainText('7+ years');
});

test('hero image is eager and dimensioned so it cannot hurt LCP or CLS', async ({ page }) => {
  await page.goto('/');
  const img = page.locator('#hero img');
  await expect(img).toHaveAttribute('width', '1200');
  await expect(img).toHaveAttribute('height', '573');
  // Above the fold: lazy-loading it would delay the largest paint.
  await expect(img).not.toHaveAttribute('loading', 'lazy');
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- tests/home.spec.ts`
Expected: FAIL — `#hero .section-label` does not exist yet (the current markup uses `.kicker`).

- [ ] **Step 3: Rewrite `src/components/Hero.astro`**

Replace the entire file with:

```astro
---
// PLACEHOLDER COPY — see Task 12. The headline and paragraph below were drafted by
// Claude and must be rewritten in Romarjo's own voice before launch.
const headlineLead = 'Multi-tenant systems that';
const headlineAccent = "don't leak";
---
<section id="hero" class="section">
  <div class="container hero-grid">
    <div class="hero-copy">
      <p class="section-label">Multi-tenant B2B SaaS &middot; Access control</p>
      <h1>
        {headlineLead} <em>{headlineAccent}</em>.
      </h1>
      <p class="intro">
        Senior engineer, 7+ years. I build B2B SaaS where tenant isolation and access
        control are enforced at every layer — the ORM, Postgres row-level security, and
        the API on top. Remote from Albania.
      </p>
      <div class="actions">
        <a class="primary" href="/#projects">See the work</a>
        <a class="secondary" href="/Romarjo_Balukja_CV.pdf" target="_blank" rel="noopener">
          Download CV
        </a>
      </div>
    </div>
    <figure class="hero-shot">
      <img
        src="/images/tenantiq/ask-hero.webp"
        srcset="/images/tenantiq/ask-hero-640.webp 640w, /images/tenantiq/ask-hero-900.webp 900w, /images/tenantiq/ask-hero.webp 1200w"
        sizes="(max-width: 820px) 92vw, (max-width: 1080px) 55vw, 547px"
        width="1200"
        height="573"
        decoding="async"
        fetchpriority="high"
        alt="TenantIQ answering a question about a contract, with each claim carrying a numbered citation that resolves to the source passage."
      />
      <figcaption>
        TenantIQ — every answer scoped to one workspace, every claim carrying the passage
        it came from.
      </figcaption>
    </figure>
  </div>
  <div class="evidence">
    <div class="container evidence-row">
      <span>621 automated tests</span>
      <span>17 architecture decision records</span>
      <span>2 independent isolation layers</span>
      <span>1 system in daily production</span>
    </div>
  </div>
</section>

<style>
  #hero {
    padding-top: 3.5rem;
    padding-bottom: 0;
  }
  .hero-grid {
    display: grid;
    grid-template-columns: 0.85fr 1.15fr;
    gap: 3rem;
    align-items: center;
  }
  h1 {
    font-size: clamp(2.1rem, 5vw, 3.25rem);
    line-height: 1.02;
    letter-spacing: -0.025em;
    margin-bottom: 1.1rem;
  }
  h1 em {
    font-style: italic;
    color: var(--accent);
  }
  .intro {
    color: var(--ink-soft);
    max-width: 32rem;
    margin-bottom: 1.6rem;
  }
  .actions {
    display: flex;
    gap: 1.3rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .primary {
    background: var(--ink);
    color: var(--bg);
    font-weight: 600;
    font-size: 0.9rem;
    padding: 0.75rem 1.35rem;
    border-radius: 3px;
  }
  .secondary {
    color: var(--accent);
    font-size: 0.9rem;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .hero-shot {
    margin: 0;
  }
  .hero-shot img {
    width: 100%;
    height: auto;
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    box-shadow: var(--shadow-hover);
  }
  .hero-shot figcaption {
    color: var(--ink-faint);
    font-size: 0.78rem;
    font-style: italic;
    line-height: 1.5;
    margin-top: 0.7rem;
  }
  .evidence {
    border-top: 1px solid var(--border);
    margin-top: 3.5rem;
    background: var(--surface-alt);
  }
  .evidence-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.8rem;
    padding-top: 0.95rem;
    padding-bottom: 0.95rem;
    color: var(--ink-faint);
    font-size: 0.78rem;
  }
  .evidence-row span:first-child {
    color: var(--accent);
  }
  @media (max-width: 820px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }
</style>
```

- [ ] **Step 4: Run the hero tests**

Run: `npm test -- tests/home.spec.ts`
Expected: PASS — all six tests in the file, including the unchanged six-section, six-skill-group and five-role assertions.

- [ ] **Step 5: Pay the LCP cost the image introduces**

The hero image becomes the LCP element and pushed LCP from 1.4s to **2102ms** on first
measurement. Two changes, both measured, brought it back to **1654ms**:

1. **A `srcset`** (above) so a 390px viewport stops downloading the 1200px file.
   Lighthouse reported 44 KiB wasted without it. Generate the variants:
   ```bash
   node -e 'const s=require("sharp");[640,900].forEach(async w=>{
     const i=await s("public/images/tenantiq/ask-hero.webp").resize(w).webp({quality:82})
       .toFile(`public/images/tenantiq/ask-hero-${w}.webp`);
     console.log(w, i.width+"x"+i.height, Math.round(i.size/1024)+"KB")});'
   ```
   Worth 2102ms → 1956ms. **Note the `sizes` breakpoints matter:** above ~1080px the
   1040px `--container` caps the image at a constant 547px, so a bare `55vw` keeps
   scaling and makes desktop browsers fetch the 900w file for a 547px slot. Verified
   after the fix: 390px→640w, 820px→900w, 1440px→640w.

2. **Drop the Fraunces 700 face.** Its only consumer is `ProjectCard`'s `.monogram`,
   which is below the fold, and the extra 18KB competing for bandwidth cost **302ms**.
   Remove `import '@fontsource/fraunces/latin-700.css';` from `BaseLayout.astro` and set
   `.monogram { font-weight: 600 }` in `ProjectCard.astro`, or the browser synthesises
   bold. Worth 1956ms → **1654ms**, and returns Performance to 100.

- [ ] **Step 6: Also update `tests/smoke.spec.ts`**

It asserts the old headline text and will fail. Make it copy-independent rather than
pinning the placeholder — the headline is still due a rewrite (Gate 1):

```ts
  // Deliberately copy-independent: the headline is placeholder text pending a rewrite
  // (Task 12, Gate 1). A smoke test should prove the page renders, not pin its wording —
  // tests/home.spec.ts is where positioning is asserted.
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  await expect(h1).not.toBeEmpty();
```

- [ ] **Step 7: Commit**

```bash
git add src/components/Hero.astro src/components/ProjectCard.astro src/layouts/BaseLayout.astro \
       tests/home.spec.ts tests/smoke.spec.ts public/images/tenantiq/ask-hero-640.webp public/images/tenantiq/ask-hero-900.webp
git commit -m "feat(hero): two-column editorial hero led by real product evidence"
```

---

### Task 5: Un-gate the hero from the scroll reveal

The reveal animation holding content near-zero opacity is the original defect. The hero
and the first project card must be painted immediately.

**Files:**
- Modify: `src/pages/index.astro:19-35`
- Modify: `tests/quality.spec.ts:57-63`

- [ ] **Step 1: Update the reveal test so it no longer asserts on the hero**

In `tests/quality.spec.ts`, replace the `home sections reveal on scroll` test with:

```ts
test('home sections reveal on scroll', async ({ page }) => {
  await page.goto('/');
  const skills = page.locator('#skills');
  await skills.scrollIntoViewIfNeeded();
  await expect(skills.locator('.reveal').first()).toHaveClass(/is-visible/);
});

test('hero is painted immediately, never behind the reveal', async ({ page }) => {
  await page.goto('/');
  // The hero is the reason this redesign exists: it must never start invisible.
  await expect(page.locator('#hero .reveal')).toHaveCount(0);
  await expect(page.locator('#hero h1')).toHaveCSS('opacity', '1');
});
```

- [ ] **Step 2: Run it and watch the new test fail**

Run: `npm test -- tests/quality.spec.ts`
Expected: the `hero is painted immediately` test FAILS only if a `.reveal` wraps the hero. If it already passes, keep it — it is a regression guard.

- [ ] **Step 3: Restructure `src/pages/index.astro`**

Replace the `<main>` block with:

```astro
  <main>
    <Hero />
    <section id="projects" class="section">
      <div class="container">
        <p class="section-label">01 &middot; Selected work</p>
        <h2>Three systems, three problems.</h2>
        <p class="sub">Each opens a full case study.</p>
        <ProjectCard project={featured} featured />
        <Reveal>
          <div class="pair">
            {rest.map((p) => <ProjectCard project={p} />)}
          </div>
        </Reveal>
      </div>
    </section>
    <Skills />
    <ExperienceTimeline />
  </main>
```

The featured card sits outside `<Reveal>` so it is painted with the hero; only the two-up
row animates in.

**Measured caveat, so nobody over-claims this later:** at 1280×900 the featured card is
69% below the fold (only the top of its thumbnail shows), and at 390×844 it is entirely
below the fold. Un-gating it is still correct — it removes an opacity/transform animation
from an element that is at rest on first paint — but the "first viewport is no longer
mostly empty" win comes almost entirely from the hero, not from this card.

- [ ] **Step 4: Update the styles in the same file**

Replace the `<style>` block with:

```astro
<style>
  #projects h2 {
    font-size: clamp(1.5rem, 3vw, 1.95rem);
    letter-spacing: -0.02em;
    margin-bottom: 0.3rem;
  }
  .sub {
    color: var(--ink-faint);
    font-size: 0.875rem;
    margin-bottom: 1.75rem;
  }
  #projects :global(.featured) {
    margin-bottom: 1.1rem;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.1rem;
  }
  @media (max-width: 760px) {
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS. If `renders all six home sections` fails, an id was dropped — restore it; those ids are load-bearing per spec §5.1.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro tests/quality.spec.ts
git commit -m "fix(home): paint the hero and featured card immediately"
```

---

### Task 6: Project cards with status pills

**Files:**
- Modify: `src/content.config.ts:5-24`
- Modify: `src/content/projects/tenantiq.md` (frontmatter only)
- Modify: `src/content/projects/vetapp.md` (frontmatter only)
- Modify: `src/content/projects/react-ui-kit.md` (frontmatter only)
- Modify: `src/components/ProjectCard.astro`
- Modify: `tests/projects.spec.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/projects.spec.ts`:

```ts
test('every project card carries a status pill', async ({ page }) => {
  await page.goto('/');
  const pills = page.locator('#projects .status');
  await expect(pills).toHaveCount(3);
  await expect(pills.filter({ hasText: 'In daily production' })).toHaveCount(1);
  await expect(pills.filter({ hasText: 'Open source' })).toHaveCount(1);
  await expect(pills.filter({ hasText: 'Published on npm' })).toHaveCount(1);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npm test -- tests/projects.spec.ts`
Expected: FAIL — `Expected: 3, Received: 0`.

- [ ] **Step 3: Add the `status` field to the schema**

In `src/content.config.ts`, add this line inside the `z.object({ ... })`, immediately after `isPrivate`:

```ts
    status: z.enum(['production', 'open-source', 'npm']).optional(),
```

- [ ] **Step 4: Set the status on each project**

Add exactly one line to each file's frontmatter:

- `src/content/projects/vetapp.md` → `status: production`
- `src/content/projects/tenantiq.md` → `status: open-source`
- `src/content/projects/react-ui-kit.md` → `status: npm`

**Do not change `.monogram`'s `font-weight: 600`.** The Fraunces 700 face is deliberately
not loaded (it cost 302ms of LCP); asking for 700 triggers synthetic bold.

- [ ] **Step 5: Render the pill in `src/components/ProjectCard.astro`**

Change the frontmatter to:

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
  featured?: boolean;
}

const { project, featured = false } = Astro.props;
const { title, bullets, stack, thumbnail, links, status } = project.data;

const STATUS: Record<string, { label: string; tone: string }> = {
  production: { label: 'In daily production', tone: 'live' },
  'open-source': { label: 'Open source', tone: 'oss' },
  npm: { label: 'Published on npm', tone: 'npm' },
};
const badge = status ? STATUS[status] : null;
---
```

Then insert this as the first child of `<div class="body">`, above the `<h3>`:

```astro
    {badge && <span class:list={['status', badge.tone]}>{badge.label}</span>}
```

- [ ] **Step 6: Add the pill styles**

Append inside the `<style>` block of `ProjectCard.astro`:

```css
  .status {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    margin-bottom: 0.6rem;
  }
  .status.live {
    color: var(--status-live);
    border: 1px solid color-mix(in srgb, var(--status-live) 34%, transparent);
    background: color-mix(in srgb, var(--status-live) 10%, transparent);
  }
  .status.oss {
    color: var(--status-oss);
    border: 1px solid color-mix(in srgb, var(--status-oss) 34%, transparent);
    background: color-mix(in srgb, var(--status-oss) 10%, transparent);
  }
  .status.npm {
    color: var(--status-npm);
    border: 1px solid color-mix(in srgb, var(--status-npm) 34%, transparent);
    background: color-mix(in srgb, var(--status-npm) 10%, transparent);
  }
```

- [ ] **Step 7: Run the tests**

Run: `npm test -- tests/projects.spec.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/content/projects/ src/components/ProjectCard.astro tests/projects.spec.ts
git commit -m "feat(cards): status pills for production, open source and npm"
```

---

### Task 7: Skills, Experience and the case-study layout

Styling only. **Do not change the number of skill groups or experience roles, and do not
edit `src/data/experience.ts`** — see the Gates section.

**Files:**
- Modify: `src/components/Skills.astro` (`<style>` only)
- Modify: `src/components/ExperienceTimeline.astro` (`<style>` only)
- Modify: `src/layouts/CaseStudyLayout.astro` (`<style>` only)
- Modify: `src/pages/404.astro`

- [ ] **Step 1: Confirm the content guards pass before you touch anything**

Run: `npm test -- tests/home.spec.ts`
Expected: PASS, including `skills renders six groups` and `experience renders five roles in CV order`. These must still pass at the end of this task.

- [ ] **Step 2: Restyle Skills**

`src/components/Skills.astro` renders a flat list of `.skill-group` rows, each holding a
`.group-name` and a `.group-items` span. Wrap the map in a grid container — this is the
only markup change, and `.skill-group` is preserved because a test counts it.

Change the markup inside `<Reveal>` to:

```astro
      <p class="section-label">02 &middot; Skills</p>
      <h2>What I reach for.</h2>
      <div class="grid">
        {skills.map(({ group, items }) => (
          <div class="skill-group">
            <span class="group-name">{group}</span>
            <span class="group-items">{items.join(' · ')}</span>
          </div>
        ))}
      </div>
```

Replace the `<style>` block with:

```astro
<style>
  .alt {
    background: var(--surface-alt);
    border-top: 1px solid var(--border);
  }
  h2 {
    font-size: clamp(1.5rem, 3vw, 1.95rem);
    letter-spacing: -0.02em;
    margin-bottom: 1.75rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.75rem 2rem;
  }
  .skill-group {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-size: 0.9rem;
  }
  .group-name {
    color: var(--ink-faint);
    font-family: var(--font-mono);
    font-size: 0.66rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.55rem;
  }
  .group-items {
    color: var(--ink-soft);
    font-size: 0.86rem;
    line-height: 1.75;
  }
  @media (max-width: 860px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 560px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 3: Restyle the experience timeline**

`src/components/ExperienceTimeline.astro` currently renders `{period} · {line}` together
inside `.meta`, so the year cannot be styled on its own. Split it out. The `li` element
and its text content are preserved, so `experience renders five roles in CV order`
(which asserts 5 items, "Senior Software Engineer" first, "Kreatx" last) keeps passing.

Change the markup inside `<Reveal>` to:

```astro
      <p class="section-label">03 &middot; Experience</p>
      <h2>7+ years, shipping.</h2>
      <p class="hint">The details live in the <a href="/Romarjo_Balukja_CV.pdf" target="_blank" rel="noopener">CV</a>.</p>
      <ul role="list">
        {experience.map(({ role, org, period, line }, i) => (
          <li>
            <span class:list={['period', { current: i === 0 }]}>{period}</span>
            <div>
              <strong>{role}</strong> <span class="org">— {org}</span>
              <div class="meta">{line}</div>
            </div>
          </li>
        ))}
      </ul>
```

The decorative `.dot` span is removed; the amber period now marks the current role.

Replace the `<style>` block with:

```astro
<style>
  h2 {
    font-size: clamp(1.5rem, 3vw, 1.95rem);
    letter-spacing: -0.02em;
    margin-bottom: 0.3rem;
  }
  .hint {
    color: var(--ink-faint);
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
  }
  .hint a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: 10.5rem 1fr;
    gap: 1.5rem;
    padding: 1.15rem 0;
    border-top: 1px solid var(--border);
    font-size: 0.9rem;
  }
  li:last-child {
    border-bottom: 1px solid var(--border);
  }
  .period {
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--ink-faint);
    padding-top: 0.25rem;
  }
  .period.current {
    color: var(--accent);
  }
  strong {
    color: var(--ink);
    font-size: 0.98rem;
  }
  .org {
    color: var(--ink-faint);
    font-size: 0.86rem;
  }
  .meta {
    color: var(--ink-soft);
    font-size: 0.86rem;
    line-height: 1.65;
    margin-top: 0.3rem;
  }
  @media (max-width: 700px) {
    li {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }
  }
</style>
```

- [ ] **Step 4: Retune the case-study prose for dark and stop the header stranding**

`--container` is now 1040px for the sake of the home hero, which leaves the case-study
header floating in a 1000px box — the tenantiq `h1` fills 147px of it. Narrow this page
back to the prose measure by adding to `CaseStudyLayout.astro`'s `<style>`:

```css
  main.container {
    max-width: var(--container-prose);
  }
```

Then change these declarations inside the same `<style>` block, leaving everything else intact:

```css
  .prose :global(a) {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .prose :global(figure.shot img) {
    border-color: var(--border-strong);
    box-shadow: 0 14px 30px -12px rgb(0 0 0 / 0.7);
  }
  .private-note {
    color: var(--ink-faint);
  }
```

- [ ] **Step 5: Restyle the 404 page**

In `src/pages/404.astro`, add a `<style>` block after the closing `</BaseLayout>`:

```astro
<style>
  h1 {
    font-size: clamp(1.9rem, 4vw, 2.6rem);
    letter-spacing: -0.02em;
  }
  main p {
    color: var(--ink-soft);
  }
  main a {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
```

Do not touch the heading text or the `main a[href="/"]` link — both are asserted.

- [ ] **Step 6: Run the whole suite**

Run: `npm test`
Expected: PASS, all files.

- [ ] **Step 7: Commit**

```bash
git add src/components/Skills.astro src/components/ExperienceTimeline.astro src/layouts/CaseStudyLayout.astro src/pages/404.astro
git commit -m "feat(design): dark styling for skills, experience, case studies and 404"
```

---

### Task 8: Rewrite the tenantiq case study

The live page says cited answers are "next". They shipped. Source of truth is
`~/Desktop/tenantiq/README.md` and `~/Desktop/tenantiq/docs/adr/`.

**Files:**
- Modify: `src/content/projects/tenantiq.md`

- [ ] **Step 1: Re-measure before writing a single number**

```bash
cd ~/Desktop/tenantiq
grep -rhcE "^[[:space:]]*(async )?def test_" --include="test_*.py" backend/tests | paste -sd+ - | bc
grep -rhoE "^[[:space:]]*(it|test)\(" frontend/tests | wc -l
ls docs/adr/[0-9]*.md | grep -v 0000-template | wc -l
cd ~/Desktop/rbalukja15.github.io
```

Expected on 2026-08-19: `336`, `285`, `17`. If they differ, use what you measure — never the numbers written here.

- [ ] **Step 2: Replace the frontmatter**

```yaml
---
title: tenantiq
tagline: Multi-tenant document intelligence — each tenant asks questions of their own documents and gets answers with citations
context: Solo project — product design, backend, frontend, and infrastructure
bullets:
  - Two-layer tenant isolation — ORM query scoping plus Postgres row-level security
  - Grounded answers that stream in with citations resolving to the exact source passage
  - 621 automated tests, including raw-SQL cross-tenant leak proofs
stack: [Django REST, Next.js, PostgreSQL, pgvector, Celery, Keycloak]
order: 1
status: open-source
links:
  github: https://github.com/rbalukja15/tenantiq
---
```

- [ ] **Step 3: Replace the body**

Keep the same five headings. Voice rules: plain first person, short sentences, few
em-dashes, no marketing register.

```markdown
## Problem

I started tenantiq because most RAG tutorials stop at a demo. They put every customer's
documents in one table, scope queries with a `WHERE` clause, and trust that nobody ever
forgets it. That's fine for a demo. It's not fine when the documents are contracts. I
wanted the version you could actually sell to two companies at once: each tenant uploads
its own files, asks questions about them, and there is no code path that returns someone
else's data.

## What I built

You upload PDFs, text or Markdown. A Celery pipeline parses each file, splits it into
roughly 800-token chunks with some overlap, embeds them, and writes the vectors to
Postgres with pgvector. Ask a question and the answer streams back with numbered
citations, and each citation resolves to the exact passage it came from. If nothing
relevant is retrieved, it refuses and says so instead of answering thinly.

There is a real frontend now: Next.js with an app shell, sign-in through Keycloak OIDC
behind a backend-for-frontend proxy, a design system built on CSS Modules, the streaming
ask screen, and document management with upload progress and live ingestion status.

Around all that: PII redaction and prompt-injection guardrails, per-tenant rate limits
and quotas, and per-tenant cost and token accounting.

## Architecture decisions

Isolation is enforced twice, and the two layers don't know about each other. In the ORM,
every tenant-owned model goes through a manager that filters by the tenant from the
verified token. If no tenant context is set, it raises. I wanted "forgot to scope" to be
a crash, not a quiet query across all tenants. Below that sits Postgres row-level
security, and the app connects as a role that cannot bypass it, so even hand-written SQL
can't read another tenant's rows.

Grounding is a contract, not a hope. The model never computes numbers and never invents a
citation. The UI only makes a `[1]` clickable once it has fetched the passage behind it.

Ingestion is built to be re-run: the attempt is recorded in its own transaction before any
risky work, unparseable files fail permanently instead of burning retries, and
re-ingesting a document replaces its old chunks.

Seventeen architecture decision records in the repo explain why each of these went the way
it did.

## Testing & quality

621 automated tests — 336 on the backend across 31 files, 285 on the frontend across 29.
The isolation ones matter most: unit tests on the scoped manager, tests that run raw SQL
against real Postgres and check that row-level security actually blocks it, and
end-to-end tests that try to leak data through the API. The repo has a standing rule that
every new tenant-owned model ships with a cross-tenant test. CI runs the whole suite as
the same non-superuser Postgres role production uses, because row-level security silently
doesn't apply to superusers and I didn't want the tests lying to me.

## Outcome

Public and in active development. Auth and isolation, the ingestion pipeline, the grounded
query engine with streamed cited answers, and the frontend that uses them are all done and
tested. An evaluation harness that scores retrieval and faithfulness is what I'm building
next. If you want to see how I think about architecture, the ADRs are the fastest way in.
```

- [ ] **Step 4: Embed the screenshots**

After the "What I built" section, insert:

```markdown
<figure class="shot">
  <img src="/images/tenantiq/ask-cited-answer.webp" width="1200" height="625" loading="lazy" decoding="async" alt="TenantIQ answering a question about payment terms, with two numbered citations and a panel showing the exact source passages and their chunk offsets." />
  <figcaption>An answer reconciling an amendment against the original agreement. Every claim carries the passage it came from.</figcaption>
</figure>

<figure class="shot">
  <img src="/images/tenantiq/documents.webp" width="1200" height="486" loading="lazy" decoding="async" alt="The document management screen listing two uploaded contracts, both showing Ready status, with an upload control above." />
  <figcaption>Documents belong to one workspace, and an answer can only ever cite these.</figcaption>
</figure>
```

- [ ] **Step 5: Verify no stale claim survives**

```bash
grep -niE "cited answers are next|building right now|124 tests|16 files" src/content/projects/tenantiq.md || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Run the suite and commit**

Run: `npm test`
Expected: PASS.

```bash
git add src/content/projects/tenantiq.md
git commit -m "docs(tenantiq): rewrite the case study to match what actually shipped"
```

---

### Task 9: Correct the vetapp numbers

**Files:**
- Modify: `src/content/projects/vetapp.md`

- [ ] **Step 1: Re-measure**

```bash
cd ~/Desktop/vetapp
grep -rhcE "^[[:space:]]*(async )?def test_" --include="test_*.py" backend | paste -sd+ - | bc
grep -rhoE "^[[:space:]]*(it|test)\(" frontend/e2e | wc -l
ls frontend/e2e/*.spec.ts | wc -l
find backend -path '*/migrations/[0-9]*.py' | wc -l
cd ~/Desktop/rbalukja15.github.io
```

Expected on 2026-08-19: `302`, `177`, `54`, `45`.

- [ ] **Step 2: Replace the counts sentence in "Testing & quality"**

Find the sentence beginning `366 backend tests and 92 Playwright end-to-end tests` and
replace the first two sentences of that paragraph with:

```markdown
302 backend tests and 177 Playwright end-to-end tests across 54 spec files. The e2e suite
drives the real dockerized stack: it logs in, fills the forms, collects payments, receives
purchase orders. No mocked backend.
```

- [ ] **Step 3: Remove the unverifiable migration claim**

Find `52 migrations and 18 tagged releases in four months.` and replace it with:

```markdown
29 tagged releases so far.
```

The migration count is dropped, not corrected: the site claimed 52 and the repo has 45
files, and migration files do not decrease unless they were squashed. Publishing either
number would be asserting something neither of us can reproduce. See the Gates section.

- [ ] **Step 4: Add the status field**

Confirm `status: production` is present in the frontmatter (added in Task 6).

- [ ] **Step 5: Check nothing stale is left**

```bash
grep -nE "366|92 Playwright|32 spec|52 migrations|18 tagged" src/content/projects/vetapp.md || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Run and commit**

Run: `npm test`

```bash
git add src/content/projects/vetapp.md
git commit -m "docs(vetapp): correct the test counts and drop an unverifiable figure"
```

---

### Task 10: Regenerate the OG image in dark

A light OG card on a dark site makes the LinkedIn preview look like a different product.

**Files:**
- Modify: `scripts/generate-og.mjs`
- Regenerate: `public/images/og.png`

- [ ] **Step 1: Read the current template**

```bash
cat scripts/generate-og.mjs
```

It renders an HTML string with Playwright and screenshots it at 1200×630.

- [ ] **Step 2: Update the template's colours**

In the inline HTML/CSS inside `scripts/generate-og.mjs`, change the palette to match
`global.css`: background `#100f0d`, heading `#f4f1ea`, supporting text `#a89e90`, and one
accent element in `#d98a3d`. Keep the 1200×630 viewport and the existing layout. The
headline should carry the same positioning as the site hero.

- [ ] **Step 3: Regenerate**

```bash
node scripts/generate-og.mjs
```

Expected: `public/images/og.png` rewritten.

- [ ] **Step 4: Confirm it is actually dark**

```bash
node -e '
const sharp=require("sharp");
sharp("public/images/og.png").resize(1,1).raw().toBuffer().then(b=>{
  const [r,g,bb]=b; const avg=(r+g+bb)/3;
  console.log("avg pixel:",r,g,bb,"->", avg<70?"DARK ok":"TOO LIGHT — template not updated");
});'
```

Expected: `DARK ok`.

- [ ] **Step 5: Verify the favicon still reads on dark (spec §7)**

The favicon is a blue `#1d4ed8` rounded square with cream "RB". It was designed against a
light page. Check it against the new dark background rather than assuming:

```bash
node -e '
const srgb=c=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4)};
const L=h=>{const m=h.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16));
  return 0.2126*srgb(m[0])+0.7152*srgb(m[1])+0.0722*srgb(m[2])};
const R=(a,b)=>{const x=L(a),y=L(b);const[h,l]=x>y?[x,y]:[y,x];return (h+0.05)/(l+0.05)};
console.log("favicon blue on dark page:", R("#1d4ed8","#100f0d").toFixed(2));
console.log("cream RB on favicon blue:", R("#faf9f6","#1d4ed8").toFixed(2));'
```

The second ratio is the one that matters — the mark carries its own background, so it
stays legible on any page. If the first ratio is below 3.0 the icon will look muddy in a
dark browser tab; in that case lighten the square in `public/favicon.svg` and re-run
`node scripts/generate-favicon.mjs`. Record the numbers either way.

- [ ] **Step 6: Run the asset test and commit**

Run: `npm test -- tests/quality.spec.ts`
Expected: PASS (`asset /images/og.png resolves` and `asset /favicon.ico resolves`).

```bash
git add scripts/generate-og.mjs public/images/og.png
git commit -m "feat(seo): regenerate the OG card in the dark theme"
```

---

### Task 11: Full verification

- [ ] **Step 1: Type-check and build**

```bash
npm run check && npm run build
```

Expected: `0 errors, 0 warnings, 0 hints`, then `Complete!`.

- [ ] **Step 2: Run the entire suite**

```bash
npm test
```

Expected: all tests pass, including the six unchanged content guards (six sections, six
skill groups, five roles, 404 status and link, every asset 200, zero console errors).

- [ ] **Step 3: Lighthouse against the built site**

```bash
npm run preview -- --port 4399 &
sleep 3
npx --yes lighthouse@12 http://localhost:4399/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --quiet \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=/tmp/lh-redesign.json
node -e '
const r=require("/tmp/lh-redesign.json");
for(const k of ["performance","accessibility","best-practices","seo"])
  console.log(k.padEnd(16), Math.round(r.categories[k].score*100));
for(const k of ["largest-contentful-paint","cumulative-layout-shift","total-blocking-time"])
  console.log(" ", k, r.audits[k].displayValue);'
lsof -tiTCP:4399 -sTCP:LISTEN | xargs kill
```

**Do not judge this on the category score alone.** A 43% LCP regression already happened
once during this project while Performance still rounded to 100. Assert the metrics:

```bash
node -e '
const r=require("/tmp/lh-redesign.json");
const lcp=r.audits["largest-contentful-paint"].numericValue;
const cls=r.audits["cumulative-layout-shift"].numericValue;
const fail=[];
if (lcp > 1800) fail.push(`LCP ${Math.round(lcp)}ms > 1800ms budget`);
// 0.05, not 0.01: the hero introduced an intermittent font-swap shift measuring
// 0.0165 on some runs and 0.0000 on others. Still 6x better than Google's 0.1 "good".
if (cls > 0.05) fail.push(`CLS ${cls} > 0.05`);
// Report WHICH element is LCP, not just the number. The 43% regression was missed
// the first time precisely because only the metric was watched, never the cause.
const el = r.audits["largest-contentful-paint-element"]
  ?.details?.items?.[0]?.items?.[0]?.node?.selector;
console.log("LCP element:", el || "unknown");
console.log(fail.length ? "REGRESSION: "+fail.join("; ") : "within budget");
process.exit(fail.length ? 1 : 0);'
```

**Measured history on this branch — read this before judging any number:**

| State | LCP | FCP | Note |
| --- | --- | --- | --- |
| Light theme, system body font | 1.1s | 0.9s | the original live baseline |
| After Inter, stylesheet gone external | 1.5s | 1.35s | the regression, caught in review |
| After `inlineStylesheets: 'always'` | **1.4s** | 1.2s | where the branch actually sits |

The remaining 1.1s → 1.4s is **not a defect to chase**. It is the honest, accepted cost of
moving body copy from a zero-latency system font to a downloaded webfont, which is a
deliberate design decision. The LCP element is the hero paragraph, so it moves when Inter
swaps in. Preloading Inter was tested and does not recover it.

Budget is therefore **1800ms**: above the real 1.4s so normal noise and the new hero image
don't cause false alarms, and far under Google's 2500ms "good" threshold, while still
catching any genuine regression. Do not raise it further to make a run pass — investigate
in this order: is the stylesheet still inlined (`ls dist/_astro/*.css` must be empty), is
the hero image non-lazy with explicit `width`/`height`, and was a new font weight added.

- [ ] **Step 4: Check both viewports for overflow**

```bash
node -e '
const pw=require("@playwright/test");
(async()=>{
  const b=await pw.chromium.launch(); const p=await b.newPage();
  for (const [w,h] of [[1280,900],[390,844]]) {
    await p.setViewportSize({width:w,height:h});
    await p.goto("http://localhost:4399/",{waitUntil:"networkidle"});
    const o=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    console.log(w+"px overflow:",o, o===0?"ok":"HORIZONTAL SCROLL");
  }
  await b.close();
})();'
```

Expected: `0` at both widths. Start the preview server first as in Step 3.

- [ ] **Step 5: Commit any fixes and open the PR**

```bash
git push -u origin HEAD
gh pr create --title "Dark editorial redesign + case-study corrections" --body "$(cat <<'BODY'
Replaces the light minimal-editorial visual layer with a committed dark editorial one,
and corrects case-study content that had gone out of date.

- tenantiq rewritten: cited answers, streaming, guardrails and the frontend all shipped;
  621 automated tests and 17 ADRs.
- vetapp counts corrected; the unverifiable migration figure removed.
- Hero led by a real product screenshot, painted immediately rather than behind the
  scroll reveal.
- New permanent WCAG contrast gate over the token palette.

Spec: docs/superpowers/specs/2026-08-19-portfolio-redesign-design.md
BODY
)"
```

---

### Task 12: Launch gates — Romarjo only

**These three cannot be resolved by an implementing agent. Do not guess, and do not
merge to a live site until they are answered.**

- [ ] **Gate 1 — the headline.** `src/components/Hero.astro` ships with a comment marking
  the headline and intro paragraph as placeholder copy written by Claude. It is the most
  read sentence on the site. Romarjo rewrites it in his own voice before launch.

- [ ] **Gate 2 — the migration count.** Task 9 removed the "52 migrations" claim. If
  Romarjo knows the migrations were squashed, a corrected figure can go back in. Otherwise
  it stays out.

- [x] **Gate 3 — employer naming. RESOLVED, already decided.** Commit `15eb099`
  (2026-07-29) shows Romarjo deliberately naming Ritech International AG and eos.uptrade
  (Siemens Mobility), because the anonymous phrasing "read as unverifiable". The spec §11
  anonymity rule is superseded by that later decision. One nuance worth a glance but not
  a blocker: the commit also names the end clients (Deutsche Bahn, BVG Berlin, SSB
  Stuttgart), which goes further than the CV advice of "name your entity, anonymise the
  client". It is his published call and has been live since July. Leave it alone.

---

## Notes for the implementer

- **Never lower a test threshold to make it pass.** The contrast gate exists because
  `--ink-faint` already failed once at 4.07:1.
- **Never change an element id.** `header nav`, `#hero`, `#projects`, `#skills`,
  `#experience`, `footer` are asserted.
- **Never reduce content counts.** Six skill groups, five experience roles.
- **Re-measure every number you publish.** Both source repos are active; the figures in
  this plan were true on 2026-08-19 and may not be tomorrow.
