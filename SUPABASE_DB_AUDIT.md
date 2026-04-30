# Supabase Database Audit Report

**Date:** 2026-04-30  
**Database:** Supabase — Skillship project  
**Host:** `aws-1-ap-south-1.pooler.supabase.com:6543`  
**Database name:** `postgres`  
**Audited by:** Claude Code (on behalf of Vishal)  
**Access level:** Read-only inspection

---

## Executive Summary

Two parallel schemas exist in the database simultaneously:

| Schema type | Origin | Status |
|-------------|--------|--------|
| **Old raw SQL tables** | Written before Django ORM was adopted | ❌ Wrong schema, forbidden fields, typos — must be dropped |
| **New Django ORM tables** | Created by `python manage.py migrate` | ✅ Correct schema, but 5 apps not yet migrated |

Additionally:
- `pgvector` extension is **NOT installed** → content search AI feature is broken
- Row-Level Security (RLS) is **OFF** on all Django tenant tables → no DB-level isolation

---

## 1. Extensions

| Extension | Required | Installed | Impact if missing |
|-----------|----------|-----------|-------------------|
| `vector` (pgvector) | ✅ YES — for AI semantic search | ❌ NOT installed | `ai-service/app/rag/retriever.py` crashes at runtime; `POST /api/content/search` is non-functional |
| `uuid-ossp` | Used by Django | ✅ Installed | — |
| `pg_trgm` | Optional | ✅ Installed | — |

**Fix for pgvector (Navanish must run in Supabase SQL editor):**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 2. Row-Level Security (RLS) Status

RLS is the PostgreSQL-level safety net that prevents one school's data from leaking to another school's queries. Currently it is **completely off** on all tables.

| Table | RLS Enabled | Policies |
|-------|-------------|----------|
| `accounts_user` | ❌ OFF | None |
| `schools_school` | ❌ OFF | None |
| `academics_academicyear` | ❌ OFF | None |
| `academics_class` | ❌ OFF | None |
| `academics_course` | ❌ OFF | None |
| `academics_enrollment` | ❌ OFF | None |
| All other Django tables | ❌ OFF | None |

**Current protection:** Application-only via `TenantScopedViewSet`. If `get_queryset()` is ever bypassed or called incorrectly, data leaks between schools.

**Fix:** Navanish must write and apply `data/migrations_raw/002_rls_policies.sql` after all of Vishal's app migrations run.

---

## 3. Old Raw SQL Tables (Pre-Django Schema)

These tables were created manually before the team adopted Django ORM. They use wrong field names, wrong schema, and conflict with CLAUDE.md rules. They are NOT referenced by any Django app and can be safely dropped once confirmed.

### `school` — ❌ WRONG SCHEMA
| Column found | Problem |
|-------------|---------|
| `email` | CLAUDE.md §4 explicitly forbids this field on School |
| `phone` | CLAUDE.md §4 explicitly forbids this field on School |
| `principal` | CLAUDE.md §4 explicitly forbids this field on School |
| `id` (integer) | Should be UUID — CLAUDE.md §3 rule |

**Django replacement:** `schools_school` (correct — no email/phone/principal)

---

### `student`, `teacher`, `principal`, `sub_admin`, `super_admin` — ❌ SEPARATE ROLE TABLES
Problem: Each role has its own table. Django uses a unified `accounts_user` table with a `role` column (`MAIN_ADMIN / SUB_ADMIN / PRINCIPAL / TEACHER / STUDENT`).

**Django replacement:** `accounts_user` with `role` field

---

### `user_auth` — ❌ REPLACED
Custom auth table. Replaced by Django's built-in JWT auth (`djangorestframework-simplejwt`).

**Django replacement:** `accounts_user` + `token_blacklist_*` tables

---

### `quiz_attempt` — ❌ TYPO IN SCHEMA
| Column found | Problem |
|-------------|---------|
| `attemp_id` | Typo — missing the 't'. Will cause silent bugs if ever referenced |

**Django replacement:** Will be `quizzes_quizattempt` once Vishal runs migrations

---

### `question_bank`, `quiz`, `quiz_question` — ❌ OLD SCHEMA
Wrong field names, integer IDs, no tenant scoping.

**Django replacement:** Will be `quizzes_questionbank`, `quizzes_quiz`, etc.

---

### `class_section`, `course` — ❌ OLD SCHEMA
Replaced by Django `academics_class` and `academics_course`.

---

### `content_module`, `marketplace_listing` — ❌ OLD SCHEMA
Replaced by Django `content_contentitem` and `content_marketplacelisting` (once Vishal migrates).

---

### `notification_log`, `notification_template` — ❌ OLD SCHEMA
Replaced by Django `notifications_notification` and `notifications_notificationtemplate` (once Vishal migrates).

---

### `student_daily_stats`, `class_weekly_stats` — ❌ OLD SCHEMA
Replaced by Django `analytics_studentdailystats` and `analytics_classweeklystats` (once Vishal migrates).

---

### Other Legacy Tables (out of scope entirely)

| Table | Status |
|-------|--------|
| `payment_transaction` | Not in Plan 01 scope — drop |
| `subscriptionplans` | Not in Plan 01 scope — drop |
| `platforms_config` | Not in Plan 01 scope — drop |
| `region` | Not in Plan 01 scope — drop |

---

## 4. Complete Drop Script (for Navanish to review and run)

> **WARNING:** Run only after confirming Django ORM tables are migrated and working. This is irreversible.

