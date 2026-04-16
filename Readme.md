<!--
File:    README.md (root)
Purpose: Top-level orientation for anyone opening this repo for the first time.
Owner:   Navanish
-->

# Skillship

AI-powered, multi-tenant school LMS built for Indian schools (CBSE / ICSE / State).
Proposal: **Plan 02 — Agentic AI**, ₹74,999, 14–16 weeks, 4-person team.

## 1. Read this first

- `TEAM_PLAN.md` — the **complete manual** (how the team works, week-by-week plan, who owns what, how to build).
- `docs/adr/` — the "why" behind every big architectural choice.

## 2. Folder map

```
backend/     Django 5 + DRF API (Navanish + Prashant + Vishal)
ai-service/  FastAPI + LangGraph + Claude agents (Navanish)
frontend/    Next.js 14 + TypeScript + Tailwind (Pranav)
data/        Raw SQL, seed data, analytics views
infra/       docker-compose, nginx, backup scripts
docs/        ADRs, API reference, prompt catalog, runbook
.github/     CI + deploy workflows
```

## 3. Start everything locally (5 minutes)

```bash
cd infra
cp .env.example .env
docker compose up --build
```

Then:
- Frontend:  http://localhost:3000
- Backend:   http://localhost:8000/api/docs/
- AI:        http://localhost:8001/docs

## 4. Team

| Person    | Primary area                                                      |
| --------- | ----------------------------------------------------------------- |
| Navanish  | Lead · infra · `common` · `ai_bridge` · AI service · deploys      |
| Prashant  | `accounts` · `schools` · `academics` · auth + isolation tests     |
| Vishal    | `quizzes` · `content` · `analytics` · `notifications` · Celery    |
| Pranav    | Entire `frontend/`                                                |

Shared: `data/`, `docs/`, reviews.
