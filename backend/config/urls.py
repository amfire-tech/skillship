"""
File:    backend/config/urls.py
Purpose: Root URL router — maps /api/v1/... to each app's urls.py.
Why:     Single place that decides which URL goes to which app.
Owner:   Navanish
TODO:    Include: /admin/, /api/v1/auth/, /api/v1/schools/, /api/v1/academics/,
         /api/v1/quizzes/, /api/v1/content/, /api/v1/analytics/,
         /api/v1/notifications/, /api/v1/ai/, /api/schema/, /api/docs/, /healthz/.
"""
