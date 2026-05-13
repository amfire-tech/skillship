# Skillship Project — Full Audit Report

**Date:** 2026-04-30  
**Audited by:** Claude Code (on behalf of Vishal)  
**Purpose:** 2-week sprint to production — identify exactly what is done vs. remaining

---

## Quick Summary

| Area | Status |
|------|--------|
| Backend foundation (common, accounts, schools, academics) | ✅ Done |
| AI service (engines, routers, agents, RAG) | ✅ Done |
| Backend quizzes app | ❌ Empty |
| Backend content app | ❌ Empty |
| Backend analytics app | ❌ Empty |
| Backend notifications app | ❌ Empty |
| Backend ai_bridge app | ❌ Empty |
| Database — pgvector extension | ❌ Not installed |
| Database — RLS policies | ❌ Not applied |
| Database — old raw SQL tables | ⚠️ Still present (needs drop) |
| Seed data | ❌ Empty |
| Frontend admin schools page | ✅ Done (real API) |
| Frontend quiz listing (admin) | ⚠️ Hardcoded mock data |
| Frontend teacher/student/principal dashboards | ⚠️ Hardcoded / placeholder |
| Frontend quiz-taking flow | ❌ Not built |
| Frontend content upload | ❌ Not built |

---

## 1. Backend — File by File

### `backend/apps/common/` — ✅ DONE (Owner: Navanish)

| File | Status | Notes |
|------|--------|-------|
| `models.py` | ✅ Done | `TimeStampedModel`, `TenantQuerySet`, `TenantManager`, `TenantModel` — UUID pk, school FK, composite index, `.for_school()` manager |
| `viewsets.py` | ✅ Done | `TenantScopedViewSet` auto-scopes `get_queryset()` to school |
| `permissions.py` | ✅ Done | Role-based permissions |

---

### `backend/apps/accounts/` — ✅ DONE (Owner: Prashant)

| File | Status | Notes |
|------|--------|-------|
| `models.py` | ✅ Done | `User(AbstractUser)` with `Role` choices, UUID pk, email unique, school FK nullable, DB check constraints |
| `serializers.py` | ✅ Done | Read/Create/Update serializers, password write-only |
| `views.py` | ✅ Done | `UserViewSet`, `MeView`, login/logout |
| `urls.py` | ✅ Done | Wired |
| `migrations/` | ✅ Done | Applied to Supabase |

---

### `backend/apps/schools/` — ✅ DONE (Owner: Prashant)

| File | Status | Notes |
|------|--------|-------|
| `models.py` | ✅ Done | `School(TimeStampedModel)`, Board: CBSE/ICSE/STATE, Plan: CORE/AGENTIC, correct fields only |
| `serializers.py` | ✅ Done | |
| `views.py` | ✅ Done | `SchoolViewSet` |
| `urls.py` | ✅ Done | |
| `migrations/` | ✅ Done | Applied to Supabase |

---

### `backend/apps/academics/` — ✅ DONE (Owner: Prashant)

| File | Status | Notes |
|------|--------|-------|
| `models.py` | ✅ Done | `AcademicYear`, `Course` (Stream: AI/CODE/ROBOT/STEM/GENERAL), `Class`, `Enrollment` — all inherit TenantModel |
| `serializers.py` | ✅ Done | |
| `views.py` | ✅ Done | |
| `urls.py` | ✅ Done | |
| `migrations/` | ✅ Done | Applied to Supabase |

---

### `backend/apps/quizzes/` — ❌ EMPTY (Owner: **Vishal**)

