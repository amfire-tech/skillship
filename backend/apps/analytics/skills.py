"""
File:    backend/apps/analytics/skills.py
Purpose: Skill-wise (per-tag) breakdown of a student's quiz performance.
Owner:   Navanish

Source of truth: `Question.tags` (JSONField list of strings — already in the
schema, no migration needed). For each tag a student has touched, we report:

  - attempts       — how many questions tagged with this skill they answered
  - correct        — how many they got right
  - accuracy_pct   — round(100 * correct / attempts, 2)
  - avg_time_sec   — average seconds per question (only over answered ones)
  - points_earned  — sum of points awarded
  - points_total   — sum of question.points (the ceiling)

Counted ONLY over SUBMITTED attempts in the date window — IN_PROGRESS and
EXPIRED attempts are noise. Designed to run inline per dashboard request;
for school-wide rollups we'd push this into a Celery rebuild instead.
"""

from __future__ import annotations

import datetime as _dt
from collections import defaultdict
from typing import Any

from apps.accounts.models import User
from apps.quizzes.models import Answer, QuizAttempt


def compute_student_skill_breakdown(
    *, school_id, student: User, date_range
) -> list[dict[str, Any]]:
    """Per-tag aggregation for one student over a date window."""
    qs = (
        Answer.objects
        .filter(
            school_id=school_id,
            attempt__student=student,
            attempt__status=QuizAttempt.Status.SUBMITTED,
            attempt__submitted_at__date__gte=date_range.start,
            attempt__submitted_at__date__lte=date_range.end,
        )
        .select_related("question")
        .only(
            "is_correct", "points_awarded", "time_spent_seconds",
            "question__id", "question__tags", "question__points",
        )
    )

    # Bucket per tag — accumulate counts/sums then derive ratios at the end.
    buckets: dict[str, dict[str, float]] = defaultdict(
        lambda: {"attempts": 0, "correct": 0, "time": 0, "points_earned": 0, "points_total": 0}
    )

    for ans in qs.iterator():
        tags = ans.question.tags or []
        if not tags:
            tags = ["_untagged"]
        for tag in tags:
            b = buckets[str(tag)]
            b["attempts"]       += 1
            b["correct"]        += 1 if ans.is_correct else 0
            b["time"]           += int(ans.time_spent_seconds or 0)
            b["points_earned"]  += int(ans.points_awarded or 0)
            b["points_total"]   += int(ans.question.points or 0)

    rows: list[dict[str, Any]] = []
    for tag, b in buckets.items():
        attempts = int(b["attempts"])
        if attempts == 0:
            continue
        correct = int(b["correct"])
        rows.append({
            "tag":            tag,
            "attempts":       attempts,
            "correct":        correct,
            "accuracy_pct":   round(100.0 * correct / attempts, 2),
            "avg_time_sec":   round(b["time"] / attempts, 2),
            "points_earned":  int(b["points_earned"]),
            "points_total":   int(b["points_total"]),
        })

    # Order: strongest skill first (highest accuracy), break ties by volume.
    rows.sort(key=lambda r: (-r["accuracy_pct"], -r["attempts"]))
    return rows


def compute_class_skill_breakdown(
    *, school_id, klass, date_range
) -> list[dict[str, Any]]:
    """Same shape as the student breakdown but aggregated across the whole class.

    "Class" here is the enrolled students of the given Class for the window.
    """
    from apps.academics.models import Enrollment

    student_ids = list(
        Enrollment.objects
        .filter(school_id=school_id, klass=klass, withdrawn_on__isnull=True)
        .values_list("student_id", flat=True)
        .distinct()
    )
    if not student_ids:
        return []

    qs = (
        Answer.objects
        .filter(
            school_id=school_id,
            attempt__student_id__in=student_ids,
            attempt__status=QuizAttempt.Status.SUBMITTED,
            attempt__submitted_at__date__gte=date_range.start,
            attempt__submitted_at__date__lte=date_range.end,
        )
        .select_related("question")
        .only(
            "is_correct", "points_awarded", "time_spent_seconds",
            "question__id", "question__tags", "question__points",
        )
    )

    buckets: dict[str, dict[str, float]] = defaultdict(
        lambda: {"attempts": 0, "correct": 0, "time": 0, "points_earned": 0, "points_total": 0}
    )
    for ans in qs.iterator():
        tags = ans.question.tags or ["_untagged"]
        for tag in tags:
            b = buckets[str(tag)]
            b["attempts"]      += 1
            b["correct"]       += 1 if ans.is_correct else 0
            b["time"]          += int(ans.time_spent_seconds or 0)
            b["points_earned"] += int(ans.points_awarded or 0)
            b["points_total"]  += int(ans.question.points or 0)

    rows = []
    for tag, b in buckets.items():
        attempts = int(b["attempts"])
        if attempts == 0:
            continue
        correct = int(b["correct"])
        rows.append({
            "tag":           tag,
            "attempts":      attempts,
            "correct":       correct,
            "accuracy_pct":  round(100.0 * correct / attempts, 2),
            "avg_time_sec":  round(b["time"] / attempts, 2),
            "points_earned": int(b["points_earned"]),
            "points_total":  int(b["points_total"]),
        })
    rows.sort(key=lambda r: (-r["accuracy_pct"], -r["attempts"]))
    return rows
