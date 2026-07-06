# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Romarjo Balukja's recruiter-focused portfolio at https://rbalukja15.github.io — a one-pager home plus three case-study pages, per the approved spec.

**Architecture:** Static Astro 6 site, no UI framework — design tokens as CSS custom properties, a Markdown content collection for the three projects, typed data files for skills/experience, one `IntersectionObserver` script as the only JavaScript. Playwright smoke tests gate a GitHub Actions deploy to GitHub Pages.

**Tech Stack:** Astro 6.4 (pinned `^6` — npm `latest` is now v7), TypeScript strict, @fontsource/fraunces (static 600/700, latin), @astrojs/sitemap, @playwright/test 1.61, withastro/action@v6, png-to-ico.

**Spec:** `docs/superpowers/specs/2026-07-05-portfolio-website-design.md` — refer to it for all product decisions. Canonical URLs live in spec §9.1 and in `tests/links.spec.ts`.

**Working directory for every command:** `/Users/romarjobalukja/Desktop/rbalukja15.github.io` (existing git repo, branch `main`, contains `docs/` and `public/Romarjo_Balukja_CV.pdf`).

**Environment requirement:** Node ≥ 22.12 (`node --version` to confirm before starting; Astro 6 refuses older).

---

## File structure (end state)

```
astro.config.mjs                  Astro config: site URL + sitemap integration
package.json / package-lock.json  Pinned deps (lockfile MUST be committed — withastro/action requires it)
tsconfig.json                     extends astro/tsconfigs/strict
playwright.config.ts              webServer: build + preview on :4321
.github/workflows/deploy.yml      test job → withastro/action build job → deploy job
public/
  Romarjo_Balukja_CV.pdf          (already committed)
  favicon.svg / favicon.ico       RB monogram (Task 10)
  images/og.png                   generated OG card (Task 10)
  robots.txt
scripts/
  og-template.html                1200×630 OG card source
  generate-og.mjs                 renders template → public/images/og.png
  generate-favicon.mjs            favicon.svg → favicon.ico
src/
  styles/global.css               design tokens + base styles + reveal/motion CSS
  content.config.ts               projects collection schema (zod v4)
  content/projects/{tenantiq,react-ui-kit,vetapp}.md
  data/skills.ts                  6 CV skill groups
  data/experience.ts              5 CV roles, hardcoded order
  layouts/BaseLayout.astro        head/meta/OG, Nav + Footer on every page
  layouts/CaseStudyLayout.astro   case-study header + prose styles
  components/{Nav,Hero,ProjectCard,Skills,ExperienceTimeline,Footer,Reveal}.astro
  pages/index.astro               home
  pages/projects/[id].astro       case studies (routed by entry id)
  pages/404.astro
tests/
  home.spec.ts                    six sections + section contents
  links.spec.ts                   canonical hrefs + CV PDF resolution
  projects.spec.ts                cards + case-study pages
  quality.spec.ts                 console errors, 404, meta/OG, assets
```

Tasks 1–12 are the **build track**; Tasks 13–14 are the **content track** (spec §2). The user-review checkpoint sits inside Task 13 and never blocks Tasks 1–12.

---

### Task 1: Project scaffold (hand-written, no create-astro)

We hand-write the scaffold instead of running `create-astro` because the repo already contains `docs/` and `public/`, and the scaffolder is interactive. **Pin `astro@^6`** — bare `astro` now installs v7.

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `.gitignore`, `src/pages/index.astro`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "rbalukja15.github.io",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^6.4.8"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.9",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://rbalukja15.github.io',
});
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules/
dist/
.astro/
test-results/
playwright-report/
```

- [ ] **Step 5: Write placeholder `src/pages/index.astro`**

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Romarjo Balukja</title>
  </head>
  <body>
    <h1>Romarjo Balukja</h1>
  </body>
</html>
```

- [ ] **Step 6: Install and verify**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`, no errors. If it errors about Node version, stop — Node ≥ 22.12 is required.

Run: `npm run build`
Expected: `✓ Completed in ...` with `dist/index.html` generated.

Run: `npm run check`
Expected: `Result (…): 0 errors, 0 warnings, 0 hints`

- [ ] **Step 7: Commit (lockfile included — withastro/action fails without it)**

```bash
git add package.json package-lock.json tsconfig.json astro.config.mjs .gitignore src/pages/index.astro
git commit -m "feat: scaffold Astro 6 project"
```

---

### Task 2: Design tokens, global stylesheet, fonts

**Files:**
- Create: `src/styles/global.css`
- Modify: `package.json` (adds @fontsource/fraunces)

- [ ] **Step 1: Install the display serif (static weights only)**

Run: `npm install @fontsource/fraunces@^5.2.9`
Expected: added to `dependencies`, no errors.

- [ ] **Step 2: Write `src/styles/global.css`**

Tokens implement spec §4 (minimal editorial palette). The `.reveal` classes implement the motion layer; the reduced-motion block disables all motion (spec §4).

```css
:root {
  --bg: #faf9f6;
  --surface: #ffffff;
  --surface-alt: #f5f3ee;
  --ink: #111214;
  --ink-soft: #55575c;
  --ink-faint: #8a8d93;
  --accent: #1d4ed8;
  --border: #e5e3dc;
  --chip-bg: #f1efe9;

  --font-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;

  --radius: 8px;
  --shadow-hover: 0 12px 24px -8px rgb(17 18 20 / 0.18);
  --dur: 250ms;
  --container: 760px;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--font-serif);
  font-weight: 600;
  line-height: 1.15;
  margin: 0 0 0.5rem;
}

p {
  margin: 0 0 1rem;
}

a {
  color: var(--accent);
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

.container {
  max-width: var(--container);
  margin: 0 auto;
  padding: 0 1.25rem;
}

.section {
  padding: 3.5rem 0;
}

.kicker {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.17em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.75rem;
}

/* Animated link underline (spec §4) */
.fancy-link {
  position: relative;
  font-weight: 600;
  font-size: 0.875rem;
}
.fancy-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur) ease;
}
.fancy-link:hover::after {
  transform: scaleX(1);
}