| File | Status | What Needs to Be Written |
|------|--------|--------------------------|
| `models.py` | ❌ Empty | `QuestionBank(TenantModel)`, `Question(TenantModel)` (type: MCQ/TF/SHORT; difficulty: EASY/MEDIUM/HARD; options JSONField; correct_option_ids JSONField; ai_generated BooleanField), `Quiz(TenantModel)` (status: DRAFT/REVIEW/PUBLISHED/ARCHIVED; is_adaptive; randomize; duration_minutes), `QuizAttempt(TenantModel)`, `Answer(TenantModel)` |
| `serializers.py` | ❌ Empty | `QuestionSerializer` (teacher — shows correct answers), `QuestionStudentSerializer` (hides `correct_option_ids`), `QuizSerializer`, `QuizAttemptSerializer`, `AnswerSerializer` |
| `views.py` | ❌ Empty | `QuestionViewSet` (teacher-only write), `QuizViewSet` with `@action publish`, `@action start`, `AttemptViewSet` with `@action submit` |
| `services.py` | ❌ Empty | `publish_quiz()`, `start_attempt()`, `submit_answer()` (auto-grades MCQ/TF), `finalize_attempt()`, `next_adaptive_question()` |
| `urls.py` | ❌ Empty | Wire all viewsets under `/api/v1/quizzes/` |
| `migrations/` | ❌ Empty | Run `makemigrations quizzes` then `migrate` |

**Priority: HIGHEST — all other Vishal tasks depend on quizzes being in DB first.**

---

### `backend/apps/content/` — ❌ EMPTY (Owner: **Vishal**)

| File | Status | What Needs to Be Written |
|------|--------|--------------------------|
| `models.py` | ❌ Empty | `ContentItem(TenantModel)` (course FK, kind: VIDEO/PDF/ARTICLE/INTERACTIVE/COURSE, file_url, ai_tags JSONField, uploaded_by FK), `MarketplaceListing(TimeStampedModel)` — NOT tenant-scoped, public |
| `serializers.py` | ❌ Empty | `ContentItemSerializer`, `MarketplaceListingSerializer` |
| `views.py` | ❌ Empty | `ContentItemViewSet` (TenantScopedViewSet), `MarketplaceListingViewSet` (ReadOnly, AllowAny), `@action purchase` |
| `services.py` | ❌ Empty | `upload_content()`, `purchase_listing()` |
| `urls.py` | ❌ Empty | Wire under `/api/v1/content/` |
| `migrations/` | ❌ Empty | Run `makemigrations content` then `migrate` |

---

### `backend/apps/analytics/` — ❌ EMPTY (Owner: **Vishal**)

| File | Status | What Needs to Be Written |
|------|--------|--------------------------|
| `models.py` | ❌ Empty | `StudentDailyStats(TenantModel)`, `ClassWeeklyStats(TenantModel)`, `RiskSignal(TenantModel)` |
| `views.py` | ❌ Empty | `PrincipalDashboardView`, `TeacherDashboardView`, `StudentDashboardView`, `RiskSignalViewSet` |
| `services.py` | ❌ Empty | `build_principal_dashboard()`, `build_teacher_dashboard()`, `build_student_dashboard()`, `rebuild_daily_stats()` |
| `urls.py` | ❌ Empty | Wire under `/api/v1/analytics/` |
| `migrations/` | ❌ Empty | Run `makemigrations analytics` then `migrate` |

---

### `backend/apps/notifications/` — ❌ EMPTY (Owner: **Vishal**)

| File | Status | What Needs to Be Written |
|------|--------|--------------------------|
| `models.py` | ❌ Empty | `Notification(TenantModel)` (recipient FK, channel: IN_APP/EMAIL/SMS/PUSH, title, body, status: PENDING/SENT/FAILED/READ, sent_at, read_at), `NotificationTemplate(TenantModel)` |
| `views.py` | ❌ Empty | List own notifications, `@action mark_read`, `@action unread_count` |
| `services.py` | ❌ Empty | `send_notification()`, `mark_as_read()`, `deliver_email_async()` (Celery task) |
| `urls.py` | ❌ Empty | Wire under `/api/v1/notifications/` |
| `migrations/` | ❌ Empty | Run `makemigrations notifications` then `migrate` |

---

### `backend/apps/ai_bridge/` — ❌ EMPTY (Owner: **Navanish**)

