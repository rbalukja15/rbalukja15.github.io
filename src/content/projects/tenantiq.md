---
title: tenantiq
tagline: Multi-tenant document intelligence — each tenant asks questions of their own documents and gets answers with citations
context: Solo project — product design, backend, frontend, and infrastructure
bullets:
  - Two-layer tenant isolation — ORM query scoping plus Postgres row-level security
  - Grounded answers that stream in with citations resolving to the exact source passage
  - 662 automated tests, including raw-SQL cross-tenant leak proofs
stack: [Django REST, Next.js, PostgreSQL, pgvector, Celery, Keycloak]
order: 1
status: open-source
links:
  github: https://github.com/rbalukja15/tenantiq
---

## Problem

I started tenantiq because most RAG tutorials stop at a demo. They put every customer's documents in one table, scope queries with a `WHERE` clause, and trust that nobody ever forgets it. That's fine for a demo. It's not fine when the documents are contracts. I wanted the version you could actually sell to two companies at once: each tenant uploads its own files, asks questions about them, and there is no code path that returns someone else's data.

## What I built

You upload PDFs, text, or Markdown. A Celery pipeline parses each file, splits it into roughly 800-token chunks with some overlap, embeds them, and writes the vectors to Postgres with pgvector. Ask a question and the answer streams back with numbered citations, and each citation resolves to the exact passage it came from. There's a refusal state built into the UI for when nothing relevant is retrieved, so it can say so instead of answering thinly, though the eval harness found the shipped similarity floor doesn't actually reach that state by default.

There's a real frontend: Next.js with an app shell, sign-in through Keycloak OIDC behind a backend-for-frontend proxy, a design system built on CSS Modules, the streaming ask screen, and document management with upload progress and live ingestion status.

Around all that: PII redaction and prompt-injection guardrails, per-tenant rate limits and quotas, per-tenant cost and token accounting, and an evaluation harness that runs the real ingestion and retrieval path against a curated question set and scores retrieval quality and answer faithfulness.

<figure class="shot">
  <img src="/images/tenantiq/ask-cited-answer.webp" width="1200" height="625" loading="lazy" decoding="async" alt="TenantIQ answering a question about payment terms, with two numbered citations and a panel showing the exact source passages and their chunk offsets." />
  <figcaption>An answer reconciling an amendment against the original agreement. Every claim carries the passage it came from.</figcaption>
</figure>

<figure class="shot">
  <img src="/images/tenantiq/documents.webp" width="1200" height="486" loading="lazy" decoding="async" alt="The document management screen listing two uploaded contracts, both showing Ready status, with an upload control above." />
  <figcaption>Documents belong to one workspace, and an answer can only ever cite these.</figcaption>
</figure>

## Architecture decisions

Isolation is enforced twice, and the two layers don't know about each other. In the ORM, every tenant-owned model goes through a manager that filters by the tenant from the verified token. If no tenant context is set, it raises. I wanted "forgot to scope" to be a crash, not a quiet query across all tenants. Below that sits Postgres row-level security, and the app connects as a role that can't bypass it, so even hand-written SQL can't read another tenant's rows.

Grounding is a contract, not a hope. The prompt forbids the model from computing numbers or inventing a citation, and the API drops any citation marker that doesn't resolve to a real chunk. The UI only makes a `[1]` clickable once it has fetched the passage behind it.

Ingestion is built to be re-run: the attempt is recorded in its own transaction before any risky work, unparseable files fail permanently instead of burning retries, and re-ingesting a document replaces its old chunks.

Seventeen architecture decision records in the repo explain why each of these went the way it did.

## Testing & quality

662 automated tests, 377 on the backend across 32 files and 285 on the frontend across 29. The isolation ones matter most: unit tests on the scoped manager, tests that run raw SQL against real Postgres and check that row-level security actually blocks it, and end-to-end tests that try to leak data through the API. The repo has a standing rule that every new tenant-owned model ships with a cross-tenant test. CI runs the whole suite as the same non-superuser Postgres role production uses, because row-level security silently doesn't apply to superusers and I didn't want the tests lying to me.

## Outcome

Public and in active development. Auth and isolation, the ingestion pipeline, the grounded query engine with streamed cited answers, the frontend that uses them, and an evaluation harness for retrieval and answer faithfulness are all done and tested. That harness's first run was unflattering, and that's the point: zero invented citations, but only half the claims in an answer carried one at all, eighteen sentences stated a figure with nothing behind it, and the headline grounded score came out to 0.36. The same model generated those answers and judged them, so I'm reading that number as a floor, not a grade. Deployment is next. If you want to see how I think about architecture, the ADRs are the fastest way in.
