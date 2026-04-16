<!--
File:    docs/adr/002-multitenancy-strategy.md
Purpose: Record the shared-DB + school_id + RLS isolation strategy.
Owner:   Navanish
-->

# ADR 002 — Multi-tenancy strategy

**Status**: Accepted
**Date**: 2026-04-16

## Decision
Shared database, shared schema, `school_id` FK on every tenant table, defended by:
1. `TenantModel` abstract base + `.for_school()` queryset helper  → code level.
2. `TenantMiddleware` sets `request.school_id` from user.
3. Every ViewSet uses `_TenantScopedViewSet` base → automatic filter.
4. Postgres Row-Level Security (RLS) policies as the last line of defence.
5. Mandatory `tests/test_isolation.py` in the `schools` app that fails build if A can see B.

## Why not schema-per-school
- 200 schools × Django migration = 200× slower deploys.
- Cross-tenant admin queries become painful.
- Upgrading a column requires N ALTER TABLEs.

## Why not separate DB per school
- Operationally expensive at ₹74,999 price point.
- pgvector benefits compound when all content is one DB.
