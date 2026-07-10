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

A working veterinary clinic ran on paper and spreadsheets: stock counted by hand, supplier debts tracked in notebooks, vaccination follow-ups remembered or forgotten. The front desk and the vets needed one system covering the whole operation — medical records, scheduling, inventory, purchasing, and billing — usable by a bilingual staff, reliable enough to run the business on daily.

## What I built

A full clinic-management platform: clients and pets with complete medical histories (vaccinations, antiparasite treatments, medications, illnesses), appointments with a calendar, invoicing with discounts, tax, PDF output and payment tracking, pack-aware inventory across twelve product categories with stock-take workflows, purchase orders with an append-only supplier ledger, per-user role-based access for admins, veterinarians, and reception, a full audit log, automated email reminders (tomorrow's appointments, vaccinations coming due, overdue invoices), global search, and CSV exports — in an English/Albanian bilingual UI. The system spans 22 Django models behind 22 REST viewsets and 26 Next.js pages.

## Architecture decisions

The domain logic lives where it can't be bypassed. Pack economics are modeled once: products carry both a stock unit and a supplier pack size, purchase receipts multiply through pack size, and invoice lines snapshot the pack size at creation so historical documents survive later product edits. Reminder jobs are idempotent — they filter on and set sent-flags, so a re-run never double-emails a client. The audit log hangs on model signals and denormalizes user and resource names into each entry, so history survives renames and account deactivation, with before/after diffs stored per change. Permissions are product capabilities (`invoices.create`, `inventory.edit`) granted per user rather than raw model CRUD, matching how a clinic actually delegates work. Auth uses JWT in httpOnly cookies with a rate-limited login.

## Testing & quality

This is the discipline showcase: 366 backend tests and 92 Playwright end-to-end tests across 32 specs that drive the real dockerized stack — logging in, filling forms, collecting payments, receiving purchase orders — not mocked layers. CI gates every push on the backend suite against real Postgres and Redis, lint, a production build, an English/Albanian translation-parity check, and the full e2e suite. Fifty-two migrations and eighteen tagged releases in four months of history; changes go through adversarial review before merging, which has caught everything from decimal-formatting diff bugs to permission edge cases.

## Outcome

In production at a working clinic, used daily by the whole staff. The codebase is private — it runs a real business with real client data — but it is where my e2e testing habits, audit-logging patterns, and domain-modeling discipline were forged, and the practices it enforced now carry into everything else I build.
