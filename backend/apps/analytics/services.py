"""
File:    backend/apps/analytics/services.py
Purpose: Aggregation queries that rebuild StudentDailyStats and ClassWeeklyStats from live data.
Owner:   Vishal
"""

from __future__ import annotations

import datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Avg, Sum


@transaction.atomic
def rebuild_daily_stats(school_id, date: datetime.date) -> int:
    """Recompute StudentDailyStats for every student in a school on a given date.

    Called by the nightly Celery job (02:30 IST). Returns the number of rows upserted.
    """
    from apps.quizzes.models import QuizAttempt
    from .models import StudentDailyStats

    attempts = (
        QuizAttempt.objects.filter(
            school_id=school_id,
            submitted_at__date=date,
            status=QuizAttempt.Status.SUBMITTED,
        )
        .values("student_id")
        .annotate(
            quizzes_taken_agg=Sum("correct_count") - Sum("correct_count") + Sum("correct_count") * 0 + 1,
            avg_score_agg=Avg("score_percent"),
        )
    )

    # Simpler: group by student, count attempts and average scores
    from django.db.models import Count
    student_stats = (
        QuizAttempt.objects.filter(
            school_id=school_id,
            submitted_at__date=date,
            status=QuizAttempt.Status.SUBMITTED,
        )
        .values("student_id")
        .annotate(
            quizzes_taken_agg=Count("id"),
            avg_score_agg=Avg("score_percent"),
        )
    )

    upserted = 0
    for row in student_stats:
        StudentDailyStats.objects.update_or_create(
            school_id=school_id,
            student_id=row["student_id"],
            date=date,
            defaults={
                "quizzes_taken": row["quizzes_taken_agg"],
                "avg_score": Decimal(str(row["avg_score_agg"] or 0)).quantize(Decimal("0.01")),
            },
        )
        upserted += 1

    return upserted


@transaction.atomic
def rebuild_weekly_stats(school_id, week_start: datetime.date) -> int:
    """Recompute ClassWeeklyStats for all classes in a school for the given week.

    week_start must be a Monday. Called by Celery on Sunday night (22:00 IST).
    Returns number of rows upserted.
    """
    from apps.academics.models import Class
    from .models import ClassWeeklyStats, RiskSignal, StudentDailyStats

    week_end = week_start + datetime.timedelta(days=6)

    classes = Class.objects.filter(school_id=school_id)
    upserted = 0

    for klass in classes:
        enrolled_student_ids = list(
            klass.enrollments.filter(withdrawn_on__isnull=True).values_list("student_id", flat=True)
        )
        if not enrolled_student_ids:
            continue

        agg = StudentDailyStats.objects.filter(
            school_id=school_id,
            student_id__in=enrolled_student_ids,
            date__gte=week_start,
            date__lte=week_end,
        ).aggregate(avg=Avg("avg_score"))

        at_risk = RiskSignal.objects.filter(
            school_id=school_id,
            student_id__in=enrolled_student_ids,
            created_at__date__gte=week_start,
            acknowledged_by__isnull=True,
        ).count()

        ClassWeeklyStats.objects.update_or_create(
            school_id=school_id,
            klass=klass,
            week_start_date=week_start,
            defaults={
                "avg_score": Decimal(str(agg["avg"] or 0)).quantize(Decimal("0.01")),
                "at_risk_count": at_risk,
            },
        )
        upserted += 1

    return upserted
