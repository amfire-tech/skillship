# Skillship — Team Manual

> This single file is the whole project manual. If you are joining the team (or if
> you are 15 years old and want to understand how a real software product is
> built), read this top-to-bottom **once** and you will know what to do.
>
> No code is written here — only *process, people, tools, decisions*.
> Every file in the repo has a header telling you its purpose and owner.

**Project**: Skillship — an AI-powered school LMS for Indian schools (CBSE / ICSE / State).
**Proposal**: Plan 01 (Core AI), ₹49,999, 12–14 weeks. 3 months free support after launch.
**Team size**: 4 people.
**Today's date (kick-off)**: 2026-04-16.

> **Plan 01 vs Plan 02.** Plan 01 ships a full LMS plus four production AI features: Career Pilot, adaptive quiz engine, AI question generator, and natural-language content search. Plan 02 adds agentic orchestration, per-school tutor agents, weekly AI reports, risk alerts, doubt solver, content auto-tagging, WhatsApp agent, and AI follow-ups. We are building **Plan 01**. The database already has a `School.plan` flag (`CORE` / `AGENTIC`) so a future upgrade is a feature-flag flip, not a re-architecture.

---

## Table of contents

1. [What are we building?](#1-what-are-we-building)
2. [The 4-person team — who does what](#2-the-4-person-team--who-does-what)
3. [Tools every team member needs](#3-tools-every-team-member-needs)
4. [Day-zero setup (first 2 hours on the project)](#4-day-zero-setup-first-2-hours-on-the-project)
5. [How we work together (Git + PR + standups)](#5-how-we-work-together-git--pr--standups)
6. [The tech stack — explained for beginners](#6-the-tech-stack--explained-for-beginners)
7. [The folder map — what every folder is for](#7-the-folder-map--what-every-folder-is-for)
8. [The ONE rule you must never break — multi-tenancy](#8-the-one-rule-you-must-never-break--multi-tenancy)
9. [The five user roles](#9-the-five-user-roles)
10. [The AI features (what makes Plan 02 different)](#10-the-ai-features-what-makes-plan-02-different)
11. [Week-by-week delivery plan (14–16 weeks)](#11-week-by-week-delivery-plan-1416-weeks)
12. ["Done" means — definition of done](#12-done-means--definition-of-done)
13. [Testing strategy](#13-testing-strategy)
14. [Deployment & production](#14-deployment--production)
15. [Money & AI cost control](#15-money--ai-cost-control)
16. [Communication & escalation](#16-communication--escalation)
17. [Glossary — jargon buster](#17-glossary--jargon-buster)

---

## 1. What are we building?

Skillship is a website + dashboard that schools use for:

- **Students** — take AI-adaptive quizzes, ask an AI tutor, get career advice.
- **Teachers** — create quizzes (AI helps), upload notes/videos, see who's struggling.
- **Principals** — see a weekly AI-written report of how their school is doing + early-warning alerts for at-risk students.
- **Sub-admins** — manage billing + support for many schools.
- **Main admin (us)** — onboard new schools.

One Skillship installation serves **many schools at once**. Each school sees only its own
students, quizzes, and files — nothing from any other school. That property is called
**multi-tenancy**, and it shapes every piece of code we write (see section 8).

---

## 2. The 4-person team — who does what

| Person       | Primary role                                              | Main folders they own                                                                     |
| ------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Navanish** | Team lead · Backend · DevOps                              | `backend/` (all — config, apps, jobs)                                                     |
| **Prashant** | AI service — all LLM features                             | `ai-service/` (all — routers, agents, engines, rag, schemas, prompts)                    |
| **Vishal**   | Data — seed, fixtures, SQL                                | `data/`                                                                                   |
| **Pranav**   | Frontend — everything the user sees                       | `frontend/`                                                                               |

**Shared**: `infra/`, `.github/workflows/`, `docs/` (ADRs), root files (`CLAUDE.md`, `TEAM_PLAN.md`, `README.md`), code reviews.

### How this split lets us work in parallel

- Different folders ⇒ different files ⇒ almost no merge conflicts.
- Prashant builds `accounts` first → others unblock (everyone else needs the User model).
- Once the `TenantModel` + `_TenantScopedViewSet` pattern exists (Navanish, week 1), Vishal and Prashant copy it for every other model.
- Pranav codes every screen against the Django **OpenAPI schema**, so he can progress even if a single backend endpoint is incomplete — he gets auto-generated mock types the moment an endpoint is defined.

### How to handle something you don't know

You are allowed to:
- Ask the others in the team chat.
- Ask Claude Code (this assistant) to explain a piece of syntax or write a snippet.
- Read the Django, DRF, FastAPI, or Next.js docs.

You are **not** allowed to copy-paste large chunks of random blogs into the repo. If you got a 20-line block from somewhere else, mention it in the PR so the reviewer knows.

---

## 3. Tools every team member needs

Install these on day one:

| Tool            | Why                                              | Who installs         |
| --------------- | ------------------------------------------------ | -------------------- |
| Git + GitHub    | Version control                                  | Everyone             |
| VS Code         | Editor (with Python + Pylance + Ruff extensions) | Everyone             |
| Python 3.12     | Backend + AI service                             | Everyone (even Pranav, for running the API locally) |
| Node.js 20 LTS  | Frontend                                         | Everyone (even backend folks, for generating types) |
| Docker Desktop  | Run Postgres + Redis + everything locally        | Everyone             |
| Postman or Bruno | Poke the API manually                           | Backend folks        |
| DB browser: TablePlus / DBeaver | Inspect Postgres                 | Backend folks        |
| Claude Code (this assistant) | Explain code, generate snippets     | Everyone             |

Accounts to create:
- **GitHub** — add SSH key.
- **Anthropic console** (Navanish only, for API key).
- **A free PostgreSQL host for staging** (Supabase / Neon free tier) — Navanish.
- **DigitalOcean / AWS account** for production — Navanish, after week 10.

---

## 4. Day-zero setup (first 2 hours on the project)

Every teammate, first time:

```bash
# 1. Clone
git clone <repo-url>
cd skillship

# 2. Bring up Postgres + Redis locally
cd infra
cp .env.example .env
docker compose up -d postgres redis

# 3. Backend
cd ../backend
python -m venv .venv
.venv\Scripts\activate          # Windows bash: source .venv/Scripts/activate
pip install -r requirements-dev.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

# 4. AI service (separate terminal)
cd ../ai-service
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill ANTHROPIC_API_KEY (ask Navanish)
uvicorn app.main:app --reload --port 8001

# 5. Frontend (separate terminal)
cd ../frontend
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

If anything fails here, say so in the team chat **before** spending more than 30 minutes debugging. Kick-off pain is normal; silent struggle is not.

---

## 5. How we work together (Git + PR + standups)

### Branch naming

```
feat/<owner>/<short-description>      # feat/prashant/user-model
fix/<owner>/<short-description>       # fix/vishal/quiz-score-rounding
docs/<owner>/<topic>                  # docs/navanish/rls-adr
```

### Commit messages (one line, imperative mood)

Good:
```
feat(accounts): add User model with role + school constraints
fix(quizzes): stop re-grading submitted attempts
docs(adr): record RLS decision
```

Bad:
```
updates
fixed stuff
WIP
```

### Pull request rules

- **Small PRs** (≤ 400 lines changed). If bigger, split it.
- Every PR must have:
  - Description: *what* changed and *why* (one paragraph).
  - A screenshot if it touches UI.
  - `Fixes #<issue>` if it closes a ticket.
- CI must be green (lint + type check + tests).
- **Two reviewers** for anything in `backend/apps/common/`, `backend/apps/schools/`, or `ai_bridge/` (these affect everyone).
  - One reviewer elsewhere.
- Reviewer turnaround: **same working day**. If you will be slow, say so.
- Author merges their own PR once approved (squash-merge).

### Daily standup (15 min, every working day, 10:00 IST)

Each person answers three questions:
1. What did I finish yesterday?
2. What will I do today?
3. Am I blocked on anything?

If blocked, fix it *after* standup — don't debate in standup.

### Weekly sync (1 h, every Friday 17:00 IST)

- Demo what shipped this week.
- Review next week's top 3 goals.
- Look at any broken tests, flaky CI, tech debt.

---

## 6. The tech stack — explained for beginners

### Backend: **Django 5 + Django REST Framework (DRF)**

- Django = Python web framework with "batteries included" (database, admin, auth).
- DRF = makes Django speak JSON API so frontend/mobile can talk to it.
- Why Django? Our team is Python-first. Django is the most mature, safest, best-documented option for a database-heavy app like this.

### AI service: **FastAPI (Python) + LangGraph + Claude**

- FastAPI = small, fast, async Python API framework.
- LangGraph = library for wiring multiple AI "agents" together.
- Claude (Anthropic) = the LLM we use (specifically `claude-opus-4-6`).
- Why separate from Django? AI calls are slow and expensive. Keeping them in a different service means a Claude outage doesn't break grading.

### Frontend: **Next.js 14 + TypeScript + Tailwind CSS**

- Next.js = React framework with routing, SSR, and great DX.
- TypeScript = JavaScript with types (fewer bugs).
- Tailwind = utility CSS so Pranav doesn't have to write 10 stylesheets.

### Database: **PostgreSQL 16 + pgvector**

- PostgreSQL = battle-tested SQL database.
- pgvector = extension that lets us store AI embeddings IN the same DB (for RAG search over school content).

### Queue: **Celery + Redis**

- Celery = Python background task system. Runs "send email", "generate weekly report", "scan for at-risk students" without blocking a user's request.
- Redis = fast memory store that Celery uses as its inbox.

### Why these and not others?

See [docs/adr/001-tech-stack.md](docs/adr/001-tech-stack.md).

---

## 7. The folder map — what every folder is for

Already summarized in [README.md](README.md). The short version:

```
skillship/
├── backend/            # Django API (Navanish, Prashant, Vishal)
│   ├── config/         # Django settings + URL root
│   ├── apps/           # One folder per feature area
│   │   ├── common/     # TenantModel, middleware, permissions (Navanish)
│   │   ├── accounts/   # Users, login, roles (Prashant)
│   │   ├── schools/    # The tenant root + settings (Prashant)
│   │   ├── academics/  # Years, classes, courses, enrollment (Prashant)
│   │   ├── quizzes/    # Questions, quizzes, attempts (Vishal)
│   │   ├── content/    # Videos, PDFs, marketplace (Vishal)
│   │   ├── analytics/  # Dashboards + risk signals (Vishal)
│   │   ├── notifications/  # In-app, email, SMS (Vishal)
│   │   └── ai_bridge/  # Thin proxy to FastAPI service (Navanish)
│   └── jobs/           # Celery background tasks
│
├── ai-service/         # FastAPI AI service (Navanish)
│   └── app/
│       ├── routers/    # HTTP endpoints
│       ├── agents/     # LLM agents (career, tutor, analyst, risk, content)
│       ├── engines/    # Deterministic helpers (adaptive quiz, scoring)
│       ├── rag/        # Chunk + embed + retrieve
│       ├── prompts/    # Prompt templates (.md files)
│       └── schemas/    # Pydantic request/response models
│
├── frontend/           # Next.js website (Pranav)
│   └── src/
│       ├── app/        # Route groups: (public), (auth), (dashboard)/<role>
│       ├── components/ # Reusable UI
│       ├── hooks/      # React hooks
│       └── lib/        # API client, auth helpers
│
├── data/               # Raw SQL + seed + reports
├── infra/              # docker-compose, nginx, backups
├── docs/               # ADRs, API reference, runbook
├── .github/workflows/  # CI + deploy
├── README.md
├── TEAM_PLAN.md        # ← you are here
└── .env.example
```

Every single file in the repo begins with a header like:

```python
"""
File:    backend/apps/accounts/models.py
Purpose: Custom User model — identity + role + link to school.
Why:     ...
Owner:   Prashant
TODO:    ...
"""
```

So you can open *any* file and in 5 seconds know what it is for and who to ask.

---

## 8. The ONE rule you must never break — multi-tenancy

Skillship stores many schools in **one** database. The rule:

> **A request from School A must NEVER see data from School B.**

If this rule is ever broken, even once, we have a privacy breach and the contract is dead.

We defend this rule with five layers — any ONE of them would catch a bug, together they're near-bulletproof:

1. **`TenantModel`** — every tenant-scoped table inherits from this abstract class. It forces a `school` FK on the row.
2. **`TenantMiddleware`** — reads `request.user.school_id` and attaches it as `request.school_id` before any view runs.
3. **`_TenantScopedViewSet`** — every ViewSet's `get_queryset()` calls `.for_school(request.school_id)` automatically. Forgetting to inherit from it is the kind of bug CI will catch.
4. **Row-Level Security (RLS)** — Postgres itself refuses to return a row whose `school_id` doesn't match `current_setting('app.school_id')`. The database is the last wall.
5. **`tests/test_isolation.py`** — automated test that logs in as School A and tries to read every tenant-scoped table's data from School B. Fails build on leak.

### The rule, restated for your code

- Never write a `.filter(...)` on a tenant model without `school_id=request.school_id` (or inheriting from `_TenantScopedViewSet` which does it for you).
- Never expose IDs across schools (e.g. "go to /users/<uuid>" must 404 if that user is in a different school).
- When in doubt: write the isolation test first, then write the feature until the test passes.

Read [docs/adr/002-multitenancy-strategy.md](docs/adr/002-multitenancy-strategy.md) for full rationale.

---

## 9. The five user roles

Every logged-in person has exactly one `role` and (except MAIN_ADMIN) exactly one `school_id`.

| Role          | school_id | Can do                                                                          |
| ------------- | --------- | ------------------------------------------------------------------------------- |
| `MAIN_ADMIN`  | `NULL`    | Onboard new schools, see all data across schools, manage plans. (That's us.)    |
| `SUB_ADMIN`   | many      | Support / billing for a batch of schools.                                       |
| `PRINCIPAL`   | 1         | Full admin inside one school — teachers, students, weekly AI report.            |
| `TEACHER`     | 1         | Own classes, own quizzes, upload content, grade, view students' progress.       |
| `STUDENT`     | 1         | Take quizzes, ask Tutor / CareerPilot, view own progress + content.             |

Permission classes (`apps/common/permissions.py`) map to these roles. Every endpoint lists the exact permissions it requires.

---

## 10. The AI features (Plan 01 scope)

Four production AI features, all living inside `ai-service/`:

| # | Feature                     | Who it serves | File                                              |
| - | --------------------------- | ------------- | ------------------------------------------------- |
| 1 | **Adaptive quiz engine**    | Student       | `ai-service/app/engines/adaptive_quiz.py`         |
| 2 | **AI question generator**   | Teacher       | `ai-service/app/engines/question_gen.py`          |
| 3 | **AI Career Pilot**         | Student       | `ai-service/app/agents/career_pilot.py`           |
| 4 | **Natural-language search** | Everyone      | `ai-service/app/engines/content_search.py`        |

Behaviour:
- **Adaptive quiz** — picks next question difficulty from the student's rolling performance. Deterministic scoring engine + LLM only for explanation generation on wrong answers.
- **Question generator** — teacher uploads PDF/doc → LLM extracts concepts → returns MCQ / True-False / short-answer at Easy / Medium / Hard. Teacher reviews and accepts into question bank.
- **Career Pilot** — analyses quiz performance, content engagement, and subject strengths to recommend ordered learning paths (AI, Coding, Robotics, STEM). Tracks milestones.
- **Natural-language search** — student/teacher types "explain photosynthesis" and the system returns relevant content chunks. Uses pgvector embeddings of uploaded content.

**Not in Plan 01** (Plan 02 only, do not build):
- Multi-agent workflow orchestration
- Conversational AI Tutor per subject
- AI Doubt Solver
- Weekly AI-written principal reports
- AI student risk alerts
- Autonomous content tagging & recommendation
- AI School Recommender, custom chatbots, WhatsApp agent, AI follow-ups
- Per-school fine-tuned agents

**Important rule**: Django **never** imports `anthropic`, `langgraph`, or `openai` directly.
It calls the FastAPI AI service through one file: `backend/apps/ai_bridge/client.py`.
If we ever change LLM providers, that one file changes — nothing else.

Read [docs/adr/003-ai-service-boundary.md](docs/adr/003-ai-service-boundary.md) for the why.

---

## 11. Week-by-week delivery plan (12–14 weeks, Plan 01)

This schedule mirrors the 7 phases in the signed proposal. Each row has a **goal**, a **lead**, what **ships** at the end, and a **checkpoint** demo-able to the client.

### Phase 01 — Discovery & Architecture (Week 1)

| Week | Goal                                                   | Lead     | Ships                                                                                                       | Checkpoint                                       |
| ---- | ------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1    | Repo boots end-to-end. Tech stack + DB schema locked.  | Navanish | Docker compose up; healthz green on backend + ai-service; `common`/`schools`/`accounts` models + migrations; CI passes; API contract (OpenAPI) agreed with Pranav. | Every dev can `docker compose up` without error. |

### Phase 02 — UI Development (Weeks 2–4)

Pranav is the critical path here; backend folks unblock him by shipping the auth + schools API early.

| Week | Goal                                        | Lead             | Ships                                                                                                                    |
| ---- | ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 2    | Auth real end-to-end + public site done     | Prashant + Pranav | Login / refresh / logout / me endpoints; `TenantMiddleware`; `test_isolation.py` passes; public pages (home, marketplace, workshops, about, contact) polished. |
| 3    | Admin + Principal dashboards wired          | Prashant + Pranav | Schools CRUD, Users CRUD, Academic Year / Class / Course / Enrollment models + endpoints; admin + principal screens call real APIs. |
| 4    | Teacher + Student dashboards wired          | Vishal + Pranav   | Quiz listing, question bank browse, student content browse; all screens responsive; Figma-accurate.                       |

**Checkpoint (end of Week 4)**: Client can click through every screen in all 5 roles on staging with seeded data. No feature needs AI yet.

### Phase 03 — Backend & Core APIs (Weeks 4–8, overlaps UI)

| Week | Goal                                    | Lead              | Ships                                                                                                      |
| ---- | --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| 5    | Quiz engine — authoring + approval flow | Vishal            | Question / Quiz / QuizAttempt / Answer models; Draft → Review → Publish workflow; randomised-per-attempt logic; bulk question import (CSV). |
| 6    | Quiz-taking + timer + scoring + rankings | Vishal           | Student take-attempt API (timed, server-authoritative); auto-score; class-ranking view; teacher-assigned practice tests.                     |
| 7    | Content module + marketplace purchase   | Vishal            | File upload (S3-compatible); marketplace listing + purchase + enrollment; academic-year management.        |
| 8    | Analytics + reports + notifications     | Vishal + Prashant | Skill-wise analytics, class/school benchmarking, PDF + Excel export, monthly/yearly progress; in-app + email notifications via Celery. |

**Milestone 02 payment trigger** at end of Week 8: all screens on staging + APIs functional → invoice 30% (₹14,999.70).

### Phase 04 — AI Integration Sprint (Weeks 8–10)

Navanish leads; Vishal and Pranav integrate. Four features, production-quality.

| Week | Goal                                         | Lead              | Ships                                                                                                     |
| ---- | -------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------- |
| 9    | AI question generator + Adaptive quiz engine | Navanish + Vishal | `POST /ai/quiz/generate/` (PDF → reviewable MCQs); adaptive-next endpoint; teacher UI to accept/edit/reject generated questions; student adaptive flow live. |
| 10   | Career Pilot + natural-language content search | Navanish + Pranav | Career Pilot chat on student dashboard (analyses quiz history → career paths); pgvector table; content-search endpoint grounded in uploaded content. |

**Milestone 03 payment trigger** at end of Week 10: all 4 AI features live and tested on staging → invoice 25% (₹12,499.75).

### Phase 05 — QA & Performance (Weeks 10–12)

| Week | Goal                                | Lead              | Ships                                                                                      |
| ---- | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| 11   | Performance + pagination + indexing | Prashant + Vishal | All list endpoints paginated; N+1 queries eliminated; dashboards < 500 ms; load test at 500 concurrent users. |
| 12   | Security + role validation + AI accuracy | Navanish       | Postgres RLS policies enforced; JWT rotation on; login + AI rate limits; AI accuracy sampled against a curated eval set; role-based access tests green. |

### Phase 06 — Staging Delivery (Weeks 12–13)

Client walkthrough + feedback loop.

| Week   | Goal                            | Lead     | Ships                                                                   |
| ------ | ------------------------------- | -------- | ----------------------------------------------------------------------- |
| 12–13  | Live staging URL + walkthrough  | Navanish | Staging deployed; onboarding demo with a friendly school; feedback collected into a small backlog for Week 14. |

### Phase 07 — Production Launch (Week 14)

| Week | Goal                              | Lead     | Ships                                                                      |
| ---- | --------------------------------- | -------- | -------------------------------------------------------------------------- |
| 14   | Deploy, DNS, SSL, handover, tune  | Navanish | Production deploy; DNS + Cloudflare SSL; handover docs; LLM prompts tuned on real data; Sentry + uptime monitor live. |

**Milestone 04 payment trigger** at end of Week 14: live deployment + code delivery + documentation → invoice 25% (₹12,499.75).

### Contingency (if Weeks 13–14 slip)

There is no buffer built into Plan 01 — the proposal is 12–14 weeks total. If a slip happens:
1. Cut scope first (drop a nice-to-have, keep AI features intact — they trigger Milestone 03).
2. Never skip QA (Phase 05) or RLS hardening (Week 12).
3. Never delay staging without written client notice — it blocks their feedback.

---

## 12. "Done" means — definition of done

A feature is not done until **all** of these are true:

- [ ] Code merged to `main` via PR (no direct pushes).
- [ ] Django migrations committed (if models changed).
- [ ] Unit + integration tests added; CI green.
- [ ] Isolation test still passes (if it's a tenant-scoped feature).
- [ ] API schema updated — frontend can run `npm run gen:types` and get fresh types.
- [ ] Manually tried in the local dev environment against seed data.
- [ ] Swagger docs render correctly at `/api/docs/`.
- [ ] If it touches UI — demo video or screenshot in the PR.
- [ ] Owner header in every new file.
- [ ] TEAM_PLAN (this file) or an ADR updated if the decision is architectural.

If a bug bounty question is "why did you push this untested?" — the answer should never be "I forgot".

---

## 13. Testing strategy

### Pyramid

```
 /\     End-to-end (manual + Playwright later)  ~5 tests
/──\    Integration: DRF APIClient hitting real DB + seeded data  ~40%
/────\  Unit: pure function tests (services, engines)  ~60%
```

### Non-negotiable tests

1. `apps/schools/tests/test_isolation.py` — school A cannot see school B.
2. `apps/accounts/tests/test_login.py` — login, refresh, role-based access.
3. `apps/quizzes/tests/test_submit.py` — cannot submit to an archived quiz, cannot re-submit, cannot see another student's answers.
4. `ai-service/tests/test_healthz.py` — AI service boots.

### Running tests

```bash
cd backend && pytest
cd ai-service && pytest
cd frontend && npm run test          # later, when we add unit tests
```

CI runs all three on every PR.

---

## 14. Deployment & production

Deployed via GitHub Actions (`.github/workflows/deploy.yml`):

1. PR merged to `main`.
2. CI builds Docker images for backend, ai-service, frontend.
3. Images pushed to registry.
4. Staging environment auto-deploys (new tag).
5. Smoke test script runs against staging.
6. **Manual approval** required to promote to production.
7. Production rolls out one service at a time.

Target infra: DigitalOcean (₹-friendly) or AWS depending on customer preference.
Managed Postgres (pgvector available on both).

Monitoring: Sentry for errors, simple Uptime Kuma or Better Uptime for `/healthz`.

### If prod breaks

Follow [docs/runbook.md](docs/runbook.md). Navanish is on-call by default during the build; rotate after go-live.

---

## 15. Money & AI cost control

LLM calls cost real money. Plan 01 has four AI features (no always-on agentic workloads) so our monthly AI spend per school should be modest — the proposal quotes ₹500–₹2000/month LLM cost for the customer. Guardrails:

- Every AI call writes an `AiJob` row with `tokens_in`, `tokens_out`, `cost_inr`.
- Each school has a monthly AI budget (`School.monthly_ai_budget_inr`); the `ai_bridge` refuses calls over 120% of budget (alerts at 80%).
- Embeddings are cached (same file = same embeddings; don't re-embed) — critical for the content-search feature.
- Question generation uses `claude-haiku-4-5` by default; only upgrade to `claude-opus-4-6` if teacher explicitly asks for "higher quality".
- Adaptive quiz difficulty selection is deterministic (no LLM on the hot path). Only wrong-answer explanations call the LLM, and the result is cached per `(question_id, chosen_option)`.
- Career Pilot responses are cached per (student, week) — regenerating on every dashboard load would be wasteful.
- Dev team's `ANTHROPIC_API_KEY` is capped at ₹2000/month by Anthropic billing limits.

---

## 16. Communication & escalation

| Channel       | Use for                                                             |
| ------------- | ------------------------------------------------------------------- |
| Daily standup | Status, blockers                                                    |
| GitHub PRs    | Code review, technical discussion                                   |
| Team chat (WhatsApp / Discord) | Quick questions, fun, non-urgent things            |
| GitHub Issues | Bugs, feature requests (link to PR when opened)                     |
| Video call (Google Meet) | Pair-programming, whiteboard, tough reviews              |
| `docs/adr/`   | Big architectural decisions with durable impact                     |

### When to escalate to Navanish (lead)

- You've been stuck > 2 hours.
- You need to spend money (a new tool, a paid tier).
- You think the plan itself is wrong — not just a tactical change.
- A production incident.

---

## 17. Glossary — jargon buster

| Term            | What it actually means                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------ |
| **Tenant**      | One school. "Multi-tenant" = our app serves many schools in one database.                         |
| **Model**       | A Python class that represents one table in the database.                                         |
| **Migration**   | An auto-generated script that modifies the database schema when a model changes.                  |
| **ORM**         | Object-Relational Mapper — lets you write `User.objects.filter(...)` instead of SQL.              |
| **DRF**         | Django REST Framework. Turns Django views into JSON API endpoints.                                |
| **ViewSet**     | A DRF class that handles list / create / retrieve / update / delete for a model in one place.     |
| **Serializer**  | DRF class that converts a model instance ⇄ JSON, with validation.                                 |
| **JWT**         | JSON Web Token. A signed string the server gives you at login; you send it back on every request. |
| **RLS**         | Row-Level Security. A Postgres feature that filters rows based on a session variable.             |
| **RAG**         | Retrieval-Augmented Generation. Look up relevant chunks → feed them to the LLM → get grounded answer. |
| **Embedding**   | A vector (list of numbers) that represents the *meaning* of a piece of text.                      |
| **pgvector**    | Postgres extension that stores embeddings and can search for similar ones.                        |
| **Celery**      | Python library to run tasks in the background (not blocking HTTP requests).                        |
| **Redis**       | Fast in-memory data store. Celery uses it as a queue.                                              |
| **Agent**       | An LLM call pattern where the model can use "tools" (our code) to fetch data before answering.    |
| **LangGraph**   | Library to build multi-step agent workflows.                                                       |
| **ADR**         | Architecture Decision Record. A short doc explaining *why* we chose X over Y.                     |
| **CI**          | Continuous Integration. Automated checks (tests, lint) that run on every PR.                       |
| **Staging**     | A copy of production we can break safely. Deploys there before prod.                              |
| **OpenAPI**     | A standard JSON/YAML description of an API. Django generates it; frontend uses it to auto-make types. |

---

## That's it

Read this once. Then dive into the folder you own. Every file in that folder has its own header telling you what to build inside it.

When in doubt: ask, read the ADR, or open Claude Code and paste the file's TODO section.

Let's ship. — Navanish