```sql
-- ============================================================
-- Skillship: Drop old pre-Django raw SQL tables
-- Run AFTER confirming all Django migrations applied correctly
-- Reviewed by: [Navanish sign-off required]
-- Date: [fill in before running]
-- ============================================================

-- Old role tables (replaced by accounts_user)
DROP TABLE IF EXISTS student CASCADE;
DROP TABLE IF EXISTS teacher CASCADE;
DROP TABLE IF EXISTS principal CASCADE;
DROP TABLE IF EXISTS sub_admin CASCADE;
DROP TABLE IF EXISTS super_admin CASCADE;
DROP TABLE IF EXISTS user_auth CASCADE;

-- Old school table (wrong fields)
DROP TABLE IF EXISTS school CASCADE;

-- Old quiz tables (wrong schema + typo)
DROP TABLE IF EXISTS quiz_attempt CASCADE;
DROP TABLE IF EXISTS quiz_question CASCADE;
DROP TABLE IF EXISTS quiz CASCADE;
DROP TABLE IF EXISTS question_bank CASCADE;

-- Old academic tables
DROP TABLE IF EXISTS class_section CASCADE;
DROP TABLE IF EXISTS course CASCADE;

-- Old content tables
DROP TABLE IF EXISTS content_module CASCADE;
DROP TABLE IF EXISTS marketplace_listing CASCADE;

-- Old notification tables
DROP TABLE IF EXISTS notification_log CASCADE;
DROP TABLE IF EXISTS notification_template CASCADE;

-- Old analytics tables
DROP TABLE IF EXISTS student_daily_stats CASCADE;
DROP TABLE IF EXISTS class_weekly_stats CASCADE;

-- Out of scope legacy tables
DROP TABLE IF EXISTS payment_transaction CASCADE;
DROP TABLE IF EXISTS subscriptionplans CASCADE;
DROP TABLE IF EXISTS platforms_config CASCADE;
DROP TABLE IF EXISTS region CASCADE;
```

---

## 5. Django ORM Tables — Current State

These are the correct tables, created by Django migrations.

| Table | Exists | Has Data | Notes |
|-------|--------|----------|-------|
| `django_migrations` | ✅ Yes | ✅ Yes | Migration history present |
| `django_content_type` | ✅ Yes | ✅ Yes | |
| `auth_permission` | ✅ Yes | ✅ Yes | |
| `accounts_user` | ✅ Yes | ⚪ Unknown | Correct schema: UUID pk, role field, school FK nullable |
| `accounts_user_groups` | ✅ Yes | ⚪ Unknown | |
| `accounts_user_user_permissions` | ✅ Yes | ⚪ Unknown | |
| `schools_school` | ✅ Yes | ⚪ Unknown | Correct fields: no email/phone/principal |
| `schools_schoolsettings` | ✅ Yes | ⚪ Unknown | OneToOne to school |
| `academics_academicyear` | ✅ Yes | ⚪ Empty | TenantModel, UUID pk |
| `academics_class` | ✅ Yes | ⚪ Empty | TenantModel, UUID pk |
| `academics_course` | ✅ Yes | ⚪ Empty | TenantModel, Stream choices |
| `academics_enrollment` | ✅ Yes | ⚪ Empty | TenantModel, UUID pk |
| `token_blacklist_*` | ✅ Yes | ⚪ Unknown | JWT token management |
| `quizzes_*` | ❌ NOT MIGRATED | — | Vishal must write models + run migrations |
| `content_*` | ❌ NOT MIGRATED | — | Vishal must write models + run migrations |
| `analytics_*` | ❌ NOT MIGRATED | — | Vishal must write models + run migrations |
| `notifications_*` | ❌ NOT MIGRATED | — | Vishal must write models + run migrations |
| `ai_bridge_*` | ❌ NOT MIGRATED | — | Navanish must write models + run migrations |

---

## 6. Missing Table: `content_chunks`

The AI service RAG retriever (`ai-service/app/rag/retriever.py`) queries a table named `content_chunks` for vector embeddings. This table does **not exist** in the database yet.

It needs to be created when Vishal writes the content app migrations, containing at minimum:
```
content_chunks (
    id          UUID PRIMARY KEY,
    school_id   UUID NOT NULL,       -- tenant scope
    course_id   UUID,
    content_id  UUID,                -- FK to content_contentitem
    chunk_text  TEXT,
    embedding   vector(768),         -- requires pgvector
    created_at  TIMESTAMPTZ
)
```

And a vector index:
```sql
CREATE INDEX ON content_chunks USING ivfflat (embedding vector_cosine_ops);
```

---

## 7. Action Items by Owner

### Navanish (CRITICAL — blocks everything else)
1. ✅ Install pgvector: run `CREATE EXTENSION IF NOT EXISTS vector;` in Supabase SQL editor
2. ✅ Review and run the drop script above for old tables (after team confirmation)
3. ✅ Write and apply `data/migrations_raw/002_rls_policies.sql` (after Vishal's migrations)
4. ✅ Implement `AiJob` model and `AiClient` HTTP wrapper in `ai_bridge/`
5. ✅ Run `makemigrations ai_bridge && migrate`

### Vishal
1. Write all 4 empty apps: quizzes, content, analytics, notifications
2. Run `makemigrations` and `migrate` for each
3. Write `data/migrations_raw/003_analytics_views.sql` (materialized views)

### Prashant
1. Write `data/seed/seed.py` once tables exist
2. Verify `content_chunks` table schema matches `rag/retriever.py`

---

## 8. Sequence — What Must Happen in Order

```
Navanish installs pgvector
        ↓
Vishal writes + migrates quizzes, content, analytics, notifications
        ↓
Navanish drops old raw SQL tables (DROP script above)
        ↓
Navanish writes + applies RLS policies
        ↓
Navanish migrates ai_bridge (AiJob model)
        ↓
Prashant writes seed.py + seeds data
        ↓
Pranav wires frontend to real APIs
        ↓
Integration testing
```

---

*Report generated 2026-04-30 via direct psycopg read-only connection to Supabase.*