/* Scroll reveal (home page only; wired by Reveal.astro) */
.reveal {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  .reveal {
    opacity: 1;
    transform: none;
  }
  *,
  *::before,
  *::after {
    transition: none !important;
    animation: none !important;
  }
}
```

- [ ] **Step 3: Verify build still passes**

Run: `npm run build`
Expected: success (the stylesheet isn't imported yet — this just catches syntax-level tooling failures).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/styles/global.css
git commit -m "feat: design tokens, global styles, Fraunces font"
```

---

### Task 3: Content model — collection schema, project files, data files

All frontmatter values below implement spec §5.1/§9.1. Bodies are first-draft skeletons; Task 13 (content track) replaces them with full copy.

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/tenantiq.md`, `src/content/projects/react-ui-kit.md`, `src/content/projects/vetapp.md`
- Create: `src/data/skills.ts`, `src/data/experience.ts`

- [ ] **Step 1: Write `src/content.config.ts`**

Astro 6 notes baked in: config lives at `src/content.config.ts`; `z` comes from `'astro/zod'` (zod v4 — top-level `z.url()`); no `type:` key on collections; entries are addressed by `id`.

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    context: z.string(),
    bullets: z.array(z.string()).min(2).max(3),
    stack: z.array(z.string()),
    thumbnail: z.string().optional(),
    order: z.number(),
    links: z
      .object({
        github: z.url().optional(),
        live: z.url().optional(),
        liveLabel: z.string().default('Live'),
      })
      .optional(),
    isPrivate: z.boolean().default(false),
  }),
});

export const collections = { projects };
```

- [ ] **Step 2: Write `src/content/projects/tenantiq.md`**

```markdown
---
title: tenantiq
tagline: Multi-tenant RAG SaaS — per-tenant document Q&A with grounded, cited answers
context: Solo project — product design, backend, frontend, and infrastructure
bullets:
  - Per-tenant document Q&A with grounded, cited answers
  - Tenant isolation enforced down to the vector store (pgvector)
  - Django REST API + Next.js frontend
stack: [Django REST, Next.js, PostgreSQL, pgvector]
order: 1
links:
  github: https://github.com/rbalukja15/tenantiq
---

## Problem

Organizations want to ask questions of their own documents without answers leaking between customers — and without hallucinated citations. <!-- Task 13 expands -->

## What I built

A multi-tenant SaaS where each tenant uploads documents and gets grounded, cited answers scoped strictly to their own data. <!-- Task 13 expands -->

## Architecture decisions

Tenant isolation is enforced at every layer, down to per-tenant vector storage in pgvector. <!-- Task 13 expands -->

## Testing & quality

<!-- Task 13 writes this from the repo -->

## Outcome

Public codebase demonstrating end-to-end multi-tenant SaaS architecture. <!-- Task 13 expands -->
```

- [ ] **Step 3: Write `src/content/projects/react-ui-kit.md`**

```markdown
---
title: react-ui-kit
tagline: A published MUI 5 component library with a live Storybook
context: Solo project — component API design, theming, documentation
bullets:
  - Reusable MUI 5 components behind a coherent design system
  - Every component documented and browsable in a live Storybook
stack: [React, TypeScript, MUI 5, Storybook]
order: 2
links:
  github: https://github.com/rbalukja15/react-ui-kit
  live: https://rbalukja15.github.io/react-ui-kit/
  liveLabel: Storybook
---

## Problem

Product teams rebuild the same UI primitives repeatedly, each slightly different. <!-- Task 13 expands -->

## What I built

A component library on MUI 5 with consistent theming and a Storybook that documents every component in its real states. <!-- Task 13 expands -->

## Architecture decisions

<!-- Task 13 writes this from the repo -->

## Testing & quality

<!-- Task 13 writes this from the repo -->

## Outcome

Published library with a live Storybook at rbalukja15.github.io/react-ui-kit. <!-- Task 13 expands -->
```

- [ ] **Step 4: Write `src/content/projects/vetapp.md`**

```markdown
---
title: vetapp
tagline: Veterinary clinic management — inventory, purchasing, billing, and vaccines
context: Sole engineer on a production system used daily by a working clinic
bullets:
  - Inventory, purchase orders, and billing for a working clinic
  - Vaccination schedules and client records
  - Hardened by Playwright e2e suites and adversarial review
stack: [React, TypeScript, Django REST, PostgreSQL, Playwright]
order: 3
isPrivate: true
---

## Problem

A real veterinary clinic ran inventory, purchasing, and billing on paper and spreadsheets. <!-- Task 13 expands -->

## What I built

A full clinic-management system: stock and pack-aware purchasing, invoicing, vaccination schedules, and role-based access. <!-- Task 13 expands -->

## Architecture decisions

<!-- Task 13 writes this; no client-identifying details (spec §11) -->

## Testing & quality

<!-- Task 13 writes this — e2e discipline is the differentiator here -->

## Outcome

In production at a real clinic; private codebase. <!-- Task 13 expands -->
```

- [ ] **Step 5: Write `src/data/skills.ts`** (six groups, from the CV — spec §3.1)

```ts
export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    group: 'Frontend',
    items: ['TypeScript', 'React', 'Next.js', 'Redux', 'React Query', 'TailwindCSS', 'MUI', 'Storybook'],
  },
  {
    group: 'Backend',
    items: ['Python', 'Django REST Framework', 'Flask', 'Node.js', '.NET Core'],
  },
  {
    group: 'Data & Databases',
    items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Pandas (vectorised pipelines)'],
  },
  {
    group: 'DevOps & Cloud',
    items: ['Docker', 'Kubernetes', 'ArgoCD (GitOps)', 'GitLab CI/CD', 'GitHub Actions', 'AWS'],
  },
  {
    group: 'Auth & Identity',
    items: ['Keycloak', 'Better Auth', 'Auth0', 'OAuth 2.0 / OIDC'],
  },
  {
    group: 'Testing',
    items: ['Playwright', 'Cypress', 'Jest', 'React Testing Library', 'PyTest'],
  },
];
```

- [ ] **Step 6: Write `src/data/experience.ts`** (order is authoritative — no runtime sorting, spec §3.1)

