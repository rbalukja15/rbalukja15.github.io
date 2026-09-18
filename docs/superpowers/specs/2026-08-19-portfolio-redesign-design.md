# Portfolio Redesign — Design Spec

Supersedes the visual layer of `2026-07-05-portfolio-website-design.md`. That spec's
architecture, deployment, anonymity constraints (§11) and content model still stand.

## 1. Purpose & problem

The site is live, fast, and accurate, but it does not hold attention. Measured on the
live home page: the first viewport is roughly **60% empty** — the hero occupies the
top-left third while the right half and lower half are blank, and the scroll-reveal
holds "Selected work" near zero opacity until the reader scrolls. Nothing anchors the
eye, and the strongest evidence (real product UI, test counts, shipped systems) sits on
sub-pages.

Second problem, discovered 2026-08-19: **the tenantiq case study is factually wrong.**
It says cited answers are "the part I'm building right now" and "cited answers are next".
Both shipped. The site understates its own strongest project.

Goal: a site that is visually committed and evidence-led on first paint, and truthful
about what now exists.

## 2. Scope

**In scope**
- Replace the visual layer: tokens, layouts, all seven components.
- Rewrite the tenantiq case study to current reality; correct numbers in vetapp.
- New hero built on real tenantiq product screenshots.
- Regenerate the OG image in the new dark theme.
- Update the Playwright suite for the changed copy and structure.

**Out of scope**
- Astro version, content-collection schema, routing, CI/CD, hosting.
- react-ui-kit case-study **copy** (still accurate). Its page is restyled like the others.
- Any new page or section beyond what exists today.
- A light theme (see §4.1).

## 3. Positioning & voice

Positioning moves from generic full-stack to **multi-tenant B2B SaaS + access control** —
narrower, rarer, harder to fake, and supported by tenantiq (two-layer isolation, OIDC)
and vetapp (per-user capability permissions, append-only ledger, audit log).

**The working headline "Multi-tenant systems that don't leak." is a PLACEHOLDER.**
It was written by Claude and survived four mockup rounds by inertia. It must be rewritten
in Romarjo's own voice before launch — plain first person, short sentences, no em-dash
pile-ups — consistent with the Task 13 copy rules. Same applies to the hero paragraph.

Never publish a figure that cannot be reproduced from a clone (see §6.3).

## 4. Visual system

### 4.1 Theme — dark only

Single committed dark theme. No light mode and no toggle: one look is stronger than a
hedged one, and it halves the CSS, the contrast matrix, and the test surface. This is a
deliberate reversal of the current light site.

### 4.2 Tokens

Replaces the palette in `src/styles/global.css`. Warm ink, not blue-black.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#100f0d` | page |
| `--surface` | `#17140f` | cards |
| `--surface-alt` | `#0d0c0a` | alternating bands |
| `--ink` | `#f4f1ea` | headings, primary text |
| `--ink-soft` | `#a89e90` | body |
| `--ink-faint` | `#8a7f70` | captions, meta |
| `--accent` | `#d98a3d` | amber — kickers, links, the italic hero word |
| `--border` | `#221f1a` | hairlines |
| `--border-strong` | `#2a251d` | card and image edges |
| `--chip-bg` | `#221d16` | stack chips |
| status: live | `#5cb87f` | "IN DAILY PRODUCTION" |
| status: npm | `#c98bdb` | "PUBLISHED ON NPM" |

**Measured 2026-08-19** (WCAG 2.1 relative luminance, all against `--bg` unless noted):

| Pair | Ratio | |
| --- | --- | --- |
| `--ink` on `--bg` | 16.98 | pass |
| `--ink-soft` on `--bg` | 7.26 | pass |
| `--ink-faint` on `--bg` | 4.88 | pass |
| `--ink-faint` on `--surface` | 4.68 | pass |
| `--accent` on `--bg` | 6.98 | pass |
| status live on `--surface` | 7.54 | pass |
| status npm on `--surface` | 7.17 | pass |

