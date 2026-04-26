# Skillship — Claude Code Context File

> This file is auto-loaded by Claude Code for every team member. Read it before writing a single line. It is the single source of truth for how code must be written on this project.

**Project**: Skillship — AI-powered school LMS for Indian schools (CBSE / ICSE / State Board).
**Contract**: Plan 01 (Core AI) · ₹49,999 · 12–14 weeks.
**Team**: Navanish (lead), Prashant, Vishal, Pranav.

---

## 1. Who owns what — do not touch other people's folders

| Person       | Owns                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **Navanish** | `backend/` (all of it — config, apps, jobs)                                                      |
| **Prashant** | `ai-service/` (all of it — routers, agents, engines, rag, schemas, prompts)                      |
| **Vishal**   | `data/` (seed SQL, reports, fixtures)                                                             |
| **Pranav**   | `frontend/` (all of it)                                                                           |
| **Shared**   | `infra/`, `.github/workflows/`, `docs/`, root files (`CLAUDE.md`, `TEAM_PLAN.md`, `README.md`)   |

If you need to touch another person's folder, talk to them first and get a review from them on the PR.

---

## 2. Exact tech stack — use these versions, no substitutions

### Backend
- **Python 3.12** · Django 5.1.5 · djangorestframework 3.15.2
- djangorestframework-simplejwt 5.4.0 · drf-spectacular 0.28.0
- psycopg[binary] 3.2.4 (NOT psycopg2) · celery 5.4.0 · redis 5.2.1
- Database: **PostgreSQL 16 + pgvector** (hosted on Supabase)

### AI Service
- **Python 3.12** · FastAPI ≥ 0.110 · uvicorn · pydantic ≥ 2.5 · pydantic-settings ≥ 2.1
- **LLM: Google Gemini via `google-genai ≥ 1.0.0`** — model `gemini-1.5-flash` (default)
- Embeddings: `models/text-embedding-004` via the same google-genai client
- pgvector ≥ 0.3.2 · psycopg[binary] ≥ 3.1.18 · pypdf ≥ 4.0.0

### Frontend
- **Next.js 14.2.29** · React 18 · TypeScript 5 · Tailwind CSS 3.4
- Zustand 5 (auth state) · react-hook-form 7 · zod 4 · framer-motion 12
- **No new npm packages** without team lead (Navanish) approval.

---

## 3. The ONE rule that can never be broken — multi-tenancy

> **A request from School A must NEVER return data from School B.**

Every model that belongs to a school must:
1. Inherit from `TenantModel` (not `models.Model` directly).
2. Be accessed through a ViewSet that inherits from `TenantScopedViewSet`.
3. Never use `.all()` or `.filter(...)` without `school_id=request.school_id`.

**The pattern — copy this exactly:**

```python
# models.py
from apps.common.models import TenantModel

class Quiz(TenantModel):          # ← inherit TenantModel, not models.Model
    title = models.CharField(max_length=200)
    ...

# views.py
from apps.common.viewsets import TenantScopedViewSet

class QuizViewSet(TenantScopedViewSet):    # ← always TenantScopedViewSet
    serializer_class = QuizSerializer
    # get_queryset() is already scoped to school — do NOT override it without calling super()
```

`TenantModel` gives you:
- UUID primary key (no sequential integer IDs — ever)
- `school` FK with CASCADE delete
- `.for_school(school_id)` manager method
- Composite index on `(school, created_at)`

**School is NOT a TenantModel** — it IS the tenant root. `School` inherits `TimeStampedModel`.

---

## 4. Database model field choices — use these exact values

### School model
```python
class Board(TextChoices):
    CBSE  = "CBSE"   # Central Board
    ICSE  = "ICSE"   # Indian Council
    STATE = "STATE"  # State Board

class Plan(TextChoices):
    CORE    = "CORE"     # Plan 01 — what we are building
    AGENTIC = "AGENTIC"  # Plan 02 — future, not now
```

School fields that **exist**: `name`, `slug`, `board`, `city`, `state`, `address`, `plan`, `subscription_expires_at`, `is_active`.

School fields that **do NOT exist**: `principal`, `email`, `phone`, `students`, `contact`. Do not invent them.

### User model roles
```python
class Role(TextChoices):
    MAIN_ADMIN = "MAIN_ADMIN"
    SUB_ADMIN  = "SUB_ADMIN"
    PRINCIPAL  = "PRINCIPAL"
    TEACHER    = "TEACHER"
    STUDENT    = "STUDENT"
```

