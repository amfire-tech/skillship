"""
File:    backend/config/settings/base.py
Purpose: Shared Django settings used by both dev and prod (INSTALLED_APPS, DB, DRF, JWT, Celery).
Why:     One place for every config value so the two environments only override what differs.
Owner:   Navanish
TODO:    - INSTALLED_APPS: django.contrib.*, rest_framework, rest_framework_simplejwt.token_blacklist,
           drf_spectacular, corsheaders, django_filters, apps.common, apps.accounts, apps.schools,
           apps.academics, apps.quizzes, apps.content, apps.analytics, apps.notifications, apps.ai_bridge
         - MIDDLEWARE: add apps.common.middleware.TenantMiddleware AFTER AuthenticationMiddleware
         - AUTH_USER_MODEL = "accounts.User"
         - DATABASES: PostgreSQL from env (DATABASE_URL)
         - REST_FRAMEWORK: JWT auth, DRF spectacular schema, throttling (120/min user, 30/min anon)
         - SIMPLE_JWT: access 15 min, refresh 7 days, rotate + blacklist
         - CELERY_BROKER_URL / RESULT_BACKEND from REDIS_URL
         - AI_SERVICE_URL + AI_SERVICE_INTERNAL_KEY env vars
"""