```ts
export interface ExperienceEntry {
  role: string;
  org: string;
  period: string;
  line: string;
}

export const experience: ExperienceEntry[] = [
  {
    role: 'Senior Software Engineer — Full-Stack & Platform',
    org: 'Public-transport e-ticketing company',
    period: 'Jan 2023 – present',
    line: 'Multi-tenant Next.js webshop, Keycloak/Better Auth SSO, PWA ticket viewer, Kubernetes + GitLab CI/CD.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Freelance — long-term client engagements',
    period: 'Oct 2018 – 2023',
    line: 'Multi-tenant food-retail SaaS (Django + pandas), Moneyfarm fintech features, geolocation platform.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Division5',
    period: 'Sep 2020 – Apr 2022',
    line: 'Full-stack CMS and theatre ticketing apps on Node.js, React, and AWS.',
  },
  {
    role: 'Software Development Engineer',
    org: 'BinaryTree, Inc.',
    period: 'Nov 2019 – Apr 2020',
    line: 'Active Directory migration tooling (Power365 / PowerAD) on .NET Core.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Kreatx',
    period: 'Apr 2019 – Apr 2020',
    line: 'Check-in/out system and HR & finance CMS on .NET.',
  },
];
```

- [ ] **Step 7: Verify schema + build**

Run: `npm run check`
Expected: 0 errors (schema validates all three frontmatter blocks — a typo in any field name fails here).

Run: `npm run build`
Expected: success.

- [ ] **Step 8: Commit**

```bash
git add src/content.config.ts src/content/projects src/data
git commit -m "feat: project content collection and CV data files"
```

---

### Task 4: Playwright harness

**Files:**
- Create: `playwright.config.ts`, `tests/smoke.spec.ts`
- Modify: `package.json` (devDeps + test script)

- [ ] **Step 1: Install Playwright**

Run: `npm install --save-dev @playwright/test@^1.61.1`
Run: `npx playwright install chromium`
Expected: both succeed (browser download ~150MB on first run).

- [ ] **Step 2: Add test script to `package.json` scripts block**

```json
"test": "playwright test"
```

- [ ] **Step 3: Write `playwright.config.ts`**

The webServer builds first so tests always exercise the current build (astro preview serves `dist/` as-is).

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4321/',
  },
});
```

- [ ] **Step 4: Write `tests/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page serves', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Romarjo Balukja');
});
```

- [ ] **Step 5: Run to verify the harness is green**

Run: `npx playwright test`
Expected: `1 passed` (placeholder page from Task 1 satisfies it).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/smoke.spec.ts
git commit -m "test: Playwright harness against built site"
```

---

### Task 5: BaseLayout, Nav, Footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`
- Create: `tests/links.spec.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write the failing tests — `tests/links.spec.ts`**

These assert the canonical URL table from spec §9.1 **exactly**. The card-link assertions (tenantiq GitHub etc.) are added in Task 7; this file starts with nav/footer/CV.

```ts
import { test, expect } from '@playwright/test';

// Canonical URLs — spec §9.1. Frontmatter and this file must agree.
export const CANONICAL = {
  tenantiqGithub: 'https://github.com/rbalukja15/tenantiq',
  uiKitGithub: 'https://github.com/rbalukja15/react-ui-kit',
  storybook: 'https://rbalukja15.github.io/react-ui-kit/',
  githubProfile: 'https://github.com/rbalukja15',
  linkedin: 'https://www.linkedin.com/in/romarjo-balukja',
  email: 'mailto:romarjo.balukja@gmail.com',
  cv: '/Romarjo_Balukja_CV.pdf',
};

test('nav renders brand, section links, and CV button', async ({ page }) => {
  await page.goto('/');
  const nav = page.locator('header nav');
  await expect(nav.locator(`a[href="/"]`)).toContainText('Romarjo Balukja');
  await expect(nav.locator('a[href="/#projects"]')).toBeVisible();
  await expect(nav.locator('a[href="/#skills"]')).toBeVisible();
  await expect(nav.locator('a[href="/#experience"]')).toBeVisible();
  const cv = nav.locator(`a[href="${CANONICAL.cv}"]`);
  await expect(cv).toBeVisible();
  await expect(cv).toHaveAttribute('target', '_blank');
  // No forced download — recruiters preview first (spec §3.1)
  await expect(cv).not.toHaveAttribute('download', /.*/);
});

test('footer renders contact links', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.locator(`a[href="${CANONICAL.email}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.githubProfile}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.linkedin}"]`)).toBeVisible();
  await expect(footer.locator(`a[href="${CANONICAL.cv}"]`)).toBeVisible();
});

test('CV link resolves to a real PDF', async ({ request }) => {
  const response = await request.get(CANONICAL.cv);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
});

test('mobile nav hides section links, keeps CV', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const nav = page.locator('header nav');
  await expect(nav.locator('a[href="/#projects"]')).toBeHidden();
  await expect(nav.locator(`a[href="${CANONICAL.cv}"]`)).toBeVisible();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/links.spec.ts`
Expected: FAIL — no `header nav` exists yet.

- [ ] **Step 3: Write `src/components/Nav.astro`**

```astro
---
---
<header class="site-header">
  <nav class="container" aria-label="Main">
    <a class="brand" href="/">Romarjo Balukja</a>
    <div class="section-links">
      <a href="/#projects">Projects</a>
      <a href="/#skills">Skills</a>
      <a href="/#experience">Experience</a>
    </div>
    <a class="cv-btn" href="/Romarjo_Balukja_CV.pdf" target="_blank" rel="noopener">Download CV</a>
  </nav>
</header>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  nav {
    display: flex;
    align-items: center;
    gap: 1.1rem;
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
  }
  .brand {
    font-family: var(--font-serif);
    font-weight: 600;
    color: var(--ink);
    margin-right: auto;
  }
  .section-links {
    display: flex;
    gap: 1.1rem;
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
    background: var(--ink);
    color: var(--bg);
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
    transition: opacity var(--dur) ease;
  }
  .cv-btn:hover {
    opacity: 0.85;
  }
  /* Mobile: name + CV only — no hamburger, no JS (spec §3.1) */
  @media (max-width: 640px) {
    .section-links {
      display: none;
    }
  }
</style>
```

- [ ] **Step 4: Write `src/components/Footer.astro`**

```astro
---
---
<footer class="section">
  <div class="container">
    <p class="closer">Let&rsquo;s talk.</p>
    <p class="links">
      <a href="mailto:romarjo.balukja@gmail.com">romarjo.balukja@gmail.com</a>
      <span aria-hidden="true">·</span>
      <a href="https://github.com/rbalukja15" rel="noopener">GitHub</a>
      <span aria-hidden="true">·</span>
      <a href="https://www.linkedin.com/in/romarjo-balukja" rel="noopener">LinkedIn</a>
      <span aria-hidden="true">·</span>
      <a href="/Romarjo_Balukja_CV.pdf" target="_blank" rel="noopener">Download CV</a>
    </p>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--border);
    text-align: center;
  }
  .closer {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
  }
  .links {
    color: var(--ink-soft);
    font-size: 0.875rem;
    margin: 0;
  }
  .links a {
    color: var(--ink-soft);
  }
  .links a:hover {
    color: var(--ink);
  }
