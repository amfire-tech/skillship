# Skillship — Development Progress Report
**Prepared by:** amfire
**Date:** 16 May 2026 (Phase 2 sprint, live)
**Contract:** Plan 01 · Core AI · ₹49,999 · 12–14 weeks
**Milestone:** 03 — AI Integration (in flight)
**Report covers:** State of the `staging` branch as of 16 May 2026 (post-PR #18 + Phase 1 + Phase 2.1)

---

## Live Sprint Tracker — Phase 1 & 2

The "Navanish + Claude takeover" sprint started 16 May with the goal of taking Plan 01 to production. Phases are sequenced by dependency, not by team boundary. Tests added at each step.

### Phase 1 — Backend structural gaps · ✅ DONE
| # | Item | Files | Tests |
|---|---|---|---|
| 1.1 | AI bridge: `grade_short` + `generate_from_pdf` proxies (multipart) | `apps/ai_bridge/*`, migration `0002` | 20/20 |
| 1.2 | Quiz `rankings` endpoint (best-attempt-per-student, self-row outside top-N) | `apps/quizzes/views.py` | 9/9 |
| 1.3 | Marketplace `purchase` hardened (MAIN_ADMIN guard, cross-tenant course rejection) | `apps/content/*` | 6/6 |
| 1.4 | Analytics → Celery (`@shared_task` wrappers + daily/weekly fan-out + cron seed) | `apps/analytics/tasks.py`, migration `0002` | 5/5 |
| 1.5 | `reportlab` + `openpyxl` in `requirements.txt` | — | — |
| 1.6 | College Finder AI (state → city → specialization, NIRF-ranked) | `ai-service/app/agents/college_finder.py` + Django bridge + frontend form | manual ✓ |
| 1.7 | Frontend `apiFetch` wrapper with auto-refresh-on-401 | `frontend/src/lib/auth.ts` + 4 pages wired | manual ✓ |
| 1.8 | Test coverage for previously-untested apps (ai_bridge, quizzes, content, analytics, notifications) | various `tests/` | 55 new tests |

**Backend test totals: 136 → 191 → 202** (after Phase 2.1).
Real bugs caught during Phase 1 testing: multipart `data=list[tuple]` serialiser bug in `ai_bridge/client.py` (would have failed live PDF uploads).

### Phase 2 — Reports, analytics depth, automation

| # | Item | Status |
|---|---|---|
| 2.1 | **PDF + Excel report exports** (student / class / school) with role-scoped + tenant-scoped endpoints | ✅ DONE |
| 2.2 | **Skill-wise analytics** — per-tag accuracy / volume / pacing | ✅ DONE |
| 2.3 | **School + class benchmarking** — rank + percentile bands | ✅ DONE |
| 2.4 | **Monthly / yearly auto-report Celery task** (renders PDF + stores as `ContentItem`) | ✅ DONE |

#### Phase 2.1 — Report exports · ✅ done 16 May
- **`apps/analytics/exports.py`** — `DateRange`, three `assemble_*` builders (student / class / school), and two stateless renderers (`render_pdf` via reportlab, `render_xlsx` via openpyxl). Same data → both formats.
- **Three endpoints** wired in [analytics/urls.py](backend/apps/analytics/urls.py):
  - `GET /api/v1/analytics/reports/student/{id}/export/?fmt=pdf|xlsx&from=&to=`
  - `GET /api/v1/analytics/reports/class/{id}/export/?fmt=pdf|xlsx&from=&to=`
  - `GET /api/v1/analytics/reports/school/{id}/export/?fmt=pdf|xlsx&from=&to=`
- **Role / tenant gates** enforced in views (`apps/analytics/views.py`):
  - Student: own report only.
  - Teacher / Principal / Sub-Admin: any student/class in their school.
  - School report: PRINCIPAL+ scope only.
  - Cross-tenant lookup → 404 (don't reveal existence).
- **Tests:** [tests/test_exports.py](backend/apps/analytics/tests/test_exports.py) — 11 tests, all green. Asserts PDF magic bytes, XLSX zip integrity, role denials, invalid date range, format whitelist, cross-tenant 404.
- **Bug caught**: DRF's `DefaultContentNegotiation` intercepts `?format=` and 404s when no renderer matches the value. Endpoints now use `?fmt=pdf|xlsx` to bypass the trap. Documented in the `_resolve_format` docstring.

#### Phase 2.2 — Skill-wise analytics · ✅ done 16 May
- **`apps/analytics/skills.py`** — `compute_student_skill_breakdown` and `compute_class_skill_breakdown`. Source of truth is `Question.tags` (existing JSONField — no migration needed). Counts only over SUBMITTED attempts in the date window. Untagged questions roll into `_untagged` so they're not invisible. Strongest skill first (highest accuracy, ties by volume).
- **Two endpoints** in [analytics/urls.py](backend/apps/analytics/urls.py):
  - `GET /api/v1/analytics/dashboards/student/skills/?student_id=&from=&to=`
  - `GET /api/v1/analytics/dashboards/class/{id}/skills/?from=&to=`
- **Tenancy + roles**: Student → own only; Teacher/Principal/Sub-Admin → any student or class in same school; Main Admin → any. Cross-tenant 404.
- **Response shape**: per-tag rows with `{tag, attempts, correct, accuracy_pct, avg_time_sec, points_earned, points_total}`. Front-end can chart accuracy bars + pacing scatter directly off this.
- **Tests:** [tests/test_skills.py](backend/apps/analytics/tests/test_skills.py) — 9 tests, all green. Covers math, untagged bucket, IN_PROGRESS exclusion, cross-tenant 404, role gates.
- **Backend test totals: 202 → 211.**

#### Phase 2.3 — School + class benchmarking · ✅ done 16 May
- **`apps/analytics/benchmarking.py`** — `compute_class_benchmarking` (cross-class within a school) and `compute_school_benchmarking` (cross-school for MAIN_ADMIN). Reads from `ClassWeeklyStats` (Celery-populated in 1.4) so the dashboard read path stays cheap.
- **Endpoint**: `GET /api/v1/analytics/benchmarking/?level=class|school&from=&to=` ([analytics/urls.py](backend/apps/analytics/urls.py)).
  - `level=class` — staff in their own school; MAIN_ADMIN must pass `?school_id=` explicitly.
  - `level=school` — MAIN_ADMIN only.
- **Response shape** per row: `{rank, label, avg_score, at_risk, percentile, delta_median}` where `percentile` is the band string (`Top 10%`, `Top 25%`, `Top 50%`, `Bottom 50%`, `Bottom 25%`).
- **Tests**: [tests/test_benchmarking.py](backend/apps/analytics/tests/test_benchmarking.py) — 9 tests, all green. Asserts ranking, median, percentile bands, role gates, cross-tenant isolation, invalid input rejection.
- **Backend test totals: 211 → 220.**

#### Phase 2.4 — Monthly / yearly auto-report Celery task · ✅ done 16 May
- **`analytics.generate_school_report(school_id, start, end, label)`** — per-school task. Calls `assemble_school_report` + `render_pdf`, saves the bytes via `default_storage.save()` (configured to `FileSystemStorage` at `MEDIA_ROOT/auto-reports/<slug>/...`), and creates a `ContentItem` of `kind=PDF` titled `[Auto Report] <label> — <school name>` so principals can find it in their Content module. Retries with exponential backoff on transient errors.
- **Two fan-outs** scheduled via [migrations/0003_seed_report_tasks.py](backend/apps/analytics/migrations/0003_seed_report_tasks.py):
  - `analytics.fan_out_monthly_reports` — 03:30 IST on the **1st of each month**, generates the previous month's PDF.
  - `analytics.fan_out_yearly_reports` — 04:00 IST on **Jan 1**, generates the previous year's PDF.
- **`STORAGES["default"]`** wired in `config/settings/base.py` (it was missing — added `FileSystemStorage` + `MEDIA_URL` / `MEDIA_ROOT`). Production swap to S3/Supabase storage = change one dict entry.
- **Tests**: [tests/test_auto_reports.py](backend/apps/analytics/tests/test_auto_reports.py) — 9 tests, all green. Asserts date math (last-month wraps Dec correctly), per-school ContentItem creation, skip-when-no-data, skip-when-no-course, fan-out cardinality, beat schedule rows installed by migration.

---

### Phase 2 — Total impact

| | Before Phase 2 | After Phase 2 |
|---|---|---|
| Endpoints | 12 | **18** (+ 3 report exports + 2 skill breakdowns + 1 benchmarking) |
| Celery tasks | 4 | **7** (+ generate_school_report + fan_out_monthly + fan_out_yearly) |
| Beat schedules | 2 | **4** (+ monthly + yearly) |
| Backend tests | 191 | **229** (+38 new tests across exports / skills / benchmarking / auto-reports) |
| Migration count | 9 | **11** (analytics 0003, ai_bridge already at 0003) |

All 229 tests green, zero regressions on prior 191. Tenant isolation contract (`test_isolation.py`) still 7/7.

---

### Phase 3 — Frontend wiring pass · ✅ DONE 16 May

The 21-page "placeholder" estimate from the audit was wrong. A grep for any of `placeholder | TODO | mock | hardcoded` flagged pages that already had real API calls — those substrings were comments or fallback render branches. A second pass counting actual `${API_BASE}` calls per file showed **only 2 pages were truly placeholder** with zero real fetches: `admin/reports` and `admin/settings`. Plus a couple were wired but to the wrong shape.

#### Pages re-wired in Phase 3
| Page | What changed |
|---|---|
| [student/results/page.tsx](frontend/src/app/(dashboard)/dashboard/student/results/page.tsx) | Switched to `apiFetch` (auto-refresh on 401). Adapted to real serializer field names — `score_percent`, `correct_count`, `wrong_count`, `submitted_at`, `passed`. Backward-compatible fallbacks kept for legacy keys. |
| [student/certificates/page.tsx](frontend/src/app/(dashboard)/dashboard/student/certificates/page.tsx) | Was hitting non-existent `/certificates/`. Re-pointed at `/quizzes/attempts/` and derives certificates client-side from passed submitted attempts. |
| [admin/reports/page.tsx](frontend/src/app/(dashboard)/dashboard/admin/reports/page.tsx) | **Full rewrite.** Was 100% hardcoded data + disabled buttons. Now: school picker → fetch `/schools/`, two download cards that hit `GET /analytics/reports/school/<id>/export/?fmt=pdf|xlsx`, an "Auto-Generated Reports" list pulled from `/content/items/?kind=PDF` (filtered to `[Auto Report]` titles produced by the Phase 2.4 Celery task), and a Custom Date Range modal that fires a real download. |

#### Backend side-changes that fell out of Phase 3
- [quizzes/serializers.py](backend/apps/quizzes/serializers.py) — `QuizAttemptReadSerializer` enriched with `quiz_title`, `quiz_subject`, `quiz_total_questions`, `wrong_count`, `passed`. Same shape the frontend already expected; zero migrations required. Existing tests still green (16/16 quizzes).

#### Pages confirmed wired by PR #18 (no Phase 3 work needed)
`admin/schools`, `admin/users`, `admin/quizzes/list+new+[id]`, `admin/analytics`, `admin/marketplace/new`, `admin/sub-admins`, `principal/students`, `principal/classes`, `principal/teachers`, `principal/analytics`, `principal/ai-summary`, `principal/reports`, `sub-admin/page + question-bank + quizzes/new + schools + users`, `teacher/*` (already real). Each was checked with a grep for `${API_BASE}` and confirmed to make real fetches.

#### Deliberately deferred
- **`admin/settings`** — platform-level settings (org branding, integrations, security panels). Per-school settings already exist (`/schools/{id}/settings/`); platform-wide settings is closer to Plan 02 territory and not on the critical path. Left as-is.
- **`/users/bulk-upload/`** — multiple pages call this; endpoint doesn't exist yet. Belongs to Phase 4 (CSV bulk import).

#### Test status
Frontend type-check (`tsc --noEmit`) — zero errors on touched files.
Backend full pytest — **229/229 passing** (no regressions from the serializer enrichment).

---

### Phase 4 — Quiz assignment + CSV bulk imports · ✅ DONE 16 May

#### Phase 4.1–4.3 — Quiz assignment
- **New model `QuizAssignment`** in [quizzes/models.py](backend/apps/quizzes/models.py): tenant-scoped, with `quiz` FK, `assigned_by` FK, two nullable target FKs (`student` OR `klass`). DB-level **`CheckConstraint`** enforces *exactly one of the two is set*. Conditional **`UniqueConstraint`s** prevent duplicate (quiz, student) and (quiz, class) pairs. Migration: [quizzes/0002_quiz_assignment.py](backend/apps/quizzes/migrations/0002_quiz_assignment.py), applied on staging.
- **Serializer** with cross-FK same-school validation, denormalized display fields (`quiz_title`, `student_name`, `class_label`), and a `validate()` that rejects non-PUBLISHED quizzes + enforces "exactly one target" at the API layer too.
- **`QuizAssignmentViewSet`** at `/api/v1/quizzes/assignments/`:
  - Students see only assignments addressed to them — directly via `student=me` OR transitively via class assignments where they're currently enrolled (`Q(student=me) | Q(klass__in=enrolled_classes)`).
  - Teacher / Principal / Sub-Admin → everything in their school.
  - MAIN_ADMIN → cross-school.
- **Bug caught & fixed**: DRF's `ModelSerializer` auto-generated two `UniqueTogetherValidator`s from the conditional `UniqueConstraint`s. Those validators require ALL fields in their tuple to be present — which conflicts with the "exactly one target" rule (klass=None when assigning to a student). Fixed by setting `Meta.validators = []`; DB-level constraints still surface uniqueness violations as `IntegrityError` → 400.
- **Tests**: [tests/test_assignments.py](backend/apps/quizzes/tests/test_assignments.py) — **14 tests, all green.** Covers anon block, student role gate, both target types, "exactly one target" rule, draft-quiz rejection, cross-tenant target rejection, student-via-class visibility, principal_b cross-tenant blindness, delete role gate, DB check + unique constraints.

#### Phase 4.4 — CSV bulk question import
- **Endpoint**: `POST /api/v1/quizzes/banks/{id}/import-csv/` (multipart `file=` field).
- **Service** in [quizzes/services.py](backend/apps/quizzes/services.py): `import_questions_csv(bank, created_by, csv_text)` parses with stdlib `csv.DictReader`, validates required columns (`text, type, difficulty, points`), and builds Question rows per type:
  - MCQ: `option_a/b/c/d` cells + `correct=A/B/C/D` (supports multi-select via `A,C`).
  - TRUE_FALSE: `correct=True/False`.
  - SHORT_ANSWER: `accepted_answers=delhi|new delhi` (pipe-separated, normalised lowercase).
  - Optional `tags=math|geometry`, `explanation`.
- **Response**: `{total_rows, created, errors: [{row, message}, ...]}`. Bad rows don't block good ones — partial success is the contract.
- **Tests**: [tests/test_csv_import.py](backend/apps/quizzes/tests/test_csv_import.py) — **7 tests, all green.** Covers all three question types, per-row error reporting, missing-column abort, cross-tenant 404, file-level rejections (no file / non-UTF-8 / oversize).

#### Phase 4.5 — Users CSV bulk-upload
- **Endpoint**: `POST /api/v1/users/bulk-upload/` — the endpoint multiple frontend pages were already calling.
- **Service** in [accounts/bulk.py](backend/apps/accounts/bulk.py): `import_users_csv(actor, csv_text)`.
- **Role gate**: only STUDENT / TEACHER / SUB_ADMIN can be created via bulk upload. MAIN_ADMIN / PRINCIPAL rows are rejected per-row.
- **Tenant rules**:
  - MAIN_ADMIN must provide `school=<slug|uuid>` per row.
  - PRINCIPAL: any `school` column is **ignored** and rows are pinned to the actor's school (defence against a malicious uploader).
- **Tests**: [tests/test_bulk_upload.py](backend/apps/accounts/tests/test_bulk_upload.py) — **10 tests, all green.** Covers anonymous block, teacher/student blocks, principal happy path, role whitelist enforcement, principal-ignores-cross-school-column, main-admin school resolution by slug, unknown school rejection, missing columns, partial-success row reporting.

#### Phase 4 — Total

| | Pre Phase 4 | **Post Phase 4** |
|---|---|---|
| Endpoints | 18 | **20** (+ `/assignments/`, `/banks/{id}/import-csv/`, `/users/bulk-upload/`) |
| New models | — | **+1 (QuizAssignment)** |
| Migrations applied | 11 | **12** |
| Backend tests passing | 229 | **260** (+31 new tests) |
| Overall Plan 01 | ~88% | **~93%** |

All 260 tests green. `test_isolation.py` still 7/7.

#### Phase 4.8 — Frontend wiring for Phase 4 features · ✅ done 16 May

Mindful, additive changes — every touched file kept its existing API and prior tests still pass. Each new piece uses `apiFetch` for auto-refresh-on-401.

| File | Change |
|---|---|
| [teacher/quizzes/[id]/page.tsx](frontend/src/app/(dashboard)/dashboard/teacher/quizzes/[id]/page.tsx) | **Assign button** added (only for PUBLISHED quizzes, matching backend rejection rule). New **Assignments** section below details listing existing assignments with role badges (`STUDENT` / `CLASS`), due-date display, and per-row Revoke. New **AssignModal** component: target toggle (single student / entire class), real-fetch dropdowns of `/users/?role=STUDENT` and `/academics/classes/`, optional due datetime, POSTs to `/quizzes/assignments/` and refreshes on success. Surfaces backend error messages verbatim (incl. the "Only PUBLISHED quizzes can be assigned" + cross-tenant rejections from the serializer). |
| [student/quizzes/page.tsx](frontend/src/app/(dashboard)/dashboard/student/quizzes/page.tsx) | New **"Assigned to you"** section at the top of the page (hidden when empty). Pulls `/quizzes/assignments/` — students see both direct (`student=me`) and class (`klass in my enrollments`) assignments. Each card shows `Personal` vs `Class` badge, due-date with **overdue** styling, links to existing start-quiz route by `quiz` UUID. Pre-existing "browse all published" grid below is untouched. |
| [sub-admin/question-bank/page.tsx](frontend/src/app/(dashboard)/dashboard/sub-admin/question-bank/page.tsx) | Replaced the broken auto-trigger `/questions/bulk-upload/` (404) with a **BulkUploadCsvModal**: bank picker (fetches `/quizzes/banks/`), CSV file picker, submits to the real `/banks/{id}/import-csv/`. Renders the backend's per-row error report inline (collapsible `<details>` with row number + message). Drops unused `fileInputRef` + `useRef` import. |
| [principal/students/page.tsx](frontend/src/app/(dashboard)/dashboard/principal/students/page.tsx) and [principal/teachers/page.tsx](frontend/src/app/(dashboard)/dashboard/principal/teachers/page.tsx) | Bulk-upload handlers already pointed at `/users/bulk-upload/` (which is now real). Tightened the success/error UX: separate toasts for `created` and `errors` counts; the first row error surfaces in the toast, full list goes to `console.warn` for follow-up. Removed the stale `form.append("role", ...)` line — backend reads role per-row from the CSV. |

**Result handling on every Phase 4.8 page** mirrors the backend response shape exactly:
```json
{"total_rows": N, "created": M, "errors": [{"row": 2, "message": "..."}]}
```
So partial-success uploads (a CSV with 9 good rows and 1 bad) show **"Imported 9 — 1 row skipped — row 7: <reason>"** rather than misleading "Imported successfully".

**Type-check** (`tsc --noEmit`) — zero errors on every touched file.
**Backend test totals: 260/260 still green** (no backend changes in 4.8 — only frontend wiring).

---

## Executive Summary

Since the 13 May report, Pranav's frontend RBAC PR (#18) landed on staging adding 23,000+ lines across all five role dashboards — Principal, Sub-Admin, Teacher, and Student now have full sub-pages (analytics, classes, students, teachers, reports, AI-summary, certificates, career, exam-alerts, progress, rankings, results, content, question-bank, feedback, ai-tools, etc.), plus shared shells (`CommandPalette`, `NotificationsBell`, `DashboardError`, `EmptyState`, `TableRowSkeleton`), Jest setup, and unit tests for auth/role-guard.

Milestone 02 deliverables — *"all screens on staging + APIs functional"* — are effectively met. The platform now moves into Milestone 03 territory: closing the last placeholder pages, finishing PDF/Excel exports, rankings, the `grade-short` bridge, and tightening end-to-end QA against the AI service.

---

## Plan 01 Proposal — Feature-by-Feature Status

Mapped directly against the Plan 01 column of the signed proposal (Pricing section, p.6–7).

### Platform Foundation — COMPLETE
| Proposal Feature | Status |
|---|---|
| School-based login & data isolation | Done — `TenantModel` + `TenantScopedViewSet`, composite indexes, cross-school leakage structurally impossible |
| 5 user roles with granular permissions | Done — DB `CheckConstraint` enforces role/school invariant |
| JWT + Refresh token + Rate limiting | Done — 15-min access, 7-day refresh, blacklist on logout, rotation; 120/30 rpm |
| SEO-optimized public website | Done — `metadataBase`, `openGraph`, per-page metadata exports |
| Marketplace — browse, purchase & enroll | Backend Done · Frontend list pages live · purchase/enroll flow still on placeholder |

### Quiz & Assessment Engine — MOSTLY COMPLETE
| Proposal Feature | Status |
|---|---|
| Timed quizzes — auto score + class rankings | Auto-score Done · **class rankings endpoint not started** |
| Quiz approval workflow (Draft → Review → Publish) | Done — full state machine + 4 workflow endpoints |
| Randomized questions per attempt (anti-copy) | Done — `random.sample` on attempt start |
| Unlimited question bank + bulk import | Manual entry Done · **CSV bulk import not started** |
| Teacher-assigned practice tests | **Not started** — assignment model + endpoint pending |

### Analytics & Reports — PARTIAL
| Proposal Feature | Status |
|---|---|
| Skill-wise analytics + time vs accuracy graphs | Time/score graphs Done · **per-skill/tag dimension pending** |
| School & class benchmarking | **Pending** — cross-class comparison query not built |
| PDF + Excel report exports | **Not started** — `reportlab` / `openpyxl` not installed; download buttons unwired |
| Monthly + yearly progress reports | **Pending** — Celery task stub exists, body not implemented |
| Academic year management | Done — years, classes, courses, enrollments all CRUD |

### AI Features (Plan 01 scope) — COMPLETE on AI service · BRIDGE GAP
| Proposal Feature | Status |
|---|---|
| AI Career Pilot — personalized career guidance per student | Live — `POST /api/career/ask` via Gemini |
| Adaptive quiz engine (difficulty adjusts to history) | Live — `POST /api/quiz/adaptive-next` |
| AI question generator from uploaded content (PDF → MCQs) | Live — `POST /api/quiz/generate` + `/generate-from-pdf` |
| Natural language content search | Live — `POST /api/content/search` (Gemini + pgvector RAG) |
| AI student risk alerts | Out of scope — Plan 02 only (correctly commented out) |

### Plan 02 — Correctly excluded
All Plan 02 routers (`/api/tutor/ask`, `/api/reports/weekly`, `/api/risk/scan`, `/api/content/tag`) are commented out in `ai-service/app/main.py` and confirmed unmounted. No leakage of Plan 02 code into Plan 01 surface.

---

## Frontend — State After PR #18

### Pages fully wired to real APIs
- Student dashboard (`/dashboard/student`) — pulls `/quizzes/`, `/quizzes/attempts/`, `/auth/me/`
- Teacher dashboard (`/dashboard/teacher`) — pulls `/academics/classes/`, `/quizzes/`, calls `/quizzes/generate/`
- Admin home + schools + users + sub-admins lists
- Auth flow (login, refresh via httpOnly cookie, forgot-password)
- Role guard middleware + unit tests (Jest setup live)

### Pages still on placeholder / TODO data (21 files)
These pages render but read from in-component arrays or stubs — wiring to backend pending:

**Admin** — `analytics`, `marketplace/new`, `quizzes` (list, new, [id]), `reports`, `schools` (list, new), `users` (list, new/[role]), `settings`, home page widgets
**Principal** — `classes`, `students`, `teachers`
**Sub-Admin** — home, `question-bank`
**Student** — `career`, `certificates`, `results`

### New shells/components added by PR #18
`CommandPalette`, `NotificationsBell`, `DashboardError`, `EmptyState`, `TableRowSkeleton`, per-role `error.tsx` + `layout.tsx`, `frontend/.eslintrc.json`, `jest.config.ts`, `jest.setup.ts`, auth/role-guard unit tests.

---

## Backend — State

| Module | Status |
|---|---|
| `accounts` | Done — users, roles, JWT, role/school invariant |
| `schools` | Done — full CRUD, MAIN_ADMIN scoped |
| `academics` | Done — years, classes, courses, enrollments (+ bulk enrollment CSV) |
| `quizzes` | Done core: banks, questions, quizzes, approval workflow, attempts. **Missing:** rankings/leaderboard, CSV question import, student-level assignment |
| `content` | Done: upload, ingest → pgvector. Marketplace listing read-only viewset live |
| `analytics` | Models + Celery jobs + role dashboards + materialized views Done. **Missing:** skill-wise breakdown, benchmarking, exports |
| `notifications` | Done — model, services, ViewSet with `mark-read` actions |
| `ai_bridge` | Done for career, quiz/generate, adaptive-next, content/search. **Missing:** `grade-short` proxy |

---

## AI Service — State

| Endpoint | Plan | Status |
|---|---|---|
| `POST /api/career/ask` | 01 | Live · Gemini |
| `POST /api/quiz/generate` | 01 | Live · Gemini |
| `POST /api/quiz/generate-from-pdf` | 01 | Live · Gemini |
| `POST /api/quiz/adaptive-next` | 01 | Live · Gemini |
| `POST /api/quiz/grade-short` | 01 | Live in AI service · **Django bridge proxy missing** |
| `POST /api/content/search` | 01 | Live · Gemini + pgvector |
| `POST /api/content/ingest` | 01 | Live |
| `tutor`, `risk`, `reports`, `content/tag` | 02 | Correctly disabled (commented in `main.py`) |

---

## What is Remaining — Milestone 03 + 04 Punch List

### High priority (blocks Milestone 03 — AI Integration Complete · 25% payment)
1. **Wire 21 placeholder pages to real APIs** — owner Pranav
2. **`grade-short` Django bridge** in `ai_bridge/client.py` + ViewSet action — owner Navanish/Prashant
3. **Class rankings / leaderboard endpoint** (`GET /api/v1/quizzes/{id}/rankings/`) — owner Navanish
4. **PDF + Excel report exports** — add `reportlab` + `openpyxl` to backend requirements, build `/analytics/reports/{type}/export/?format=pdf|xlsx` — owner Navanish
5. **Wire frontend "Download Report" + "Create Quiz" + "Create Marketplace Listing" forms** — owner Pranav

### Medium priority (Milestone 04 — Production Launch · 25% payment)
6. **Skill-wise analytics** — add `skill_tag` dimension to `StudentDailyStats`, aggregate in Celery — owner Navanish
7. **School & class benchmarking endpoint** — cross-class comparison query — owner Navanish
8. **Teacher → student quiz assignment** — `QuizAssignment` model + endpoint + UI — owner Navanish + Pranav
9. **Monthly / yearly progress report Celery job** — fill in stubbed task — owner Navanish
10. **Remove "AI Tutor" / Plan 02 cards** from any student dashboard widgets — owner Pranav

### Low priority (nice-to-have before launch)
11. **Bulk question bank CSV import** — owner Vishal/Navanish
12. **End-to-end QA across all 5 roles** on staging — full role validation, AI accuracy checks (Phase 05 of proposal)
13. **Production deployment** — DNS, SSL, handover docs, AI model tuning (Phase 07)

---

## Module Completion Snapshot

| Module | % Complete (was 13 May → now 16 May) |
|---|---|
| Platform Foundation | 100% → 100% |
| Academic Management | 100% → 100% |
| Quiz Engine | 75% → 75% |
| Content & Marketplace | 70% → 75% |
| Analytics & Reports | 50% → 50% |
| Notifications | 100% → 100% |
| AI Service (Plan 01) | 95% → 95% |
| Frontend UI screens | 85% → **100%** (all role sub-pages now exist) |
| Frontend API wiring | 45% → **70%** (PR #18 wired core dashboards) |
| **Overall Plan 01** | **~75% → ~82%** |

---

## Timeline to Plan 01 Completion

12 days remain in the 14-week window. Outstanding work fits comfortably:

| Days | Focus | Owner |
|---|---|---|
| 1–4 | Wire remaining 21 placeholder pages · `grade-short` bridge · leaderboard endpoint | Pranav · Navanish |
| 5–7 | PDF/Excel exports · skill-wise analytics · benchmarking | Navanish |
| 8–10 | Teacher quiz assignment · monthly report job · CSV import · final UI polish | Navanish · Pranav · Vishal |
| 11–12 | End-to-end QA, role validation, staging walkthrough (Phase 06) | All |

---

*Report prepared by amfire · contact@amfire.in*
*Reflects state of `staging` branch at commit `d3711b2` (PR #18 merged 16 May 2026).*