| File | Status | What Needs to Be Written |
|------|--------|--------------------------|
| `models.py` | ❌ Empty | `AiJob(TenantModel)` (kind, status, request_json, response_json, tokens_in, tokens_out, cost_inr) |
| `client.py` | ❌ Empty | `AiClient` class using httpx, `X-Internal-Key` header, retry logic, methods: `career_roadmap()`, `generate_questions()`, `adaptive_next()`, `grade_short()`, `content_search()` |
| `services.py` | ❌ Empty | AiJob persistence wrapper around AiClient calls |
| `migrations/` | ❌ Empty | Run `makemigrations ai_bridge` then `migrate` |

---

## 2. AI Service — File by File

### `ai-service/app/` — ✅ MOSTLY DONE (Owner: Prashant)

| File | Status | Notes |
|------|--------|-------|
| `engines/adaptive_quiz.py` | ✅ Done | IRT-lite engine, `next_difficulty()` — 2 correct = go harder, 2 wrong = go easier |
| `engines/question_gen.py` | ✅ Done | `generate()` using Gemini JSON mode → `Question` Pydantic objects |
| `agents/career_pilot.py` | ✅ Done | `run()` using Gemini with JSON response_mime_type |
| `rag/retriever.py` | ✅ Done | pgvector cosine similarity search on `content_chunks`, school-scoped |
| `routers/quiz.py` | ✅ Done | `POST /quiz/generate`, `POST /quiz/adaptive-next`, `POST /quiz/grade-short` |
| `routers/career.py` | ✅ Done | `POST /career/ask` |
| `routers/content.py` | ✅ Done | `POST /content/search` |
| `config.py` | ✅ Done | Settings with `MODEL_NAME = "gemini-1.5-flash"` |

**Note:** `rag/retriever.py` requires pgvector to be installed in Supabase — currently NOT installed. Content search will fail until Navanish runs `001_pgvector.sql`.

---

## 3. Data / Database — File by File

### `data/seed/seed.py` — ❌ EMPTY (Owner: Prashant as lead)

Needs: 2 schools, MAIN_ADMIN user, principal+teacher+students per school, 1 academic year, 1 course, 1 quiz with questions, sample content items.

### `data/migrations_raw/001_pgvector.sql` — ❌ NOT APPLIED (Owner: Navanish)

```sql
-- What this file should contain / what Navanish must apply:
CREATE EXTENSION IF NOT EXISTS vector;
```
Without this, all semantic content search is broken.

### `data/migrations_raw/002_rls_policies.sql` — ❌ EMPTY (Owner: Navanish)

RLS is currently **OFF** on all Django tenant tables. Must be applied after Vishal's migrations run.

### `data/migrations_raw/003_analytics_views.sql` — ❌ EMPTY (Owner: **Vishal**)

Needs materialized views: `school_kpi_mv`, `class_perf_mv`, `student_trend_mv`.

---

## 4. Supabase Database Audit Findings

### pgvector extension
- **Status:** NOT INSTALLED
- **Impact:** `ai-service/app/rag/retriever.py` will fail at runtime
- **Fix:** Navanish must run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL editor

### Row-Level Security (RLS)
- **Status:** OFF on all Django tables (`accounts_user`, `schools_school`, `academics_*`, etc.)
- **Impact:** No DB-level tenant isolation — only application-level isolation via `TenantScopedViewSet`
- **Fix:** Navanish writes and applies `002_rls_policies.sql` after Vishal's migrations complete

### Old Raw SQL Tables (created before Django ORM approach)
These tables exist in the database but are NOT used by Django. They have wrong schema (forbidden fields, typos, separate role tables):

| Table | Problem |
|-------|---------|
| `school` | Has `email`, `phone`, `principal` fields — CLAUDE.md forbids these |
| `student`, `teacher`, `principal`, `sub_admin`, `super_admin` | Separate role tables — replaced by unified `accounts_user` |
| `user_auth` | Replaced by Django auth |
| `quiz_attempt` | Typo: column `attemp_id` instead of `attempt_id` |
| `class_section`, `course` | Old schema, replaced by `academics_*` tables |
| `marketplace_listing`, `notification_log`, `notification_template` | Old schema |
| `student_daily_stats`, `class_weekly_stats` | Old schema, will be replaced by Vishal's analytics models |
| `payment_transaction`, `subscriptionplans`, `platforms_config`, `region` | Legacy, not in scope |

