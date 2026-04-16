<!--
File:    docs/adr/003-ai-service-boundary.md
Purpose: Record why AI lives in a separate FastAPI service, not inside Django.
Owner:   Navanish
-->

# ADR 003 — AI service boundary

**Status**: Accepted
**Date**: 2026-04-16

## Decision
All LLM / embedding / agent code lives in `ai-service/` (FastAPI).
Django talks to it via `apps.ai_bridge.client.AiClient` over HTTP, authenticated with `X-Internal-Key`.

## Reasons
- **Scaling**: AI has different scale profile (long requests, GPU-adjacent). Scale independently.
- **Dependencies**: anthropic, langgraph, pgvector SDKs don't bloat the Django image.
- **Fault isolation**: AI outage doesn't 500 a user's grade book.
- **Observability**: AI calls are expensive; one service = one cost ledger (AiJob rows).

## Downsides accepted
- One extra network hop (+ ~5 ms).
- Two services to deploy.
