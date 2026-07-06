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