</style>
```

- [ ] **Step 5: Write `src/layouts/BaseLayout.astro`**

Favicon/OG files referenced here are created in Task 10 — the tags are inert until then, which is fine (the asset smoke tests arrive in Task 10 too).

```astro
---
import '@fontsource/fraunces/latin-600.css';
import '@fontsource/fraunces/latin-700.css';
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImage = new URL('/images/og.png', Astro.site);
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
  </head>
  <body>
    <Nav />
    <slot />
    <Footer />
  </body>
</html>
```

- [ ] **Step 6: Rewrite `src/pages/index.astro` to use the layout**

(Still a stub hero — real sections arrive in Tasks 6–7. The `h1` keeps `tests/smoke.spec.ts` green.)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="Romarjo Balukja — Senior Software Engineer"
  description="Senior software engineer with 7+ years building production web applications end to end — React and Django, through Kubernetes and GitOps."
>
  <main>
    <section class="section container">
      <h1>Romarjo Balukja</h1>
    </section>
  </main>
</BaseLayout>
```

- [ ] **Step 7: Run tests to verify green**

Run: `npx playwright test`
Expected: all tests in `smoke.spec.ts` and `links.spec.ts` PASS.

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/BaseLayout.astro src/components/Nav.astro src/components/Footer.astro src/pages/index.astro tests/links.spec.ts
git commit -m "feat: base layout with shared nav and footer"
```

---

### Task 6: Home page — Hero, Skills, Experience

**Files:**
- Create: `src/components/Hero.astro`, `src/components/Skills.astro`, `src/components/ExperienceTimeline.astro`
- Create: `tests/home.spec.ts`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write the failing tests — `tests/home.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders all six home sections', async ({ page }) => {
  await expect(page.locator('header nav')).toBeVisible();
  await expect(page.locator('#hero')).toBeVisible();
  await expect(page.locator('#projects')).toBeVisible();
  await expect(page.locator('#skills')).toBeVisible();
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
});

test('hero states title and positioning', async ({ page }) => {
  await expect(page.locator('#hero .kicker')).toHaveText(
    'Senior Software Engineer · Full-Stack & DevOps'
  );
  await expect(page.locator('#hero h1')).toBeVisible();
  await expect(page.locator('#hero')).toContainText('7+ years');
});

test('skills renders six groups, no progress bars', async ({ page }) => {
  await expect(page.locator('#skills .skill-group')).toHaveCount(6);
  await expect(page.locator('#skills progress, #skills .bar')).toHaveCount(0);
});

test('experience renders five roles in CV order', async ({ page }) => {
  const roles = page.locator('#experience li');
  await expect(roles).toHaveCount(5);
  await expect(roles.first()).toContainText('Senior Software Engineer');
  await expect(roles.last()).toContainText('Kreatx');
});
```

Note: `#projects` stays failing until Task 7 — run this file expecting 3 of 4 tests to drive this task, or temporarily run specific tests. Simpler: this task adds an **empty `#projects` placeholder section** so all four pass; Task 7 fills it.

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/home.spec.ts`
Expected: FAIL — `#hero` etc. don't exist.

- [ ] **Step 3: Write `src/components/Hero.astro`**

```astro
---
---
<section id="hero" class="section">
  <div class="container">
    <p class="kicker">Senior Software Engineer &middot; Full-Stack &amp; DevOps</p>
    <h1>I build products end to end.</h1>
    <p class="intro">
      7+ years shipping production web applications — React and Next.js frontends,
      Django and Node backends, and the Kubernetes/GitOps pipelines that deploy them.
      Based in Albania, working with teams everywhere.
    </p>
  </div>
</section>

<style>
  #hero {
    padding-top: 4.5rem;
    padding-bottom: 4.5rem;
  }
  h1 {
    font-size: clamp(2rem, 5vw, 2.75rem);
    margin-bottom: 0.75rem;
  }
  .intro {
    color: var(--ink-soft);
    max-width: 34rem;
    margin: 0;
  }
</style>
```

- [ ] **Step 4: Write `src/components/Skills.astro`**

```astro
---
import { skills } from '../data/skills';
---
<section id="skills" class="section alt">
  <div class="container">
    <h2>Skills</h2>
    {skills.map(({ group, items }) => (
      <div class="skill-group">
        <span class="group-name">{group}</span>
        <span class="group-items">{items.join(' · ')}</span>
      </div>
    ))}
  </div>
</section>

<style>
  .alt {
    background: var(--surface-alt);
  }
  h2 {
    font-size: 1.375rem;
    margin-bottom: 1.25rem;
  }
  .skill-group {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.7rem;
    font-size: 0.9rem;
  }
  .group-name {
    flex: 0 0 8.5rem;
    color: var(--ink-faint);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding-top: 0.15rem;
  }
  .group-items {
    color: var(--ink-soft);
  }
  @media (max-width: 640px) {
    .skill-group {
      flex-direction: column;
      gap: 0.15rem;
    }
  }
</style>
```

- [ ] **Step 5: Write `src/components/ExperienceTimeline.astro`**

```astro
---
import { experience } from '../data/experience';
---
<section id="experience" class="section">
  <div class="container">
    <h2>Experience</h2>
    <p class="hint">The details live in the <a href="/Romarjo_Balukja_CV.pdf" target="_blank" rel="noopener">CV</a>.</p>
    <ul>
      {experience.map(({ role, org, period, line }, i) => (
        <li>
          <span class:list={['dot', { current: i === 0 }]} aria-hidden="true"></span>
          <div>
            <strong>{role}</strong> — {org}
            <div class="meta">{period} · {line}</div>
          </div>
        </li>
      ))}
    </ul>
  </div>
</section>

<style>
  h2 {
    font-size: 1.375rem;
    margin-bottom: 0.25rem;
  }
  .hint {
    color: var(--ink-faint);
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: flex;
    gap: 0.9rem;
    margin-bottom: 1.1rem;
    font-size: 0.9rem;
  }
  .dot {
    flex: 0 0 8px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink-faint);
    margin-top: 0.45rem;
  }
  .dot.current {
    background: var(--accent);
  }
  .meta {
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
</style>
```

