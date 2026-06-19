"""
File:    backend/apps/career/context.py
Purpose: Build the student's real learning context (grade, board, subject
         strengths) from live data — the inputs every career feature reasons over.
Owner:   Navanish

Kept separate from ai_bridge.views so both the (non-AI) career endpoints and the
(AI) roadmap/checklist calls share one source of truth, with no LLM involved here.
"""

from __future__ import annotations

from django.db.models import Avg, Count


def student_learning_context(user) -> dict:
    """grade (from current enrolment) + board (from school) + per-subject quiz
    performance, sorted strongest-first. Pure DB reads, no AI."""
    from apps.academics.models import Enrollment
    from apps.quizzes.models import QuizAttempt

    enr = (
        Enrollment.objects.filter(student=user, withdrawn_on__isnull=True)
        .select_related("klass")
        .order_by("-enrolled_on")
        .first()
    )
    grade = enr.klass.grade if enr and enr.klass_id else None
    board = user.school.board if user.school_id else None

    submitted = QuizAttempt.objects.filter(
        student=user, status=QuizAttempt.Status.SUBMITTED
    )
    rows = (
        submitted.values("quiz__course__name")
        .annotate(avg=Avg("score_percent"), n=Count("id"))
    )
    subjects = [
        {
            "subject": r["quiz__course__name"] or "General",
            "avg_score": round(float(r["avg"]), 1),
            "attempts": r["n"],
        }
        for r in rows
        if r["avg"] is not None
    ]
    subjects.sort(key=lambda s: -s["avg_score"])
    overall = submitted.aggregate(a=Avg("score_percent"))["a"]

    return {
        "student_id": str(user.id),
        "school_name": user.school.name if user.school_id else "",
        "grade": grade,
        "board": board,
        "overall_avg_score": round(float(overall), 1) if overall is not None else None,
        "quizzes_taken": submitted.count(),
        "subject_performance": subjects,
        "strengths": [s["subject"] for s in subjects[:3]],
        "needs_work": [s["subject"] for s in subjects[-2:]] if len(subjects) > 2 else [],
    }
