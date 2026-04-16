<!--
File:    docs/adr/001-tech-stack.md
Purpose: Record WHY we chose Django + FastAPI + Next.js (so future members don't reopen the debate).
Owner:   Navanish
-->

# ADR 001 — Tech Stack

**Status**: Accepted
**Date**: 2026-04-16

## Context
Team is Python-first (Navanish, Prashant, Vishal). Pranav owns frontend.

## Decision
- **Backend**: Django 5 + DRF  (team's best language + batteries included: ORM, admin, migrations, auth).
- **AI service**: FastAPI (async-first for LLM streaming + simpler than Django for pure APIs).
- **Frontend**: Next.js 14 + TypeScript (SSR + great DX + one framework for app + marketing site).
- **Database**: PostgreSQL 16 with `pgvector` (one DB for relational + embeddings, one backup story).
- **Queue**: Celery + Redis.

## Why we did NOT choose ...
- Node/Express backend → team unfamiliar; Python is stronger.
- django-tenants (schema-per-school) → harder migrations, harder cross-school admin queries.
- Separate vector DB (Pinecone/Weaviate) → extra infra, extra cost, pgvector suffices at our scale.