`--ink-faint` was originally specced as `#7d7264` and **failed at 4.07 / 3.90** — the same
token that has failed in this repo before. It is now `#8a7f70`. The margin on `--surface`
is 0.18; a permanent contrast test (§9) guards it against future drift.

### 4.3 Typography

- **Fraunces** (already loaded) for headings and the hero, ~52px hero / 31px section.
  The accent word is *italic* in amber. Reusing the existing font means no new payload.
- **Inter** for body. New dependency (`@fontsource/inter`), latin subset, weights 400/600.
- **JetBrains Mono** for microtype only — kickers, years, counts, file labels. New
  dependency, latin, weight 400/500.

Both new faces self-hosted via `@fontsource`; no external font CDN (CSP + offline build).
Only the hero's Fraunces weight is preloaded — see §8 on avoiding a double-download.

### 4.4 Motion

Keep the existing `Reveal.astro` IntersectionObserver — one script, already tested,
already has a `scripting: none` fallback and a reduced-motion path. **Change:** the hero
and the first project card must not be gated behind reveal, so the first paint is never
near-empty. This is the defect the redesign exists to fix; re-introducing it would be a
regression.

## 5. Page designs

### 5.1 Home

Order: Hero → Selected work → Skills → Experience → Contact. Sections carry mono
numbering (`01 · SELECTED WORK`).

**Hero** — two columns. Left: amber kicker, Fraunces headline with the italic amber
accent word, body paragraph, primary "See the work" + secondary "Download CV". Right:
`tenantiq/ask-hero.webp`, bordered, with an italic caption. Below, a full-width evidence
strip: `621 automated tests · 17 architecture decision records · 2 independent isolation
layers · 1 system in daily production`.

The hero image is the **tenantiq cited-answer screen**, not vetapp. This is deliberate:
the headline claims multi-tenant isolation, and vetapp is a single-clinic system. Claim
and evidence must agree. The screenshot also proves the citation contract and frontend
craft in the same image.

**Selected work** — featured card (vetapp, with `vetapp/dashboard.webp`) plus a two-up
row (tenantiq, react-ui-kit). Every card carries a status pill: `IN DAILY PRODUCTION`,
`OPEN SOURCE`, `PUBLISHED ON NPM`.

**Skills** — must keep all **six** groups from `src/data/skills.ts`. The mockups showed
four; that was a simplification, not a decision. No progress bars (unchanged rule).

**Experience** — must keep all **five** roles from `src/data/experience.ts` in CV order.
Mono years in the left column, amber for the current role.

**Contact** — this is the existing `<footer>`, restyled and given more presence, not a
new section. It keeps the "Let's talk." heading, email as primary action, and
GitHub/LinkedIn/CV secondary.

**Element ids are load-bearing and must not change:** `header nav`, `#hero`, `#projects`,
`#skills`, `#experience`, `footer`. A test asserts all six are present, and it should keep
passing untouched — the redesign changes how they look, not what they are.

### 5.2 Case study pages

Same tokens. Header keeps kicker / title / tagline / context / chips / links. Body prose
re-tuned for dark: `--ink-soft` at 0.95rem, amber underlined links. The existing
`figure.shot` treatment carries over; image borders move to `--border-strong`.

### 5.3 404

Restyled only. Copy and the `main a[href="/"]` link stay — a test asserts both.

## 6. Content corrections

### 6.1 tenantiq — rewrite

Now M0–M4 complete. The rewrite must reflect:
- Grounded generation with an enforced citation contract; SSE streaming; the product
  refuses when nothing relevant is retrieved.
- PII redaction and prompt-injection guardrails; per-tenant rate limiting and quotas;
  per-tenant cost and token accounting.
- A real frontend: app shell, OIDC via a BFF proxy, design system, streaming ask screen
  with clickable citations, document management with live ingestion status.
- **621 automated tests** (336 backend across 31 files + 285 frontend across 29).
- **17 ADRs.**
- Stack chips gain Celery, Redis, Keycloak.
- Status: M5 (evaluation harness) is next — state it plainly; do not imply it is done.

Screenshots to embed: `ask-cited-answer.webp` and `documents.webp`.