- [ ] **Step 6: Update `src/pages/index.astro`** (placeholder `#projects` filled in Task 7)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import Skills from '../components/Skills.astro';
import ExperienceTimeline from '../components/ExperienceTimeline.astro';
---
<BaseLayout
  title="Romarjo Balukja — Senior Software Engineer"
  description="Senior software engineer with 7+ years building production web applications end to end — React and Django, through Kubernetes and GitOps."
>
  <main>
    <Hero />
    <section id="projects" class="section">
      <div class="container">
        <h2>Selected work</h2>
      </div>
    </section>
    <Skills />
    <ExperienceTimeline />
  </main>
</BaseLayout>

<style>
  #projects h2 {
    font-size: 1.375rem;
  }
</style>
```

- [ ] **Step 7: Run tests to verify green**

Run: `npx playwright test`
Expected: ALL PASS. Note: `smoke.spec.ts` asserts `h1` contains "Romarjo Balukja" — the hero h1 is now "I build products end to end." **Update `tests/smoke.spec.ts`** to:

```ts
await expect(page.locator('h1')).toContainText('I build products end to end.');
```

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/Hero.astro src/components/Skills.astro src/components/ExperienceTimeline.astro src/pages/index.astro tests/home.spec.ts tests/smoke.spec.ts
git commit -m "feat: home hero, skills, and experience sections"
```

---

### Task 7: Project cards (Selected work)

**Files:**
- Create: `src/components/ProjectCard.astro`
- Create: `tests/projects.spec.ts`
- Modify: `src/pages/index.astro`, `tests/links.spec.ts`

- [ ] **Step 1: Write the failing tests — `tests/projects.spec.ts`**

```ts
import { test, expect } from '@playwright/test';
import { CANONICAL } from './links.spec';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders three project cards, lowest order featured full-width', async ({ page }) => {
  const cards = page.locator('#projects article');
  await expect(cards).toHaveCount(3);
  // order-driven, not slug-driven (spec §3.1): first card = order 1 = tenantiq
  await expect(cards.first()).toContainText('tenantiq');
  await expect(cards.first()).toHaveClass(/featured/);
});

test('every card shows bullets, stack chips, and a case-study link', async ({ page }) => {
  const cards = page.locator('#projects article');
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await expect(card.locator('ul li').first()).toBeVisible();
    await expect(card.locator('.chip').first()).toBeVisible();
    await expect(card.locator('a[href^="/projects/"]')).toBeVisible();
  }
});

test('cards render thumbnail or monogram fallback (both states valid)', async ({ page }) => {
  const cards = page.locator('#projects article');
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    const hasVisual =
      (await card.locator('img.thumb').count()) + (await card.locator('.monogram').count());
    expect(hasVisual).toBe(1);
  }
});

test('public projects link out; vetapp does not', async ({ page }) => {
  const projects = page.locator('#projects');
  await expect(projects.locator(`a[href="${CANONICAL.tenantiqGithub}"]`)).toBeVisible();
  await expect(projects.locator(`a[href="${CANONICAL.uiKitGithub}"]`)).toBeVisible();
  await expect(projects.locator(`a[href="${CANONICAL.storybook}"]`)).toBeVisible();
  const vetappCard = projects.locator('article', { hasText: 'vetapp' });
  await expect(vetappCard.locator('a[href*="github.com"]')).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/projects.spec.ts`
Expected: FAIL — no `article` elements in `#projects`.

- [ ] **Step 3: Write `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
  featured?: boolean;
}

const { project, featured = false } = Astro.props;
const { title, bullets, stack, thumbnail, links } = project.data;
---
<article class:list={['card', { featured }]}>
  {thumbnail ? (
    <img class="thumb" src={thumbnail} alt={`${title} screenshot`} />
  ) : (
    <div class="monogram" aria-hidden="true">{title.charAt(0)}</div>
  )}
  <div class="body">
    <h3>{title}</h3>
    <ul>
      {bullets.map((b) => <li>{b}</li>)}
    </ul>
    <div class="chips">
      {stack.map((s) => <span class="chip">{s}</span>)}
    </div>
    <div class="links">
      <a class="fancy-link" href={`/projects/${project.id}/`}>Case study &rarr;</a>
      {links?.github && (
        <a class="fancy-link" href={links.github} rel="noopener">GitHub &nearr;</a>
      )}
      {links?.live && (
        <a class="fancy-link" href={links.live} rel="noopener">{links.liveLabel} &nearr;</a>
      )}
    </div>
  </div>
</article>

<style>
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: transform var(--dur) ease, box-shadow var(--dur) ease,
      border-color var(--dur) ease;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
    border-color: #d8d5cc;
  }
  .thumb,
  .monogram {
    height: 150px;
    width: 100%;
    object-fit: cover;
    object-position: top;
  }
  .monogram {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--chip-bg);
    color: var(--accent);
    font-family: var(--font-serif);
    font-size: 3rem;
    font-weight: 700;
  }
  .body {
    padding: 1.1rem 1.25rem 1.25rem;
  }
  h3 {
    font-size: 1.05rem;
    margin-bottom: 0.4rem;
  }
  ul {
    margin: 0 0 0.75rem;
    padding-left: 1.1rem;
    color: var(--ink-soft);
    font-size: 0.85rem;
  }
  li {
    margin-bottom: 0.2rem;
  }
  .chips {
    margin-bottom: 0.85rem;
  }
  .chip {
    display: inline-block;
    background: var(--chip-bg);
    color: var(--ink-soft);
    font-size: 0.7rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    margin: 0 0.25rem 0.25rem 0;
  }
  .links {
    display: flex;
    gap: 1rem;
  }
</style>
```

- [ ] **Step 4: Fill the projects section in `src/pages/index.astro`**

Replace the placeholder `#projects` section; add the imports and collection query to the frontmatter:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/Hero.astro';
import ProjectCard from '../components/ProjectCard.astro';
import Skills from '../components/Skills.astro';
import ExperienceTimeline from '../components/ExperienceTimeline.astro';

