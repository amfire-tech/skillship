"""
File:    backend/jobs/analytics.py
Purpose: Nightly Celery tasks — rebuild aggregated stats tables and refresh materialized views.
Owner:   Vishal
"""

from __future__ import annotations

import datetime

from celery import shared_task


@shared_task
def rebuild_daily_stats_for_all() -> dict:
    """Rebuild StudentDailyStats for yesterday across all active schools.

    Scheduled: 02:30 IST daily (Celery Beat).
    """
    from apps.schools.models import School
    from apps.analytics.services import rebuild_daily_stats

    yesterday = datetime.date.today() - datetime.timedelta(days=1)
    results = {}
    for school in School.objects.filter(is_active=True):
        count = rebuild_daily_stats(school_id=school.id, date=yesterday)
        results[str(school.id)] = count
    return results


@shared_task
def rebuild_weekly_stats_for_all() -> dict:
    """Rebuild ClassWeeklyStats for the most recently completed week across all active schools.

    Scheduled: Sunday 22:00 IST (Celery Beat).
    """
    from apps.schools.models import School
    from apps.analytics.services import rebuild_weekly_stats

    today = datetime.date.today()
    # Most recent Monday
    week_start = today - datetime.timedelta(days=today.weekday())
    results = {}
    for school in School.objects.filter(is_active=True):
        count = rebuild_weekly_stats(school_id=school.id, week_start=week_start)
        results[str(school.id)] = count
    return results


@shared_task
def refresh_materialized_views() -> None:
    """Refresh the three analytics materialized views concurrently.

    Scheduled: 03:00 IST daily, AFTER rebuild_daily_stats_for_all completes.
    Requires 003_analytics_views.sql to have been applied first.
    """
    from django.db import connection

    views = ["school_kpi_mv", "class_perf_mv", "student_trend_mv"]
    with connection.cursor() as cursor:
        for view in views:
            cursor.execute(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}")
