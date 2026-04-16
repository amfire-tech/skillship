<!--
File:    docs/runbook.md
Purpose: "What to do when it breaks" — step-by-step for common prod incidents.
Owner:   Navanish
-->

# Production runbook

## Backend 500s

1. Check Sentry for top error.
2. `docker compose logs backend --tail 200`.
3. Rollback: redeploy previous tag (`git checkout <tag>; docker compose up -d backend`).

## Database down

1. Check managed Postgres dashboard.
2. If instance is healthy, check `pg_stat_activity` for locks.
3. Restore: `infra/scripts/restore.sh <yyyy-mm-dd>.sql.gz` to standby.

## AI service 5xx / timeout

1. Check Anthropic status page.
2. Fallback: `AI_ENABLED=False` env flag on backend — UI hides AI features gracefully.

## Full outage — customer waiting

1. Post on status page.
2. Fail over to standby region.
3. Post-mortem within 48 h (blameless).