const projects = (await getCollection('projects')).sort(
  (a, b) => a.data.order - b.data.order
);
const [featured, ...rest] = projects;
---
<BaseLayout
  title="Romarjo Balukja — Senior Software Engineer"
  description="Senior software engineer with 7+ years building production web applications end to end — React and Django, through Kubernetes and GitOps."
>
  <main>
    <Hero />
    <section id="projects" class="section">
      <div class="container">
        <h2>Selected work</h2>
        <p class="sub">Each opens a full case study.</p>
        <ProjectCard project={featured} featured />
        <div class="pair">
          {rest.map((p) => <ProjectCard project={p} />)}
        </div>
      </div>
    </section>
    <Skills />
    <ExperienceTimeline />
  </main>
</BaseLayout>

<style>
  #projects h2 {
    font-size: 1.375rem;
    margin-bottom: 0.25rem;
  }
  .sub {
    color: var(--ink-faint);
    font-size: 0.85rem;
    margin-bottom: 1.5rem;
  }
  #projects :global(.featured) {
    margin-bottom: 1rem;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 640px) {
    .pair {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 5: Run tests to verify green**

Run: `npx playwright test`
Expected: ALL PASS (projects, home, links, smoke).

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectCard.astro src/pages/index.astro tests/projects.spec.ts
git commit -m "feat: order-driven project cards with monogram fallback"
```

---

### Task 8: Case-study pages

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`, `src/pages/projects/[id].astro`
- Modify: `tests/projects.spec.ts`

- [ ] **Step 1: Add the failing tests — append to `tests/projects.spec.ts`**

```ts
const CASE_STUDIES = ['/projects/tenantiq/', '/projects/react-ui-kit/', '/projects/vetapp/'];

for (const path of CASE_STUDIES) {
  test(`case study ${path} loads with header`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.tagline')).toBeVisible();
    await expect(page.locator('.chip').first()).toBeVisible();
  });
}

test('vetapp case study shows private note, no repo links', async ({ page }) => {
  await page.goto('/projects/vetapp/');
  await expect(page.locator('main')).toContainText('Private production codebase');
  await expect(page.locator('main a[href*="github.com/rbalukja15/vetapp"]')).toHaveCount(0);
});

test('tenantiq case study links to its repo', async ({ page }) => {
  await page.goto('/projects/tenantiq/');
  await expect(page.locator(`main a[href="${CANONICAL.tenantiqGithub}"]`)).toBeVisible();
});
```

Note these tests use `test.beforeEach` from Step 1 of Task 7 only where defined — the new tests navigate explicitly, so move the existing `test.beforeEach` into a `test.describe('home cards', ...)` block wrapping the four Task 7 tests, and leave the new case-study tests outside it:

```ts
test.describe('home cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });
  // ...the four Task 7 tests move inside here unchanged...
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx playwright test tests/projects.spec.ts`
Expected: home-card tests PASS, case-study tests FAIL with 404s.

- [ ] **Step 3: Write `src/layouts/CaseStudyLayout.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import BaseLayout from './BaseLayout.astro';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { title, tagline, context, stack, links, isPrivate } = project.data;
---
<BaseLayout title={`${title} — Romarjo Balukja`} description={tagline}>
  <main class="container">
    <header class="cs-header">
      <p class="kicker">Case study</p>
      <h1>{title}</h1>
      <p class="tagline">{tagline}</p>
      <p class="context">{context}</p>
      <div class="chips">
        {stack.map((s) => <span class="chip">{s}</span>)}
      </div>
      <div class="links">
        {links?.github && <a class="fancy-link" href={links.github} rel="noopener">GitHub &nearr;</a>}
        {links?.live && <a class="fancy-link" href={links.live} rel="noopener">{links.liveLabel} &nearr;</a>}
        {isPrivate && <span class="private-note">Private production codebase</span>}
      </div>
    </header>
    <article class="prose">
      <slot />
    </article>
  </main>
</BaseLayout>

<style>
  main {
    padding-top: 3rem;
    padding-bottom: 3.5rem;
  }
  .cs-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 1.75rem;
    margin-bottom: 1.75rem;
  }
  h1 {
    font-size: clamp(1.75rem, 4vw, 2.25rem);
  }
  .tagline {
    color: var(--ink-soft);
    font-size: 1.05rem;
    margin-bottom: 0.25rem;
  }
  .context {
    color: var(--ink-faint);
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }
  .chips {
    margin-bottom: 1rem;
  }
  .chip {
    display: inline-block;
    background: var(--chip-bg);
    color: var(--ink-soft);
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    margin: 0 0.3rem 0.3rem 0;
  }
  .links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .private-note {
    color: var(--ink-faint);
    font-size: 0.8125rem;
    font-style: italic;
  }
  .prose :global(h2) {
    font-size: 1.25rem;
    margin: 2rem 0 0.6rem;
  }
  .prose :global(p),
  .prose :global(li) {
    color: var(--ink-soft);
    font-size: 0.95rem;
  }
  .prose :global(img) {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin: 1rem 0;
  }
</style>
```

- [ ] **Step 4: Write `src/pages/projects/[id].astro`**

Astro 6: route by `entry.id`; `render` is a named import from `astro:content`.

```astro
---
import { getCollection, render } from 'astro:content';
import CaseStudyLayout from '../../layouts/CaseStudyLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { id: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---
<CaseStudyLayout project={project}>
  <Content />
</CaseStudyLayout>
```

- [ ] **Step 5: Run tests to verify green**

Run: `npx playwright test`
Expected: ALL PASS.

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/CaseStudyLayout.astro src/pages/projects tests/projects.spec.ts
git commit -m "feat: case-study pages rendered from the projects collection"
```

---

### Task 9: 404 page

**Files:**
- Create: `src/pages/404.astro`
- Create: `tests/quality.spec.ts`

- [ ] **Step 1: Write the failing test — `tests/quality.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('unknown path serves the 404 page', async ({ page }) => {
  const response = await page.goto('/definitely-not-a-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found.' })).toBeVisible();
  await expect(page.locator('main a[href="/"]')).toBeVisible();
});
```

(If `astro preview` returns 200 for this route on the installed 6.x patch, keep the two content assertions and drop the status assertion — GitHub Pages itself always returns 404 for `404.html` routes.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/quality.spec.ts`
Expected: FAIL — Astro's default 404 has no such heading.

