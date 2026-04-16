"""
File:    backend/apps/common/views.py
Purpose: Health-check view (/healthz/) — returns 200 if DB + Redis reachable.
Why:     Kubernetes / uptime monitors ping this to know if the service is alive.
Owner:   Navanish
TODO:    healthz(request): try DB connection + redis.ping(); return JSON {"status": "ok", "db": ..., "redis": ...}.
"""