**Action needed (Navanish decision):** Drop these tables once Django migrations are confirmed working. Draft drop script ready to produce on request.

### Django ORM Tables — Current State

| Table | Exists in Supabase | Has Data |
|-------|-------------------|----------|
| `accounts_user` | ✅ Yes | Likely empty |
| `schools_school` | ✅ Yes | Likely empty |
| `academics_academicyear` | ✅ Yes | Empty |
| `academics_class` | ✅ Yes | Empty |
| `academics_course` | ✅ Yes | Empty |
| `academics_enrollment` | ✅ Yes | Empty |
| `quizzes_*` | ❌ No — not migrated | — |
| `content_*` | ❌ No — not migrated | — |
| `analytics_*` | ❌ No — not migrated | — |
| `notifications_*` | ❌ No — not migrated | — |
| `ai_bridge_*` | ❌ No — not migrated | — |

---

## 5. Frontend — File by File

### `frontend/src/app/(dashboard)/dashboard/admin/schools/page.tsx` — ✅ DONE

Real API call using `getToken()` helper. Loading/error states. Confirm-remove dialog.

### `frontend/src/app/(dashboard)/dashboard/admin/quizzes/page.tsx` — ⚠️ HARDCODED (Owner: Pranav)

**Violation:** `const quizzes: QuizCard[] = [{ ... }, ...]` — 6 fake entries hardcoded.  
**Fix:** Replace with `useEffect` → `fetch(`${API_BASE}/quizzes/`)` once Vishal's quizzes API is live.

### `frontend/src/app/(dashboard)/dashboard/teacher/page.tsx` — ⚠️ HARDCODED (Owner: Pranav)

**Violations:**
- `const myClasses = [{ name: "Class 9A", ... }]` — hardcoded
- `const recentActivity = [{ label: "Science Quiz..." }]` — hardcoded
- `+ New Quiz` button does nothing

**Fix:** Wire to `/api/v1/academics/` and `/api/v1/quizzes/` once backend is live.

### `frontend/src/app/(dashboard)/dashboard/student/page.tsx` — ⚠️ HARDCODED (Owner: Pranav)

**Violations:**
- `const upcomingQuizzes = [...]` — hardcoded
- Progress ring: `const completed = 0; const total = 10` — hardcoded
- AI tools `href="#"` — go nowhere

**Fix:** Wire to `/api/v1/quizzes/`, `/api/v1/analytics/student/`, `/api/v1/content/search`.

### `frontend/src/app/(dashboard)/dashboard/principal/page.tsx` — ⚠️ PLACEHOLDER (Owner: Pranav)

All stats show `"—"`. Enrollment table says "Awaiting API". At-risk says "Sprint 7" (this is Plan 02 language — should be removed).

**Fix:** Wire to `/api/v1/analytics/principal/` once Vishal's analytics API is live.

### Missing Pages — ❌ NOT BUILT (Owner: Pranav)

| Page | Purpose |
|------|---------|
| `/dashboard/student/quiz/[id]` | Quiz-taking flow: question-by-question, timer, submit |
| `/dashboard/teacher/content/upload` | Upload PDF/video for a course |
| `/dashboard/teacher/quiz/create` | AI question generator UI → review → publish |
| `/dashboard/teacher/quiz/[id]/results` | Per-quiz results and class analytics |
| `/dashboard/student/career` | CareerPilot UI (calls `/api/career/ask`) |

---

## 6. Ownership Summary — Who Must Do What

### Vishal (YOU) — Backend Data Apps

**Week 1 (by 2026-05-07):**
- [ ] `backend/apps/quizzes/models.py` — 5 models
- [ ] `backend/apps/quizzes/serializers.py` — teacher vs student variants
- [ ] `backend/apps/quizzes/views.py` — ViewSets + actions
- [ ] `backend/apps/quizzes/services.py` — business logic
- [ ] `backend/apps/quizzes/urls.py` — wire routes
- [ ] Run `makemigrations quizzes && migrate`
- [ ] `backend/apps/content/models.py` — ContentItem + MarketplaceListing
- [ ] `backend/apps/content/serializers.py`, `views.py`, `services.py`, `urls.py`
- [ ] Run `makemigrations content && migrate`

