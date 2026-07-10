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

Across client projects I kept rebuilding the same pieces — confirmation dialogs, empty states, loading skeletons — each time slightly different, each time re-plumbing the same open/close state and re-deriving the same styling. And stock MUI, left unthemed, makes every product look like the same template. react-ui-kit is the extraction: the primitives I actually reuse, packaged behind one design language, typed strictly, and documented where anyone can click through them.

## What I built

A scoped npm package on MUI 5 with a deliberate, small surface: a `ConfirmDialog` driven by a promise-based `useConfirm()` hook (`if (await confirm({...}))` — no open-state plumbing at call sites), `EmptyState`, `TableSkeleton`, `FloatingCreateButton`, a generic `useDebouncedValue<T>` hook, and a `ThemeModeProvider` with a light/dark toggle. The heart is a ~300-line theme factory: warm tinted neutrals instead of pure white/black, a muted teal brand axis, editorial serif headings (Newsreader) over Inter body text, and tonal chips that render as pale tints with strong foregrounds rather than MUI's vivid default blocks. Every component ships with stories in a Storybook that CI deploys to GitHub Pages, including a design-token showcase page.

## Architecture decisions

Every component is decoupled from routing, stores, and APIs — the library takes an optional `LinkComponent` prop, so the same button works with Next.js, react-router, or a plain anchor. Cross-cutting styling lives in MUI component overrides inside the theme, not per-instance `sx`, so consumers get the design language without opting in at each call site. The package builds with tsup to dual ESM + CJS with type declarations, sourcemaps, and `sideEffects: false` for tree-shaking; TypeScript runs at maximum strictness (`strict` plus `noUncheckedIndexedAccess`). The scope is intentionally small — version 0.1.0 with a written porting roadmap for pickers and form adapters — rather than a kitchen sink of half-finished widgets.

## Testing & quality

Vitest with React Testing Library, asserting behavior through accessible roles (`getByRole('button', { name: ... })`) rather than implementation details — the confirm dialog is tested through its provider exactly as a consumer would use it. CI gates every push and PR on lint, typecheck, tests, and a production build; the Storybook deploy runs only from main.

## Outcome

A published library with a live Storybook, serving as both a working toolkit for client projects and a standing sample of how I design component APIs: typed generics, promise-based imperative surfaces where they beat prop drilling, and framework-agnostic composition. The design system it showcases is the same visual language you are reading right now — this portfolio deliberately does not use the library, so each can be judged on its own.
