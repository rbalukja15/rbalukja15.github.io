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

After a few client projects I noticed I was rebuilding the same things every time: a confirm dialog, an empty state, a table skeleton. Each version slightly different, each one dragging its own open/close state around. I had also gotten tired of products that look like default MUI. So I pulled the pieces I actually reuse into a package and gave them one visual language.

## What I built

A small npm package on top of MUI 5. The component I use most is the ConfirmDialog: you call `await confirm({...})` and get back true or false, with no dialog state in your component at all. Around it: EmptyState, TableSkeleton, FloatingCreateButton, a typed `useDebouncedValue` hook, and a theme provider with a light/dark toggle. Most of the design work went into the theme itself — warm off-whites instead of pure white, a muted teal, serif headings (Newsreader) over Inter body text, and chips that render as soft tints instead of MUI's loud solid blocks. Everything has a story, and CI publishes the Storybook to GitHub Pages so you can click through the real components.

## Architecture decisions

Nothing in the library knows about routing, state management, or any API. Components that link somewhere take a `LinkComponent` prop, so they work with Next.js, react-router, or a plain anchor. Styling lives in the MUI theme overrides rather than sprinkled per-instance, so a consumer gets the whole look by wrapping their app once. It builds to ESM and CJS with tsup, ships type declarations, and tree-shakes. TypeScript runs on the strictest settings, including `noUncheckedIndexedAccess`. It's version 0.1.0 on purpose: four components I trust and a written roadmap for the next ones, instead of thirty half-done widgets.

## Testing & quality

Vitest and React Testing Library. Tests find elements by accessible role, the way a user would, and the dialog is tested through its provider the way a real consumer mounts it. CI won't pass without lint, typecheck, tests, and a clean build; the Storybook deploy only runs from main.

## Outcome

Published, documented, and in use in my own client work. One note: this portfolio doesn't use it. The site and the library share a design sensibility, but I wanted each to stand on its own.