### 6.2 vetapp — corrections

- e2e: **177 test cases across 54 spec files** (site says 92 across 32).
- Backend: site says 366; a `def test_` count gives 302. Both may be true under different
  measures. Pick one measure and state it.

### 6.3 Unresolved — the migration count

The site claims **52 migrations**; the repo has **45** files. Migration files do not
decrease unless squashed. **This number must be verified or removed before launch.**
Do not carry it over on trust.

## 7. Assets

- `public/images/tenantiq/{ask-hero,ask-cited-answer,documents,ask-empty}.webp` —
  captured 2026-08-19, 1200px WebP. Demo data is fictional (Acme Inc / Northwind Ltd,
  user `alice`), so publishable. `ask-hero` is a tight crop; the full-page version is
  illegible at hero size.
- vetapp images unchanged.
- **OG image must be regenerated dark.** `scripts/generate-og.mjs` renders a light
  template; leaving it produces a LinkedIn card that looks like a different site.
- Favicon unchanged (blue mark still reads on dark; verify, don't assume).

## 8. Accessibility

Contrast is **measured, not eyeballed.** `--ink-faint` already failed WCAG once on an alt
surface in this repo. Compute the ratio for every text/background pair and record it in
the plan; minimum 4.5:1 for body, 3:1 for large text. Highest-risk pairs:
`--ink-faint` on `--bg`, `--ink-faint` on `--surface`, `--accent` on `--bg`, and every
status pill colour on `--surface`.

Also required: visible focus rings on the new dark surfaces, and link underlines retained
(colour alone must not signal a link).

## 9. Testing & quality gates

The existing suite is the safety net; it must stay green. Tests that will need updating
because the redesign intentionally changes what they assert:

| Test | Why it changes |
| --- | --- |
| `home.spec.ts` — hero states title and positioning | New headline and positioning |
| `quality.spec.ts` — meta and OG tags on home | Title string may change |
| `quality.spec.ts` — reveal on scroll / reduced motion | Hero no longer reveal-gated |

Tests that must keep passing **unchanged** — they encode real requirements:
- all six home sections present (ids preserved, see §5.1)
- six skills groups, no progress bars
- five experience roles in CV order
- 404 status + home link
- every asset resolves 200
- zero console errors on all four pages

New gates: a contrast assertion for the risky pairs, and a check that the hero image and
its caption render with `width`/`height` set (CLS stayed 0 on the vetapp shots because of
this; keep it).

Re-run Lighthouse mobile after the theme swap. Current live baseline: Performance 100,
LCP 1.1s, CLS 0. The hero image is now **above the fold**, so it must not be lazy-loaded
and it must carry explicit dimensions, or LCP and CLS both regress.

## 10. Rollout

Single branch, one PR, merged when the suite is green and Lighthouse holds. The site is
public and already indexed; it must never be live in a half-redesigned or
half-corrected state. This is why the content rewrite is folded in rather than deferred.

## 11. Decisions considered and rejected

- **Terminal/dossier theme in the style of the reference site.** Rejected: it is another
  person's identity, dark+mono is the most crowded look in engineer portfolios, and a
  costume competes with the evidence rather than supporting it.
- **Full-bleed product screenshot behind the hero.** Rejected: it broke on first render
  (light UI burned through the scrim, text clipped) and needed a heavier scrim to be
  legible. Too fragile for the most important viewport.
- **Code snippet as the hero visual.** Superseded: a real cited-answer screenshot proves
  the same claim and additionally demonstrates frontend quality.
- **Keeping a light theme alongside dark.** Rejected on commitment and cost (§4.1).

## 12. Risks

- **Numbers drift.** Both repos are active; counts taken today may be stale by launch.
  Re-measure at implementation time and state the method.
- **The placeholder headline ships by inertia.** Highest-visibility copy on the site and
  the least owned. Explicitly gated in the plan.
- **Contrast regressions.** A warm low-contrast palette is exactly where this repo has
  failed before.
- **LCP regression** from an above-the-fold hero image (§9).
