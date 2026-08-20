---
title: tenantiq
tagline: Multi-tenant RAG platform — per-tenant document ingestion, vector search, and strict tenant isolation
context: Solo project — product design, backend, frontend, and infrastructure
bullets:
  - Two-layer tenant isolation — ORM query scoping plus Postgres row-level security
  - Async ingestion pipeline (parse → chunk → embed) with idempotent Celery retries
  - pgvector HNSW retrieval; 124 tests including raw-SQL cross-tenant leak proofs
stack: [Django REST, Next.js, PostgreSQL, pgvector]
order: 1
links:
  github: https://github.com/rbalukja15/tenantiq
status: open-source
---

## Problem

I started tenantiq because most RAG tutorials stop at a demo. They put every customer's documents in one table, scope queries with a `WHERE` clause, and trust that nobody ever forgets it. That's fine for a demo. It's not fine when the documents are contracts. I wanted to build the version you could actually sell to two companies at once: each tenant uploads its own files, asks questions about them, and there is no code path that returns someone else's data.

## What I built

You upload PDFs, text, or Markdown. A Celery pipeline parses each file, splits it into roughly 800-token chunks with some overlap (breaking at paragraphs and sentences before it ever cuts mid-word), embeds them, and writes the vectors to Postgres with pgvector. Search runs cosine similarity over an HNSW index, restricted to the tenant making the request. Embedders are pluggable: local Ollama in development, a deterministic hashing embedder in tests so the suite never touches the network. The frontend is Next.js 15, sign-in is Keycloak OIDC. Answer generation with citations is the part I'm building right now — retrieval and ingestion came first, on purpose, because they're the part everyone gets wrong.

## Architecture decisions

Isolation is enforced twice, and the two layers don't know about each other. In the ORM, every tenant-owned model goes through a manager that filters by the tenant from the verified token. If no tenant context is set, it raises. I wanted "forgot to scope" to be a crash, not a quiet query across all tenants. Below that sits Postgres row-level security, and the app connects as a role that can't bypass RLS, so even hand-written SQL can't read another tenant's rows. Ingestion is built to be re-run: the attempt gets recorded in its own transaction before any risky work, unparseable files fail permanently instead of burning retries, and re-ingesting a document replaces its old chunks. The bigger decisions are all written down as ADRs in the repo.

## Testing & quality

124 tests across 16 files. The isolation ones matter most: unit tests on the scoped manager, tests that run raw SQL against real Postgres and check that RLS actually blocks it, and end-to-end tests that try to leak data through the API. The repo has a standing rule that every new tenant-owned model ships with a cross-tenant test. CI runs the whole suite as the same non-superuser Postgres role production uses, because RLS silently doesn't apply to superusers and I didn't want the tests lying to me.

## Outcome

Public and in active development. Ingestion, retrieval, and the isolation layers are done and tested; cited answers are next. If you want to see how I think about architecture, the ADRs in this repo are probably the fastest way.
