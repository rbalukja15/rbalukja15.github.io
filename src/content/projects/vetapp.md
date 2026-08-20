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
thumbnail: /images/vetapp/dashboard-card.webp
status: production
---

## Problem

A working veterinary clinic was running on paper and spreadsheets. Stock was counted by hand, supplier debt lived in a notebook, and vaccination follow-ups depended on someone remembering. They needed one system for the whole operation — front desk and vets, in both English and Albanian. I built it, and they run their business on it every day.

## What I built

Clients and pets with full medical histories: vaccinations, antiparasite treatments, medications, illnesses. Appointments with a calendar. Invoices with discounts, tax, PDF export, and payment tracking. Inventory across ten product categories, with a stock-take workflow. Purchase orders with a supplier ledger that is append-only, so the debt history can't be quietly edited. Per-user permissions for admins, vets, and reception. An audit log of every change. Email reminders for tomorrow's appointments, vaccinations coming due, and overdue invoices. It comes out to 22 Django models, 21 API viewsets, and 26 pages of Next.js frontend.

<figure class="shot">
  <img src="/images/vetapp/dashboard.webp" width="1200" height="670" loading="lazy" decoding="async" alt="VetApp dashboard with summary cards for clients, today's appointments, month-to-date revenue, low stock and outstanding invoices, a list of upcoming appointments, and a vaccinations-due panel." />
  <figcaption>The dashboard pulls the day together: upcoming appointments, vaccinations coming due, low-stock alerts, and month-to-date revenue in one view.</figcaption>
</figure>

<figure class="shot">
  <img src="/images/vetapp/appointments.webp" width="1200" height="664" loading="lazy" decoding="async" alt="A month-view appointment calendar for July, with colour-coded appointments spread across the days." />
  <figcaption>Appointments on a month calendar, colour-coded by type.</figcaption>
</figure>

## Architecture decisions

The trickiest domain logic is pack pricing. Products are bought in packs (a 20 kg bag) and sold in units (per kg), so products carry both, purchase receipts multiply through the pack size, and invoice lines snapshot the pack size at the moment of sale. An early bug that understated a purchase order by exactly the pack size taught me not to derive historical numbers from current data. Reminder jobs set a sent-flag and filter on it, so a re-run never emails a client twice. The audit log listens to model signals and copies user and record names into each entry, so history stays readable after renames or deactivations. Permissions are product capabilities like `invoices.create`, granted per user — closer to how a clinic actually delegates work than model-level CRUD.

<figure class="shot">
  <img src="/images/vetapp/inventory.webp" width="1200" height="675" loading="lazy" decoding="async" alt="The inventory table listing products with category, stock level shown in packs or units with a progress bar, cost, selling price, supplier and reorder point." />
  <figcaption>Inventory tracks each product in both packs and units, with per-supplier cost, selling price, and a reorder threshold.</figcaption>
</figure>

<figure class="shot">
  <img src="/images/vetapp/stock-take.webp" width="1200" height="672" loading="lazy" decoding="async" alt="The stock-take screen in dark theme, showing in-stock versus counted quantities and the computed variance for each product, with an unsaved-changes bar at the bottom." />
  <figcaption>The stock-take screen computes the variance against your physical count before anything is committed. Every screen ships in light and dark themes, in English and Albanian.</figcaption>
</figure>

## Testing & quality

302 backend test functions and 177 Playwright end-to-end tests across 54 spec files. The e2e suite drives the real dockerized stack: it logs in, fills the forms, collects payments, receives purchase orders. No mocked backend. CI runs all of it on every push — pytest against real Postgres and Redis, lint, a production build, the e2e suite, and a check that fails if the English and Albanian translation files ever drift apart. 29 tagged releases so far. Everything goes through an adversarial review pass before merging; that habit has caught bugs as subtle as a stored Decimal comparing unequal to its own re-submitted form value.

## Outcome

In production, used daily by the whole staff. The code stays private — it runs a real business with real client data — but the habits I now consider defaults (e2e-first testing, append-only ledgers, audit logging, idempotent jobs) all got locked in here.