- [ ] **Step 3: Write `src/pages/404.astro`** (spec §3.3)

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Page not found — Romarjo Balukja" description="This page doesn't exist.">
  <main class="container section">
    <h1>Page not found.</h1>
    <p>This page doesn&rsquo;t exist — but the work does. <a href="/">Back to the home page</a>.</p>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Run tests to verify green**

Run: `npx playwright test tests/quality.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/404.astro tests/quality.spec.ts
git commit -m "feat: 404 page"
```

---

### Task 10: SEO assets — sitemap, robots, favicon, OG image

**Files:**
- Create: `public/robots.txt`, `public/favicon.svg`, `scripts/og-template.html`, `scripts/generate-og.mjs`, `scripts/generate-favicon.mjs`
- Create (generated): `public/images/og.png`, `public/favicon.ico`
- Modify: `astro.config.mjs`, `package.json`, `tests/quality.spec.ts`

- [ ] **Step 1: Add the failing tests — append to `tests/quality.spec.ts`**

```ts
test('meta and OG tags on home', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Romarjo Balukja — Senior Software Engineer');
  const description = page.locator('meta[name="description"]');
  await expect(description).toHaveAttribute('content', /.{40,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://rbalukja15.github.io/images/og.png'
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image'
  );
});

test('meta tags on a case study', async ({ page }) => {
  await page.goto('/projects/tenantiq/');
  await expect(page).toHaveTitle(/tenantiq — Romarjo Balukja/);
});

for (const asset of [
  '/favicon.svg',
  '/favicon.ico',
  '/images/og.png',
  '/robots.txt',
  '/sitemap-index.xml',
]) {
  test(`asset ${asset} resolves`, async ({ request }) => {
    const response = await request.get(asset);
    expect(response.status()).toBe(200);
  });
}
```

- [ ] **Step 2: Run to verify the asset tests fail**

Run: `npx playwright test tests/quality.spec.ts`
Expected: meta tests PASS (BaseLayout already emits them); asset tests FAIL (404s).

- [ ] **Step 3: Install sitemap integration and icon tooling**

Run: `npm install @astrojs/sitemap@^3.7.3`
Run: `npm install --save-dev png-to-ico@^3.0.2`

- [ ] **Step 4: Update `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://rbalukja15.github.io',
  integrations: [sitemap()],
});
```

- [ ] **Step 5: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://rbalukja15.github.io/sitemap-index.xml
```

- [ ] **Step 6: Write `public/favicon.svg`** (RB monogram, spec §7)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#1d4ed8"/>
  <text x="32" y="43" font-family="Georgia, 'Times New Roman', serif" font-size="26" font-weight="700" fill="#faf9f6" text-anchor="middle">RB</text>
</svg>
```