**Week 2 (by 2026-05-14):**
- [ ] `backend/apps/analytics/models.py` — 3 models
- [ ] `backend/apps/analytics/views.py` — 3 dashboard views
- [ ] `backend/apps/analytics/services.py` — dashboard builders
- [ ] `backend/apps/analytics/urls.py`
- [ ] Run `makemigrations analytics && migrate`
- [ ] `backend/apps/notifications/models.py` — Notification + Template
- [ ] `backend/apps/notifications/views.py`, `services.py`, `urls.py`
- [ ] Run `makemigrations notifications && migrate`
- [ ] `data/migrations_raw/003_analytics_views.sql` — 3 materialized views

---

### Navanish — Backend Infrastructure + AI Bridge

- [ ] `backend/apps/ai_bridge/models.py` — AiJob model
- [ ] `backend/apps/ai_bridge/client.py` — httpx client with retry
- [ ] `backend/apps/ai_bridge/services.py` — AiJob persistence
- [ ] Run `makemigrations ai_bridge && migrate`
- [ ] Apply pgvector: `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase
- [ ] Write + apply `data/migrations_raw/002_rls_policies.sql` (after Vishal's migrations)
- [ ] Decision: drop old raw SQL tables (list above in Section 4)

---

### Prashant — AI Service + Seed Data

- [ ] Write `data/seed/seed.py` (2 schools, all roles, 1 quiz, sample content)
- [ ] Verify all AI service routers respond correctly end-to-end once Django is wired
- [ ] Confirm `content_chunks` table schema matches `rag/retriever.py` expectations

---

### Pranav — Frontend

- [ ] Remove all hardcoded mock arrays from quiz, teacher, student, principal pages
- [ ] Wire teacher dashboard to real academics + quizzes API
- [ ] Wire student dashboard to real quizzes + analytics API
- [ ] Wire principal dashboard to real analytics API
- [ ] Build quiz-taking flow page (`/dashboard/student/quiz/[id]`)
- [ ] Build teacher content upload page
- [ ] Build teacher quiz create/AI-generate page
- [ ] Build CareerPilot UI page
- [ ] All new files must have the file header (CLAUDE.md §8)

---

## 7. Critical Rules Reminder (from CLAUDE.md)

1. **Every model in a school context → inherits `TenantModel`**, never `models.Model`
2. **Every ViewSet → inherits `TenantScopedViewSet`**, never `ModelViewSet` directly
3. **No hardcoded arrays** in frontend — all data from real API calls
4. **No Plan 02 features**: no AI tutor, no risk alerts, no weekly reports, no orchestrator
5. **All IDs are UUIDs** — never sequential integers
6. **Board choices**: only `CBSE`, `ICSE`, `STATE`
7. **Plan choices**: only `CORE`, `AGENTIC`
8. **School fields that exist**: name, slug, board, city, state, address, plan, subscription_expires_at, is_active — nothing else
9. **LLM calls only through `ai_bridge/client.py`** — never call Gemini directly from Django
10. **File header required** on every new file (CLAUDE.md §8)
11. **No `Co-Authored-By: Claude`** in commits

---

## 8. 2-Week Sprint Plan

| Day | Vishal Target |
|-----|--------------|
| Day 1-2 | Write and migrate quizzes models + serializers |
| Day 3-4 | Write quizzes views, services, urls — test with Swagger |
| Day 5-6 | Write and migrate content models, serializers, views, services |
| Day 7 | Buffer / review / coordinate with Navanish on pgvector + RLS |
| Day 8-9 | Write and migrate analytics models, views, services |
| Day 10-11 | Write notifications models, views, services |
| Day 12 | Write `003_analytics_views.sql` materialized views |
| Day 13-14 | Integration testing, fix bugs, coordinate with Pranav on API contracts |

---

*Report generated 2026-04-30. Verify against current file state before acting — file contents may have changed.*
