# Skillship — Platform Owner Admin Guide

> A short, opinionated reference for the day-to-day operator. If you're the
> MAIN_ADMIN for the Skillship platform, this is the page you read first.

For deploy / infra topics see [`infra/DEPLOY.md`](infra/DEPLOY.md).
For per-role QA see [`QA_CHECKLIST.md`](QA_CHECKLIST.md).

---

## 1 · Who you are

- **MAIN_ADMIN**: full platform — every school, every user, every quiz.
  No `school` attached to your user record (`school_id = NULL` by design).
- **You are the only role that can:**
  - Create new schools (`/dashboard/admin/schools` → Add School)
  - Onboard new MAIN_ADMINs or SUB_ADMINs
  - Cross-school analytics + benchmarking
  - View the `AiJob` audit table (which captures every AI call's cost)

Everyone else is school-scoped. A PRINCIPAL sees only their school's data.
A TEACHER sees only their classes. A STUDENT sees only themselves.

---

## 2 · Onboarding a new school (the 5-minute flow)

1. **Sign in** as MAIN_ADMIN.
2. Go to **Dashboard → Schools → + Add School**.
3. Fill in:
   - **Name** — full legal name (shown on report PDFs).
   - **Slug** — short lowercase id used in URLs and file paths. Don't change later.
   - **Board** — `CBSE`, `ICSE`, or `STATE`.
   - **City / State** — for analytics + regional benchmarking.
   - **Plan** — `CORE` (this engagement) or `AGENTIC` (Plan 02, future).
4. Save. School is now active.
5. **Create the school's principal**: Users → + Add User → role `PRINCIPAL`, school = the new one. Set a temporary password and tell the principal to change it on first login.
6. **Optional bulk-onboard staff + students**: Hand the principal the CSV template (see §3 below). They upload via Principal → Students → Bulk Upload.

---

## 3 · CSV templates for bulk imports

### Users (`/api/v1/users/bulk-upload/` or the UI button in Principal → Students/Teachers)

Required columns: `username,email,first_name,last_name,role,password`
Optional: `admission_number`, `school` (slug or UUID — MAIN_ADMIN only)

```csv
username,email,first_name,last_name,role,password,admission_number
ananya.k,ananya.k@school.test,Ananya,Kapoor,STUDENT,Pass!2026,A-2026-001
rahul.i,rahul.i@school.test,Rahul,Iyer,TEACHER,Pass!2026,
```

Rules:
- `role` must be one of `STUDENT`, `TEACHER`, `SUB_ADMIN`. (MAIN_ADMIN and PRINCIPAL cannot be created via bulk upload — onboard them manually.)
- For PRINCIPAL uploads, any `school` column is **ignored** — rows land in the actor's own school.
- Password must be ≥ 6 chars.
- Bad rows are skipped per-row; good rows still import. The response tells you which rows failed and why.

### Questions (`/api/v1/quizzes/banks/{id}/import-csv/` or the UI in Sub-Admin → Question Bank → Bulk Upload)

Required columns: `text,type,difficulty,points`
Per-type extras:
- **MCQ**: `option_a, option_b, option_c, option_d, correct=A/B/C/D` (multi-select: `A,C`)
- **TRUE_FALSE**: `correct=True` or `correct=False`
- **SHORT_ANSWER**: `accepted_answers=delhi|new delhi` (pipe-separated, normalised lowercase)

Optional: `tags=math|geometry`, `explanation`

```csv
text,type,difficulty,points,option_a,option_b,option_c,option_d,correct,accepted_answers,tags,explanation
"What is 2+2?",MCQ,EASY,1,3,4,5,6,B,,math|arithmetic,Basic addition
"Earth is flat?",TRUE_FALSE,EASY,1,,,,,False,,geography,
"Capital of India?",SHORT_ANSWER,MEDIUM,2,,,,,,delhi|new delhi,geography,
```

---

## 4 · Watching the AI cost meter

Every call through `ai_bridge` writes an **AiJob** row with model used, token counts, and rupee cost. To audit:

```sql
-- Run via Django admin or `manage.py dbshell`
-- Last 7 days of AI activity by school, summarised.
SELECT
  s.name AS school,
  j.kind,
  COUNT(*)                 AS calls,
  ROUND(SUM(j.cost_inr)::numeric, 2) AS total_inr,
  ROUND(AVG(j.duration_ms)::numeric) AS avg_ms,
  SUM(j.tokens_in)         AS in_tokens,
  SUM(j.tokens_out)        AS out_tokens
FROM ai_bridge_aijob j
JOIN schools_school s ON s.id = j.school_id
WHERE j.created_at > NOW() - INTERVAL '7 days'
  AND j.status = 'DONE'
GROUP BY s.name, j.kind
ORDER BY total_inr DESC;
```

If a school is spiking (e.g. >₹200/day), check:
1. Are they running a quiz-generation marathon?
2. Did an integration loop start hammering `/api/career/ask`?
3. Time to enforce a per-school monthly cap (model column reserved for this; not yet implemented).

---

## 5 · Operational tasks

### Reset a user's password

Django admin (`/admin/`) → Accounts → User → pick → set password.

Or via shell on the VPS:
```bash
docker compose -f infra/docker-compose.prod.yml exec backend python manage.py shell -c "
from apps.accounts.models import User
u = User.objects.get(email='someone@school.test')
u.set_password('TempPass!2026')
u.save(update_fields=['password'])
print('OK')
"
```

### Deactivate (not delete) a school

`/dashboard/admin/schools/<id>` → toggle `is_active=false`. Their users can still log in (so they can export their own data), but the school no longer appears in active rollups, the monthly Celery report task skips it.

### Hard-delete a school (with all its data)

This is irreversible. Only do this after confirmed termination + data-retention policy.

```bash
docker compose -f infra/docker-compose.prod.yml exec backend python manage.py shell -c "
from apps.schools.models import School
School.objects.get(slug='gone-school').delete()
"
```

Because every tenant model has `on_delete=CASCADE` from `school`, this wipes users, courses, classes, quizzes, attempts, answers, content, assignments — everything tied to that school.

### Look at a specific student's quiz history

`/dashboard/admin/users/<student-id>` shows profile. Their attempts are at `/api/v1/quizzes/attempts/?student=<id>` (use Swagger or DevTools). For a quick view, the principal of their school sees the same data via `/dashboard/principal/students/<id>`.

### Generate a school report on demand (instead of waiting for the monthly cron)

`/dashboard/admin/reports` → pick school → period or custom date range → **PDF** or **Excel** button.

This is the same code path the Celery task uses, just triggered manually.

---

## 6 · The 4 Plan 01 AI features at a glance

| Feature | Where in UI | Who can use it |
|---|---|---|
| Career Pilot chat | `/dashboard/student/career` | STUDENT |
| College Finder | `/dashboard/student/career` → College Finder tab | STUDENT |
| Adaptive quiz engine | Auto-fires inside quiz-taking when `Quiz.is_adaptive=True` | STUDENT |
| AI question generator (topic) | `/dashboard/teacher/ai-tools` or quiz creation flow | TEACHER / PRINCIPAL / SUB_ADMIN |
| AI question generator (PDF) | Same as above | TEACHER / PRINCIPAL / SUB_ADMIN |
| Short-answer AI grading | `/dashboard/teacher/feedback` | TEACHER / PRINCIPAL / SUB_ADMIN |
| Natural-language content search | `/dashboard/teacher/ai-tools` | Any school-scoped user |

All seven endpoints write an `AiJob` row (audit + cost).

---

## 7 · What's intentionally NOT in this platform

Per contract — **Plan 01**. The following are **Plan 02** (separate engagement at ₹74,999) and will not appear in any menu:

- Conversational AI Tutor per subject
- AI Doubt Solver
- Automated weekly AI principal reports
- AI student risk alerts (early-warning system)
- Autonomous content tagging
- Multi-agent orchestration
- AI School Recommender
- WhatsApp agent
- AI-based follow-ups
- Custom per-school fine-tuned agents

If a user asks for any of these, the answer is "that's our Plan 02 upgrade — contact contact@amfire.in".

---

## 8 · Where things live

| What | Where |
|---|---|
| Source code | https://github.com/amfire-tech/skillship |
| Production deploy | `<your-domain>` (the VPS running `infra/docker-compose.prod.yml`) |
| Staging | `staging.<your-domain>` |
| Database | Supabase (managed Postgres + pgvector) |
| Container images | GitHub Container Registry (GHCR) under `amfire-tech/skillship-*` |
| AI provider | Google Gemini (`gemini-2.5-flash`) — billed to the project's GCP/AI Studio account |
| Background jobs | Celery worker + Celery Beat (in the prod compose) |
| Logs | `docker compose -f infra/docker-compose.prod.yml logs -f` on the VPS |
| Errors | Sentry (if `SENTRY_DSN_*` env vars are set; otherwise stdout logs only) |
| Auto-generated PDF reports | `media_data` Docker volume on the VPS → `/app/media/auto-reports/<school-slug>/` |

---

## 9 · Support contract

Per the proposal (Plan 01):
- **3 months free support** post-launch
- **48-hour response time** for tickets
- After free period: **₹1,099/month** for ongoing maintenance

Channels: `contact@amfire.in` or GitHub Issues on `amfire-tech/skillship`.