- [ ] **Step 7: Write `scripts/og-template.html`** (typographic card, spec §7 — no screenshots; Georgia stands in for Fraunces since the file:// page can't load the bundled font)

```html
<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0">
  <div style="width:1200px;height:630px;background:#faf9f6;display:flex;flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
    <div style="font-size:22px;font-weight:600;letter-spacing:4px;color:#1d4ed8;margin-bottom:20px;">SENIOR SOFTWARE ENGINEER &middot; FULL-STACK &amp; DEVOPS</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:88px;font-weight:600;color:#111214;line-height:1.1;">Romarjo Balukja</div>
    <div style="font-size:30px;color:#55575c;margin-top:24px;">I build products end to end.</div>
    <div style="position:absolute;bottom:56px;left:96px;font-size:22px;color:#8a8d93;">rbalukja15.github.io</div>
  </div>
</body>
</html>
```

- [ ] **Step 8: Write `scripts/generate-og.mjs`**

```js
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
```

- [ ] **Step 9: Write `scripts/generate-favicon.mjs`**

```js
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
```

- [ ] **Step 10: Generate both assets**

Run: `node scripts/generate-og.mjs`
Expected: `Wrote .../public/images/og.png` — open it and eyeball: name legible, nothing clipped.

Run: `node scripts/generate-favicon.mjs`
Expected: `Wrote public/favicon.ico`

- [ ] **Step 11: Run tests to verify green**

Run: `npx playwright test`
Expected: ALL PASS, including all five asset tests (sitemap-index.xml is emitted by the build the webServer runs).

- [ ] **Step 12: Commit (generated assets are committed — they're stable outputs, not build artifacts)**

```bash
git add astro.config.mjs package.json package-lock.json public/robots.txt public/favicon.svg public/favicon.ico public/images/og.png scripts tests/quality.spec.ts
git commit -m "feat: sitemap, robots, favicon, and OG preview image"
```

---

### Task 11: Motion — Reveal wrapper + console-error gate

**Files:**
- Create: `src/components/Reveal.astro`
- Modify: `src/pages/index.astro`, `tests/quality.spec.ts`

- [ ] **Step 1: Add the failing tests — append to `tests/quality.spec.ts`**

```ts
const ALL_PAGES = ['/', '/projects/tenantiq/', '/projects/react-ui-kit/', '/projects/vetapp/'];

for (const path of ALL_PAGES) {
  test(`no console errors on ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
}

test('home sections reveal on scroll', async ({ page }) => {
  await page.goto('/');
  const skills = page.locator('#skills');
  await skills.scrollIntoViewIfNeeded();
  await expect(skills.locator('.reveal').first()).toHaveClass(/is-visible/);
});

test('reduced motion shows everything without scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  // CSS force-shows .reveal under reduced motion; content must be readable immediately
  await expect(page.locator('#experience .reveal').first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify the reveal tests fail**

Run: `npx playwright test tests/quality.spec.ts`
Expected: console-error tests PASS; the two reveal tests FAIL (no `.reveal` elements exist).

- [ ] **Step 3: Write `src/components/Reveal.astro`**

Astro dedupes and bundles component `<script>`s — this is the site's single piece of JavaScript (spec §4).

```astro
---
---
<div class="reveal">
  <slot />
</div>

<script>
  const els = document.querySelectorAll('.reveal');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
  }
</script>
```

- [ ] **Step 4: Wrap home section contents in `src/pages/index.astro`**

Home only (spec §4 — case studies stay static). Import and wrap the *inner content* of the projects/skills/experience sections. In `index.astro`, add the import and wrap:

```astro
import Reveal from '../components/Reveal.astro';
```

```astro
    <section id="projects" class="section">
      <div class="container">
        <Reveal>
          <h2>Selected work</h2>
          <p class="sub">Each opens a full case study.</p>
          <ProjectCard project={featured} featured />
          <div class="pair">
            {rest.map((p) => <ProjectCard project={p} />)}
          </div>
        </Reveal>
      </div>
    </section>
```

And inside `Skills.astro` / `ExperienceTimeline.astro`, wrap each component's `.container` contents the same way (add `import Reveal from './Reveal.astro';` to each and wrap the children of the `.container` div in `<Reveal>...</Reveal>`).

The hero stays unwrapped — it's above the fold; fading it in on load delays the first impression.

- [ ] **Step 5: Run tests to verify green**

Run: `npx playwright test`
Expected: ALL PASS.

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Reveal.astro src/components/Skills.astro src/components/ExperienceTimeline.astro src/pages/index.astro tests/quality.spec.ts
git commit -m "feat: scroll-reveal motion with reduced-motion support"
```

---

### Task 12: CI/CD and go-live

⚠️ **This task publishes: it creates a PUBLIC GitHub repo and puts the site on the open internet.** All prior tasks are local-only.

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

withastro/action@v6 rebuilds the site itself inside the build job (it cannot consume the test job's build — the duplicate build is the accepted pattern). It requires the committed `package-lock.json`.

```yaml
name: Test and Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Astro type/content check
        run: npx astro check
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Run Playwright smoke tests
        run: npx playwright test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

(No separate `astro build` step in the test job — `playwright test`'s webServer runs the build.)

- [ ] **Step 2: Commit the workflow**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: test gate + GitHub Pages deploy"
```

- [ ] **Step 3: Create the public GitHub repo and push**

Run:
```bash
gh repo create rbalukja15.github.io --public --source=. --remote=origin --push
```
Expected: repo created at github.com/rbalukja15/rbalukja15.github.io, `main` pushed. (User-site repos MUST be public on the free plan and MUST be named exactly `rbalukja15.github.io`.)

- [ ] **Step 4: Enable Pages with source "GitHub Actions"**

Run:
```bash
gh api repos/{owner}/{repo}/pages \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -f build_type=workflow
```
Expected: JSON response with `"build_type": "workflow"`. If it returns HTTP 409 (already enabled), rerun with `--method PUT`.

Verify: `gh api repos/{owner}/{repo}/pages --jq '{build_type, html_url, status}'`

- [ ] **Step 5: Watch the first deploy**

Run: `gh run watch --exit-status`
Expected: test → build → deploy all green. If the push in Step 3 ran before Pages was enabled, re-trigger: `gh workflow run deploy.yml` (then watch again).

- [ ] **Step 6: Verify the live site**

Run: `curl -s -o /dev/null -w "%{http_code}" https://rbalukja15.github.io/`
Expected: `200`

Run: `curl -s -o /dev/null -w "%{http_code}" https://rbalukja15.github.io/Romarjo_Balukja_CV.pdf`
Expected: `200`

---

### Task 13: Content track — real case-study copy (USER REVIEW CHECKPOINT)

**Files:**
- Modify: `src/content/projects/tenantiq.md`, `src/content/projects/react-ui-kit.md`, `src/content/projects/vetapp.md`
- Modify (if needed after drafting): meta descriptions in `src/pages/index.astro`

Source materials (spec §9): `~/Desktop/tenantiq`, `~/Desktop/react-ui-kit` + its Storybook, `~/Desktop/vetapp`, and `public/Romarjo_Balukja_CV.pdf`.

- [ ] **Step 1: Read each source repo** — README, top-level structure, and the most interesting modules (tenantiq: tenancy/RAG pipeline; react-ui-kit: theming + a representative component + Storybook stories; vetapp: inventory/billing domain, the Playwright e2e suites). Take notes per §3.2 template section.

- [ ] **Step 2: Rewrite the three Markdown bodies** — replace every `<!-- Task 13 ... -->` skeleton. Rules: sections follow the §3.2 template exactly; 80–150 words per section; concrete over adjectival ("tenant isolation enforced in the vector store" not "robust architecture"); vetapp and the e-ticketing employer stay anonymous (spec §11); no client-identifying details; screenshots referenced only if the files exist under `public/images/`.

- [ ] **Step 3: Verify nothing broke**

Run: `npm run check && npx playwright test`
Expected: 0 errors, all tests pass (copy changes can't break structure — this catches accidental frontmatter edits).

- [ ] **Step 4: Commit the draft**

```bash
git add src/content/projects
git commit -m "content: full case-study drafts for all three projects"
```

- [ ] **Step 5: 🛑 USER REVIEW CHECKPOINT — do not push.** Present all three case studies and the home/hero/meta copy to the user for review. Apply their edits, re-run `npx playwright test`, commit as `content: apply user copy edits`, then `git push`.

---

### Task 14: Launch checklist (manual, after user approves copy)

- [ ] **Step 1: Manual Lighthouse audit (spec §1/§8)** — Chrome DevTools → Lighthouse, **mobile preset, default throttling**, against the live URLs: `/`, all three `/projects/...`, `/404` (navigate to a bogus path). Required: ≥ 95 on Performance, Accessibility, Best Practices, SEO for every page. Fix and redeploy if any category dips (usual culprits: image sizes, missing alt text, contrast).

- [ ] **Step 2: Link-preview check** — paste `https://rbalukja15.github.io` into a LinkedIn draft post (don't publish): title, description, and the OG card must render. LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/) works too.

- [ ] **Step 3: Real-device pass** — open the site on a phone: mobile nav shows name + CV only, cards stack single-column, CV opens in a viewer.

- [ ] **Step 4: Screenshot slot-in (whenever the user supplies them; vetapp = demo data only)** — drop files in `public/images/`, add `thumbnail: /images/<name>.png` to the project frontmatter, embed `![...](/images/<name>.png)` figures in the case-study bodies, run `npx playwright test` (the both-states card test keeps passing), commit, push.

---

## Deviations & escalation

Follow the plan as written. If an installed version's behavior contradicts a step (e.g. `astro preview`'s 404 status), the plan says how to adapt in place. For anything bigger — a dependency that won't install, a spec conflict — stop and surface it rather than improvising.
