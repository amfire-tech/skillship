<!--
File:    Readme.md (root)
Purpose: Top-level orientation for anyone opening this repo for the first time.
Owner:   Navanish
-->

# Skillship

AI-powered, multi-tenant school LMS built for Indian schools (CBSE / ICSE / State).
**Plan 01 — Core AI**, ₹49,999, 12–14 weeks.

> **Status (16 May 2026):** Plan 01 build complete. 260/260 backend tests
> green. Phase 5 production infra ready. Phase 6 = QA walkthrough + cutover.

## 1 · Where to read what

| Doc | When you need it |
|---|---|
| **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** | You're the platform owner / MAIN_ADMIN. Day-to-day ops. |
| **[infra/DEPLOY.md](infra/DEPLOY.md)** | First-time production deploy + day-2 ops on the VPS. |
| **[QA_CHECKLIST.md](QA_CHECKLIST.md)** | Staging walkthrough script before going to prod. |
| **[CLAUDE.md](CLAUDE.md)** | Codebase rules — read before writing a line of code. |
| **[TEAM_PLAN.md](TEAM_PLAN.md)** | Week-by-week build plan, who owns what. |
| **[PROGRESS_REPORT.md](PROGRESS_REPORT.md)** | Live sprint log (Phase 1 → Phase 6). |
| **[AUDIT_REPORT.md](AUDIT_REPORT.md)** | Pre / post-sprint audit. |
| `docs/adr/` | The "why" behind every big architectural choice. |

## 2 · Folder map

```
backend/     Django 5 + DRF API (~9 apps, 260 tests, multi-tenant)
ai-service/  FastAPI + Google Gemini — hosts the 7 Plan 01 AI endpoints
frontend/    Next.js 14 + TypeScript + Tailwind
data/        Raw SQL, seed data, analytics views
infra/       Production docker-compose + nginx + deploy runbook
docs/        ADRs, API reference, prompt catalog
.github/     CI + deploy workflows
```

## 3 · Start everything locally (5 minutes)

```bash
# Data plane: Postgres + pgvector + Redis
cd infra && docker compose up -d        # leaves you in postgres+redis on host

# Backend
cd ../backend
python -m venv .venv && source .venv/Scripts/activate     # or `.venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env                    # adjust as needed
python manage.py migrate
python manage.py runserver

# AI service (new terminal)
cd ai-service
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env                    # set GEMINI_API_KEY
uvicorn app.main:app --port 8001

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Then:
- Frontend:  http://localhost:3000
- Backend:   http://localhost:8000/api/docs/   (Swagger)
- AI:        http://localhost:8001/docs

## 4 · Demo accounts (local + staging)

Same on every environment, password `Skillship#Test-2026`:

| Role | Email |
|---|---|
| MAIN_ADMIN | `admin@skillship.test` |
| SUB_ADMIN | `subadmin@skillship.test` |
| PRINCIPAL | `principal@school.test` |
| TEACHER | `teacher@school.test` |
| STUDENT | `student@school.test` |

## 5 · Scope at a glance — Plan 01

**Included (built and tested):**
- Multi-tenant LMS · 5 roles · school-level data isolation (DB CheckConstraint enforced)
- JWT + refresh + rate-limit (15-min access, 7-day refresh, blacklist on logout)
- Public site · marketplace · SEO pages
- Quiz engine: timed, randomised, draft→review→publish workflow, **rankings/leaderboard**, **CSV bulk import**, **teacher→student/class assignments**
- Analytics + reports: skill-wise breakdowns, school/class benchmarking, **PDF/Excel exports**, **monthly + yearly auto-generated reports**
- **AI Career Pilot** chat (Gemini)
- **AI College Finder** — NIRF-ranked colleges by state / city / specialization
- **Adaptive quiz engine** — difficulty adapts to student history
- **AI question generator** — topic OR PDF → MCQ / T-F / short-answer
- **AI short-answer grading** — 0.0–1.0 score + feedback
- **Natural-language content search** (pgvector + Gemini)

**Not in Plan 01** (Plan 02 upgrade — ₹74,999):
- Conversational AI Tutor per subject · AI Doubt Solver · Weekly AI principal reports · AI risk alerts · Autonomous content tagging · Multi-agent orchestration · School Recommender · WhatsApp agent · AI follow-ups · Per-school fine-tuned agents

The `School.plan` flag (`CORE` / `AGENTIC`) is already in the schema for a clean upgrade path.

## 6 · Going to production

```
1. Provision VPS (Hetzner / DO).         → infra/DEPLOY.md §1
2. DNS A records → VPS IP.               → infra/DEPLOY.md §2
3. First TLS cert via certbot.           → infra/DEPLOY.md §3
4. Configure GitHub Environments.        → infra/DEPLOY.md §5
5. Push to main → CI auto-deploys to
   staging. QA walkthrough.              → QA_CHECKLIST.md
6. Approve production env → live.
```

## 7 · Plan 02 boundary (CLAUDE.md rule)

Every Plan 02 AI feature is **structurally absent** — routers commented in
`ai-service/app/main.py`, no Django bridge, no frontend menu item, no DB
migration. The `Plan 02 leak check` in QA_CHECKLIST.md verifies this on
every release.

## 8 · Contact

Platform built by **amfire** — `contact@amfire.in` · `www.amfire.in`