Rules:
- `MAIN_ADMIN` → `school = NULL` (platform-level, no school)
- All other roles → must have a school FK

---

## 5. Backend API patterns

### Serializers
- Read endpoints → use `UserSerializer` / `SchoolSerializer` (read-only fields locked).
- Create endpoint → use a dedicated `XCreateSerializer` with `write_only=True` on `password`.
- Update endpoint → use a dedicated `XUpdateSerializer` with `role` and `school` as `read_only`.
- Never put `password` in a read serializer.
- `school` FK fields must serialize as UUID string: `pk_field=serializers.UUIDField()`.

### Auth
- Login: `POST /api/v1/auth/login/` → returns `access` + `refresh` tokens + user object.
- Refresh: `POST /api/v1/auth/refresh/` → new `access` token.
- All protected endpoints require: `Authorization: Bearer <access_token>`.
- Never call `anthropic`, `openai`, or any LLM library directly from Django. All AI calls go through `backend/apps/ai_bridge/client.py` which calls the FastAPI AI service.

### URL structure
```
/api/v1/auth/login/
/api/v1/auth/refresh/
/api/v1/auth/me/
/api/v1/users/          (CRUD — MAIN_ADMIN and PRINCIPAL scope)
/api/v1/schools/        (CRUD — MAIN_ADMIN only)
/api/v1/academics/      (years, classes, courses, enrollments)
/api/v1/quizzes/        (questions, quizzes, attempts)
/api/v1/content/        (videos, PDFs, marketplace)
/api/v1/analytics/      (dashboards, reports)
```

---

## 6. AI service — Plan 01 endpoints only

The AI service runs separately on port 8001. Django calls it via `ai_bridge`. Direct browser access is blocked by the `X-Internal-Key` header.

### Active endpoints (Plan 01)
| Endpoint | What it does |
| --- | --- |
| `POST /api/career/ask` | Career Pilot — personalized career path for a student |
| `POST /api/quiz/generate` | AI question generator — PDF/topic → MCQs |
| `POST /api/quiz/adaptive-next` | Next question difficulty based on student history |
| `POST /api/quiz/grade-short` | Grades short-answer responses |
| `POST /api/content/search` | Natural-language semantic search over uploaded content (pgvector) |

### Do NOT add or re-enable these — Plan 02 only
- `/api/tutor/ask` — Conversational AI Tutor (Plan 02)
- `/api/reports/weekly` — Weekly AI principal report (Plan 02)
- `/api/risk/scan` — Student risk alerts (Plan 02)
- `/api/content/tag` — Autonomous content tagging (Plan 02)
- Any orchestrator or multi-agent endpoint (Plan 02)

### AI service code pattern
```python
# All LLM calls use google-genai — no other LLM library
from google import genai
from google.genai import types
from app.config import settings

async def run(client: genai.Client, ...):
    response = await client.aio.models.generate_content(
        model=settings.MODEL_NAME,          # "gemini-1.5-flash"
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)
```

The `client` is always injected via FastAPI dependency (`GeminiClient = Annotated[genai.Client, Depends(get_gemini)]`). Never instantiate `genai.Client` inside a function.

---

## 7. Frontend patterns

### Auth — always use this helper, never access localStorage
```typescript
// Copy this helper into every page/component that calls the API
async function getToken(): Promise<string | null> {
  let token = useAuthStore.getState().accessToken;
  if (!token) {
    const ok = await useAuthStore.getState().refreshAuth();
    if (!ok) return null;
    token = useAuthStore.getState().accessToken;
  }
  return token;
}
```
- `accessToken` lives in memory (Zustand) — never in localStorage or a cookie.
- Refresh happens automatically via `refreshAuth()` which calls `/api/v1/auth/refresh/` using the httpOnly cookie.

