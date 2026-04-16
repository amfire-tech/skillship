<!--
File:    data/README.md
Purpose: Everything about raw SQL, seed data, and analytics views that lives OUTSIDE Django migrations.
Owner:   Shared (lead: Navanish)
-->

# data/

Django migrations handle schema for ORM tables. This folder holds:

- `migrations_raw/` — raw SQL we apply AFTER `python manage.py migrate`
  (extensions, Row-Level Security policies, DB views that Django can't easily express).
- `seed/seed.py` — inserts demo schools + users + quizzes so the team can click around on day 1.
- `reports_sql/` — read-only SQL for ad-hoc analytics by Vishal / principals.

## Order to apply locally

```bash
python manage.py migrate
psql $DATABASE_URL -f data/migrations_raw/001_pgvector.sql
psql $DATABASE_URL -f data/migrations_raw/002_rls_policies.sql
psql $DATABASE_URL -f data/migrations_raw/003_analytics_views.sql
python data/seed/seed.py
```
