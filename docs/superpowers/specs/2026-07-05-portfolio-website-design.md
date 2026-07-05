# Portfolio Website — Design Spec

- **Date:** 2026-07-05
- **Status:** Draft v2 (multi-lens self-review applied) — awaiting user review
- **Owner:** Romarjo Balukja (romarjo.balukja@gmail.com, github.com/rbalukja15)

## 1. Purpose & audience

A personal portfolio site whose primary audience is **recruiters and employers**. It must let a technical or non-technical reviewer, in under a minute, understand who Romarjo is, see credible evidence of his work, and grab his CV or contact him. English only.

**Success criteria**

- From the landing view, the CV download and the strongest project (tenantiq, see §3.1) are each at most one click away.
- Lighthouse scores ≥ 95 on Performance, Accessibility, Best Practices, and SEO for all pages — verified by a **manual Lighthouse audit (mobile preset, default throttling) against the deployed production site before declaring v1 done**. Not a CI gate; Lighthouse CI is explicitly deferred (§8).
- Pasting the site URL into LinkedIn/Slack/email produces a proper title, description, and preview image.
- Site deploys automatically on push to `main` with quality gates in front of the deploy.

## 2. Scope

**In scope (v1):** one-pager home, three project case-study pages, CV download, 404 page, CI/CD to GitHub Pages, SEO/OpenGraph, Playwright smoke tests.

This is **one implementation plan for one developer**, sequenced as two separable tracks so human checkpoints never block the build: **(a) build track** — scaffold, tokens, components, CI/deploy; **(b) content track** — copy drafting, user approval, screenshots/assets (§9).

**Out of scope (v1), recorded as deliberate decisions:**

- Blog / writing section (user opted out — upkeep burden).
- Albanian translation / i18n (English only; target audience is international employers).
- Dark-mode toggle (light-first editorial design; tokens make this a clean later add).
- Analytics, contact form (footer uses `mailto:` and profile links).
- Building the site with react-ui-kit (user chose custom design; the library is showcased as a project instead).
- A secondary grid of older/smaller repos (only the three featured projects).
- Lighthouse CI and per-page OG images (single shared OG image in v1).

## 3. Site structure

Approved structure: **one-pager home + a case-study page per project**.

```
/                       Home (single scroll page)
/projects/tenantiq/     Case study
/projects/react-ui-kit/ Case study
/projects/vetapp/       Case study
/404                    Not-found page
/Romarjo_Balukja_CV.pdf Served from site root (public/)
```

### 3.1 Home page, top to bottom

1. **Nav** — name (left), anchor links to Projects / Skills / Experience, and a solid **Download CV** button (right). Sticky. **Shared across every page** (home, case studies, 404) via BaseLayout: section links are root-absolute (`/#projects`, `/#skills`, `/#experience`) so they work from any page; the name links to `/`. **Mobile (≤ 640px): the nav shows name + Download CV only; section links are hidden — no hamburger, no extra JavaScript.** The CV link is a plain link (`target="_blank"`, no `download` attribute — recruiters preview first; the descriptive filename governs manual saves).
2. **Hero** — kicker "SENIOR SOFTWARE ENGINEER · FULL-STACK & DEVOPS" (matches CV title), large serif headline ("I build products end to end." or refined equivalent), 2-line intro that mentions 7+ years and end-to-end ownership *including deployment* (Kubernetes / ArgoCD / GitLab CI is a differentiator, not just React + Django).
3. **Selected work** — three **rich cards** (approved treatment): screenshot thumbnail on top, project name, 2–3 "what it does" capability bullets, stack chips, links. **Layout is purely `order`-driven: the card with the lowest `order` renders full-width; the next two render side by side** (stacking to one column on mobile). tenantiq is `order: 1` — no slug-based special-casing. Every card links to its case study; public projects additionally link out per the canonical URL table (§9.1).
4. **Skills** — grouped rows sourced from the CV, no progress bars or percentages: Frontend / Backend / Data & Databases / DevOps & Cloud / Auth & Identity / Testing.
5. **Experience** — compact timeline, five entries; one line of role + one line of context each. **The order below is authoritative; `src/data/experience.ts` hardcodes entries in exactly this order and components render the array as-is (no runtime sorting):**
   - Senior Software Engineer — public-transport e-ticketing company (kept anonymous, as in the CV), Jan 2023–present
   - Software Development Engineer — freelance / long-term clients (bakery & food-retail SaaS, Moneyfarm, geolocation platform), Oct 2018–2023
   - Software Development Engineer — Division5, Sep 2020–Apr 2022
   - Software Development Engineer — BinaryTree, Inc., Nov 2019–Apr 2020
   - Software Development Engineer — Kreatx, Apr 2019–Apr 2020
