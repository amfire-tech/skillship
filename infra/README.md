<!--
File:    infra/README.md
Purpose: Operations guide — how to run the full stack locally + production deploy steps.
Owner:   Navanish
-->

# Infra

## Local (all services)

```bash
cd infra
cp .env.example .env
docker compose up --build
```

Services:
- Postgres 16 (pgvector)  → 5432
- Redis 7                 → 6379
- Backend (Django)        → 8000
- AI service (FastAPI)    → 8001
- Frontend (Next.js)      → 3000
- Celery worker + beat (no exposed port)

## Production

Documented in `docs/runbook.md`.

## Backups

`scripts/backup.sh` scheduled via server cron nightly. Retain 30 days.
