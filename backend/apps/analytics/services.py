"""
File:    backend/apps/analytics/services.py
Purpose: Aggregation queries + dashboard builders — called from views and Celery jobs.
Why:     All heavy queries live here so views are thin and jobs + API share the same code.
Owner:   Vishal
TODO:    - build_principal_dashboard(school) -> dict
         - build_teacher_dashboard(teacher) -> dict
         - build_student_dashboard(student) -> dict
         - rebuild_daily_stats(school, date) — called by Celery nightly
         - rebuild_weekly_stats(school, week) — called Sunday night
"""
