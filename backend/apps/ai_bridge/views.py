"""
File:    backend/apps/ai_bridge/views.py
Purpose: The /api/v1/ai/... endpoints — the only way frontend reaches AI features.
Why:     Frontend never calls ai-service directly (keeps API key server-side + lets us scope by tenant).
Owner:   Navanish
TODO:    - POST /ai/career/ask/        (CareerPilot chat)
         - POST /ai/tutor/ask/         (student tutor)
         - POST /ai/quiz/generate/    (teacher: generate questions from topic)
         - POST /ai/quiz/adaptive-next/ (next adaptive question)
         - POST /ai/content/tag/       (auto-tag uploaded content)
         - POST /ai/reports/weekly/    (principal: school weekly report)
         - POST /ai/risk/scan/         (run risk pass now, enqueues Celery)
         Permissions: IsSameSchool + role checks per endpoint.
"""
