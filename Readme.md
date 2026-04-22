<!--
File:    README.md (root)
Purpose: Top-level orientation for anyone opening this repo for the first time.
Owner:   Navanish
-->

# Skillship

AI-powered, multi-tenant school LMS built for Indian schools (CBSE / ICSE / State).
Proposal: **Plan 01 — Core AI**, ₹49,999, 12–14 weeks, 4-person team.

## 1. Read this first

- `TEAM_PLAN.md` — the **complete manual** (how the team works, week-by-week plan, who owns what, how to build).
- `docs/adr/` — the "why" behind every big architectural choice.

## 2. Folder map

```
backend/     Django 5 + DRF API (Navanish + Prashant + Vishal)
ai-service/  FastAPI + Claude — hosts the 4 Plan 01 AI features (Navanish)
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

## 4. Scope at a glance (Plan 01 — Core AI)

Included:
- Multi-tenant LMS (5 roles, school-level data isolation, JWT + refresh + rate-limit)
- Public site + marketplace + SEO pages
- Quiz engine (timed, randomized, approval workflow, bulk import, class rankings)
- Analytics & reports (skill-wise, benchmarking, PDF/Excel export, academic year)
- **AI Career Pilot** — per-student career guidance agent
- **Adaptive quiz engine** — difficulty adapts to student history
- **AI question generator** — PDF → MCQ / T-F / short-answer
- **Natural language content search**

Not in Plan 01 (Plan 02 upgrade path):
- Multi-agent orchestration, custom per-school agents, AI tutor chat, weekly AI reports,
  risk alerts, doubt solver, content auto-tagging, school recommender, WhatsApp agent,
  AI follow-ups. `School.plan` flag already exists for a clean upgrade.

## 5. Team

| Person    | Primary area                                                      |
| --------- | ----------------------------------------------------------------- |
| Navanish  | Lead · infra · `common` · `ai_bridge` · AI service · deploys      |
| Prashant  | `accounts` · `schools` · `academics` · auth + isolation tests     |
| Vishal    | `quizzes` · `content` · `analytics` · `notifications` · Celery    |
| Pranav    | Entire `frontend/`                                                |

Shared: `data/`, `docs/`, reviews.
