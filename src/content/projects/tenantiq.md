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
---

## Problem

Every RAG demo skips the hard part: what happens when two organizations' documents live in the same database. Most tutorials scope tenancy with a single `WHERE` clause and hope nobody forgets it — one missed filter and a customer reads someone else's contracts. tenantiq is my answer to that problem done properly: a document-intelligence SaaS where each organization uploads private files and queries only its own data, with isolation treated as an architectural guarantee rather than a convention.

## What I built

Organizations upload PDFs, text, or Markdown; an asynchronous Celery pipeline parses each file, splits it into ~800-token chunks with overlap at natural boundaries (paragraph → line → sentence), embeds the chunks (pluggable embedders — Ollama's `nomic-embed-text` in development, a deterministic hashing embedder in tests), and stores them as 768-dimension vectors in Postgres/pgvector. Retrieval runs cosine similarity over an HNSW index, scoped to the requesting tenant, with iterative scan enabled to avoid the recall cliff that filtered vector search suffers on standard index scans. A Next.js 15 frontend handles upload and status; Keycloak provides OIDC sign-in. The current milestone adds LLM answer generation with citations on top of this retrieval layer.

## Architecture decisions

Isolation is enforced twice, independently. At the application layer, every tenant-owned model uses a scoped manager that filters by the tenant resolved from the verified OIDC token — and **raises an exception** if no tenant context is active, so a forgotten scope is a loud error instead of a silent all-tenant query. At the database layer, Postgres row-level security policies key on a per-transaction setting, and the app connects as a non-superuser role that cannot bypass RLS — even hand-written SQL cannot cross tenants. Ingestion is two-phase and idempotent: the attempt is recorded in its own transaction before any risky work, permanent failures (unparseable file, wrong embedding dimension) are marked immediately, and only transient errors consume Celery retries. Every significant decision is written up as an ADR in the repo.

## Testing & quality

124 tests across 16 files, with isolation proven at three levels: unit tests on the scoped manager, raw-SQL tests that attempt cross-tenant reads and writes against real Postgres RLS, and end-to-end leak tests through the HTTP API. The repo carries a standing rule: every new tenant-owned model ships with a cross-tenant isolation test. CI is hermetic — an injectable token verifier and the hashing embedder keep the suite off the network — and runs against Postgres as the same non-superuser role production uses, so RLS is genuinely exercised on every push.

## Outcome

A public, actively developed codebase that shows how I approach the unglamorous parts of SaaS engineering: tenancy, failure handling, and test discipline. Ingestion, retrieval, and the isolation architecture are complete and tested; grounded answer generation with citations is the milestone in progress. The repository doubles as an engineering document — architecture decision records, a measured roadmap, and a test suite that encodes the product's core promise.