6. **Footer / contact** — "Let's talk." + email, GitHub, LinkedIn, and the CV link again (URLs in §9.1).

### 3.2 Case-study page template

Identical structure for all three projects, rendered from Markdown:

1. **Header** — title, tagline, one-line role/context (the `context` frontmatter field), stack chips, links. Public repos get GitHub/live links; vetapp gets a "Private production codebase" note instead.
2. **Problem** — what the product solves, for whom.
3. **What I built** — features, with screenshots where available. **Case studies may ship prose-only; screenshots slot in later without layout changes** (§9).
4. **Architecture decisions** — the interesting technical choices and trade-offs.
5. **Testing & quality** — concrete practices (e2e coverage, CI gates), a genuine differentiator for vetapp.
6. **Outcome** — state of the project, what it demonstrates.

The template is chosen to flatter private work: vetapp (and the CV's private client stories) can't show code, but can show product thinking, architecture, and discipline.

### 3.3 404 page

Same BaseLayout (nav + footer), a serif headline ("Page not found."), one line of copy, and a link home. No special design. Served automatically by GitHub Pages as `404.html`.

## 4. Visual design

Approved direction: **minimal editorial** with **polished micro-interactions**.

- **Palette:** warm off-white background (`#faf9f6` family), near-black text (`#111214`), one restrained blue accent (`#1d4ed8` family), warm gray borders/surfaces. Exact values become CSS custom properties during implementation.
- **Typography:** self-hosted display serif for headlines — **Fraunces via `@fontsource`, static weights 600 and 700 only, latin subset, woff2, `font-display: swap`** (Georgia fallback); system sans stack for body text. No external font CDNs, no variable font (weight files are smaller and Performance ≥ 95 is a success criterion).
- **Theme:** light only in v1. All colors flow through CSS custom properties so a dark toggle is a later additive change, not a refactor.
- **Motion (approved level: "polished micro-interactions"):**
  - Card hover: lift (`translateY`) + soft shadow via CSS transitions.
  - Link hover: animated underline (scaleX transform).
  - Scroll: **home-page sections only** fade up on first reveal, driven by one small vanilla-JS `IntersectionObserver` — the only JavaScript on the site. Case-study pages render fully static (prose shouldn't gate reading on scroll animation).
  - All motion is disabled under `prefers-reduced-motion: reduce`.
  - No animation libraries, no parallax, no gradient/3D effects (explicitly considered and rejected in favor of restraint).

## 5. Architecture

- **Framework:** **Astro 6 (current stable line, 6.2 as of April 2026)** + TypeScript, static output (default). npm as package manager. **CI must use Node ≥ 22.12 (Astro 6 minimum).**
- **Styling:** no UI framework. One global stylesheet defining design tokens (colors, type scale, spacing) as CSS custom properties + Astro scoped styles per component.
- **Repo:** public GitHub repo named **`rbalukja15.github.io`** (GitHub "user site"), so the portfolio serves from the root URL `https://rbalukja15.github.io`. The existing Storybook *project page* at `/react-ui-kit` is a separate repo and is unaffected. **Current state: the repo exists locally at `~/Desktop/rbalukja15.github.io` containing only `docs/` (this spec); the GitHub remote does not exist yet — creating it and enabling Pages is part of the implementation plan. The Astro project is scaffolded into the existing repo root, preserving `docs/` (excluded from the site build).**

### 5.1 Content model

Content lives as data so updating the portfolio never means editing components.

- `src/content/projects/{tenantiq,react-ui-kit,vetapp}.md` — one file per project. **The collection is explicitly defined in `src/content.config.ts` using the Content Layer `glob()` loader (Astro 6 removed legacy implicit collections); entries are addressed by `id` and rendered via `render(entry)`.** Typed frontmatter (zod v4 syntax — note `z.url()`, not `z.string().url()`):

  ```ts
  {
    title: string,
    tagline: string,            // one-liner under the name
    context: string,            // one-line role/context for the case-study header
    bullets: string[],          // 2–3 capability bullets for the home card
    stack: string[],            // chip labels
    thumbnail?: string,         // path under /images; ABSENT → card renders the
                                //   monogram tile (project initial, accent blue on
                                //   off-white). No placeholder image files committed.
    order: number,              // card ordering on home; lowest = full-width card
    links?: { github?: url, live?: url },  // omitted entirely for vetapp
    isPrivate: boolean,         // renders "Private production codebase" note
  }
  ```

  The Markdown body is the case study itself (sections of §3.2).

- `src/data/skills.ts` — `{ group: string, items: string[] }[]`, seeded from the CV's six skill groups.
- `src/data/experience.ts` — `{ role, org, period, line }[]`, the five entries of §3.1 in that exact order.
- `public/Romarjo_Balukja_CV.pdf` — **already committed to the repo** (source: user's CV, 2026-07 version). Descriptive filename kept so the download saves meaningfully on a recruiter's machine.
- `public/images/` — project screenshots and the OG preview image (`og.png`).

### 5.2 Pages, layouts, components

- **Layouts:** `BaseLayout.astro` (HTML head, meta/OG tags, fonts, global CSS, shared nav + footer on every page), `CaseStudyLayout.astro` (case-study header + prose styling, consumes project frontmatter).
- **Pages:** `index.astro`, `projects/[slug].astro` (static paths from the projects collection, routed by entry `id`), `404.astro`.
- **Components:** `Nav`, `Hero`, `ProjectCard`, `Skills`, `ExperienceTimeline`, `Footer`, `Reveal` (the IntersectionObserver fade-up wrapper, used on home only).

Each component consumes typed props/collection data only — no component reaches into another's internals.

## 6. Deployment & operations

- **CI/CD:** GitHub Actions on push to `main` (Node ≥ 22.12):
  1. Quality gates — **exactly these three, nothing else in v1:** `astro check` (type/prop errors), production build, Playwright smoke suite against the built output (`astro preview`).
  2. Deploy: official `withastro/action` → GitHub Pages (Actions-based Pages deployment, not a gh-pages branch).
- **Pages configuration:** after creating the GitHub repo, Settings → Pages → Source: GitHub Actions. Site serves at the apex of `https://rbalukja15.github.io` with no `base` path configuration needed.
- **Custom domain:** out of scope now; documented as a later 10-minute change (CNAME + Astro `site` config).

## 7. SEO & sharing

- Per-page `<title>` and meta description (home + each case study + 404). **This metadata is part of the drafted copy (§9): Claude drafts it, the user reviews it, and the employer-anonymity rule (§11) applies to it — including OG descriptions.**
- OpenGraph + Twitter card tags. **One shared preview image for all pages in v1: a typographic card (1200×630) built from the site's own design tokens — name, "SENIOR SOFTWARE ENGINEER · FULL-STACK & DEVOPS" kicker in Fraunces, site URL, on the off-white palette; no screenshots. Created by the implementer, committed as `public/images/og.png`, reviewed by the user with the copy. Not a user-blocking input.**
- `@astrojs/sitemap` integration + `robots.txt`.
- **Favicon: "RB" monogram SVG in the accent blue, derived from the same tokens, plus fallback ICO. Created by the implementer.**
- `site: 'https://rbalukja15.github.io'` set in `astro.config.mjs` (required for correct sitemap/OG URLs).

## 8. Quality gates & testing

Meaningful checks only — each asserts something a recruiter-facing site actually needs:

- **`astro check`** — catches type errors in frontmatter/props (guards the content schema).
- **Production build** — a broken build never deploys.
- **Playwright smoke suite** (runs against the built site in CI and locally; **must pass both with and without thumbnails present**, per the §5.1 fallback):
  1. Home renders all six sections (nav, hero, selected work, skills, experience, footer).
  2. Each of the three case-study pages loads with a 200 and renders its header.
  3. The Download CV link resolves to a PDF (200 + `application/pdf`).
  4. External links on home match the canonical URL table (§9.1) **exactly** (presence + href equality; no network calls to third parties in CI).
  5. No console errors on home or case-study pages.
  6. A request to an unknown path serves the 404 page content.
- **Lighthouse:** manual audit (mobile preset, default throttling) of every page against the deployed production site before v1 is declared done — targets ≥ 95 on all four categories (§1). **Not a CI gate; Lighthouse CI is deferred.** This audit is also the v1 accessibility verification, on top of the build-time floor: semantic landmarks, single `h1` per page, alt text on all screenshots, visible focus states, `prefers-reduced-motion` respected.

## 9. Content plan & prerequisites

Claude drafts all copy — hero, card bullets, case studies, experience one-liners, **and all page titles / meta descriptions / OG text (§7)** — from the source materials below; the user reviews and edits. Copy approval is a content-track checkpoint and never blocks the build track (§2).

**Source materials (everything the planner needs, no conversation context required):**

| Source | Location |
|---|---|
| CV (single source of truth for skills/experience) | `public/Romarjo_Balukja_CV.pdf` in this repo |
| tenantiq | `~/Desktop/tenantiq` + https://github.com/rbalukja15/tenantiq |
| react-ui-kit | `~/Desktop/react-ui-kit` + https://github.com/rbalukja15/react-ui-kit + live Storybook (§9.1) |
| vetapp | `~/Desktop/vetapp` (private production codebase — describe without client-identifying detail) |

**Prerequisites & owners:**

| Input | Owner | Status / rule |
|---|---|---|
| CV PDF | user | ✅ Committed at `public/Romarjo_Balukja_CV.pdf` |
| tenantiq screenshots (2–3) | user | ⬜ Wanted for content-completeness — **not a launch blocker** |
| react-ui-kit screenshots (Storybook captures OK) | user | ⬜ Same rule |
| vetapp screenshots — **demo data only, no real client records** | user | ⬜ Same rule |
| OG preview image (`public/images/og.png`) | implementer | ⬜ Typographic card per §7; user reviews with copy |
| Favicon (SVG + ICO) | implementer | ⬜ RB monogram per §7 |
| Approval of drafted copy | user | ⬜ Content-track checkpoint |

**Launch rule for images:** all three case-study pages are published at launch regardless of screenshot availability — missing screenshots are simply omitted from the Markdown body (no inline placeholders in case studies). The monogram fallback (§5.1) applies **only** to home-card thumbnails. "Wanted for content-completeness" means the case study isn't final without them, not that the site can't ship.

### 9.1 Canonical external URLs

Both the project frontmatter and Playwright smoke test 4 assert these exact values:

| Link | URL |
|---|---|
| tenantiq — GitHub | `https://github.com/rbalukja15/tenantiq` |
| react-ui-kit — GitHub | `https://github.com/rbalukja15/react-ui-kit` |
| react-ui-kit — live Storybook | `https://rbalukja15.github.io/react-ui-kit/` |
| GitHub profile | `https://github.com/rbalukja15` |
| LinkedIn | `https://www.linkedin.com/in/romarjo-balukja` |
| Email | `mailto:romarjo.balukja@gmail.com` |
| CV | `/Romarjo_Balukja_CV.pdf` |

## 10. Decisions considered and rejected

| Decision | Chosen | Rejected alternatives | Why |
|---|---|---|---|
| Framework | Astro 6 | Next.js static export; Vite + React SPA | Content site needs ~zero JS; best Lighthouse for free; typed content collections; SPA has weak SEO on Pages |
| Hosting | GitHub Pages (user site) | Vercel, Netlify | Free, zero-ops, matches existing Storybook hosting; root URL is a clean personal address |
| Structure | One-pager + case-study pages | Single page only; classic multi-page | Private projects (vetapp) need case-study depth; recruiters still get the one-glance home |
| Style | Minimal editorial (light) | Dark developer; bold gradient | Reads senior and calm; ages well; user preference |
| Project cards | Rich cards (thumbnail + bullets) | Full-width showcase rows | User preference; keeps home compact while still showing what each project does |
| Effects level | Polished micro-interactions | Purely static; effect-heavy template look | Restraint signals seniority; near-perfect performance; reduced-motion friendly |
| UI library | Custom CSS | Dogfooding react-ui-kit; hybrid | Portfolio itself becomes the design showcase; no MUI look-alike constraint |
| Language | English only | English + Albanian | Target audience is international employers |
| Mobile nav | Name + CV only, links hidden | JS hamburger menu | Keeps the "one IntersectionObserver is the only JS" constraint; the one-pager scrolls anyway |
| Lighthouse enforcement | Manual pre-launch audit | Lighthouse CI gate | LHCI on shared runners is flaky; a 5-page static site doesn't need score CI in v1 |

## 11. Risks & mitigations

- **Copy drifts from CV** (site says one thing, PDF another) → single source rule: experience/skills data files are derived from the CV; updating the CV means updating `src/data/*` in the same commit.
- **Screenshot delays block launch** → launch rule in §9: pages ship, images land later; monogram fallback for home cards.
- **Current employer anonymity** — the e-ticketing employer is unnamed in the CV; the site must keep the same discretion everywhere, including page titles, meta/OG descriptions, and case-study prose that references platform work.
- **vetapp confidentiality** — screenshots only from a demo/seeded environment; case study describes architecture without client-identifying details.