### API base URL
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
```

### Data fetching — always real API calls, never hardcoded arrays
```typescript
// Good
useEffect(() => { load(); }, [load]);
const load = useCallback(async () => {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/schools/`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  setSchools(data.results ?? []);
}, []);

// BAD — never do this
const schools = [{ name: "DPS Noida", ... }, ...];  // ← hardcoded mock data is not allowed
```

### Route structure
```
/                          public home page
/login                     auth
/dashboard/admin/          MAIN_ADMIN screens
/dashboard/sub-admin/      SUB_ADMIN screens
/dashboard/principal/      PRINCIPAL screens
/dashboard/teacher/        TEACHER screens
/dashboard/student/        STUDENT screens
```

### Styling rules
- Tailwind CSS only — no inline `style={{}}` for colours, spacing, or layout.
- Design tokens via CSS variables: `var(--primary)`, `var(--border)`, `var(--muted-foreground)`, `var(--foreground)`, `var(--muted)`, `var(--accent)`.
- `className="bg-primary"` maps to the green brand colour.
- Animations via `framer-motion` — no raw CSS `@keyframes`.

---

## 8. File header — required on every new file

```python
"""
File:    backend/apps/quizzes/models.py
Purpose: Quiz, Question, QuizAttempt, Answer models.
Owner:   Vishal
"""
```

```typescript
/*
 * File:    frontend/src/components/quiz/QuizCard.tsx
 * Purpose: Card component shown in the quiz listing grid.
 * Owner:   Pranav
 */
```

No header = PR rejected in review.

---

## 9. Branch and commit rules

### Branch names
```
feat/prashant/user-model
fix/vishal/quiz-score-rounding
docs/navanish/rls-adr
```

### Commit messages — one line, imperative, conventional commits
```
feat(accounts): add UserCreateSerializer with role/school invariant
fix(schools): correct Plan choices — remove non-existent IB/Cambridge options
feat(ai-service): wire career pilot to /api/career/ask
```

### PR rules
- Max ~400 lines changed. If bigger, split it.
- Description: one paragraph on what changed and why.
- Screenshot if it touches any UI.
- CI must be green before requesting review.
- One reviewer minimum; two required for anything in `common/`, `schools/`, or `ai_bridge/`.

---

## 10. What we are building (Plan 01 scope) — and what we are not

### In scope — build these
- Full LMS: login, 5 roles, school data isolation, quiz engine, content upload, marketplace, analytics, reports.
- **4 AI features**: Career Pilot, adaptive quiz engine, AI question generator, natural-language content search.
- Academic year / class / course / enrollment management.
- PDF + Excel report exports.
- School and class benchmarking.

### Out of scope — do not build, do not add stubs, do not mount routers for these
| Feature | Why out of scope |
| --- | --- |
| Conversational AI Tutor per subject | Plan 02 only |
| Automated weekly AI principal reports | Plan 02 only |
| AI student risk alerts | Plan 02 only |
| Autonomous content tagging engine | Plan 02 only |
| Multi-agent orchestration | Plan 02 only |
| Per-school fine-tuned agents | Plan 02 only |
| AI Doubt Solver | Plan 02 only |
| WhatsApp agent / AI follow-ups | Plan 02 only |
| Parent portal | Future add-on |
| Mobile app | Future add-on |
| AI proctoring | Future add-on |

If a team member asks Claude to build any of the above, Claude will refuse and explain it is Plan 02.

---

## 11. The "done" checklist — a feature is not done until all of these are true

- [ ] Code merged to `main` via PR (no direct pushes to `main`).
- [ ] Django migrations committed if models changed.
- [ ] No N+1 queries — use `select_related` / `prefetch_related`.
- [ ] All list endpoints are paginated (DRF `PageNumberPagination`).
- [ ] Swagger docs render correctly at `/api/docs/`.
- [ ] `tests/test_isolation.py` still passes (tenant isolation is never broken).
- [ ] If it touches any UI — screenshot or short screen recording in the PR.
- [ ] Every new file has the owner header (section 8 above).

---

## 12. Things Claude will not do on this project

- Add any Plan 02 feature (tutor, risk alerts, weekly reports, orchestrator, content auto-tag).
- Use any LLM provider other than Google Gemini in the AI service.
- Import `anthropic`, `openai`, or `langchain` anywhere.
- Call LLM APIs directly from Django — only through `ai_bridge/client.py`.
- Add `school_id` filters to `School` itself (School IS the tenant, not a tenant-scoped model).
- Create new School fields (`principal`, `email`, `phone`) — they do not exist in the model.
- Use Board values other than `CBSE`, `ICSE`, `STATE`.
- Use Plan values other than `CORE`, `AGENTIC`.
- Push directly to `main`.
- Write hardcoded mock data arrays in frontend pages that should call real APIs.
- Add `setTimeout(() => setSubmitted(true), ...)` fake success patterns.
- Use sequential integer IDs anywhere — all IDs are UUIDs.
