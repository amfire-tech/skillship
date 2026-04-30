"""
File:    backend/apps/quizzes/services.py
Purpose: Quiz workflow logic — publish, start attempt, submit answer, finalize, adaptive next-question.
Owner:   Vishal
"""

from __future__ import annotations

import random
from datetime import datetime, timezone

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Answer, Question, Quiz, QuizAttempt


# ── Publish ───────────────────────────────────────────────────────────────────


def publish_quiz(quiz: Quiz, actor) -> Quiz:
    if quiz.status not in (Quiz.Status.DRAFT, Quiz.Status.REVIEW):
        raise ValidationError(f"Cannot publish a quiz in '{quiz.status}' status.")

    question_count = quiz.bank.questions.filter(school=quiz.school).count()
    if question_count == 0:
        raise ValidationError("Cannot publish a quiz with no questions in the bank.")

    quiz.status = Quiz.Status.PUBLISHED
    quiz.published_at = datetime.now(tz=timezone.utc)
    quiz.save(update_fields=["status", "published_at"])
    return quiz


def archive_quiz(quiz: Quiz) -> Quiz:
    if quiz.status != Quiz.Status.PUBLISHED:
        raise ValidationError("Only published quizzes can be archived.")
    quiz.status = Quiz.Status.ARCHIVED
    quiz.archived_at = datetime.now(tz=timezone.utc)
    quiz.save(update_fields=["status", "archived_at"])
    return quiz


# ── Start attempt ─────────────────────────────────────────────────────────────


@transaction.atomic
def start_attempt(student, quiz: Quiz) -> QuizAttempt:
    if quiz.status != Quiz.Status.PUBLISHED:
        raise PermissionDenied("Quiz is not available.")

    completed_count = QuizAttempt.objects.filter(
        student=student,
        quiz=quiz,
        status__in=[QuizAttempt.Status.SUBMITTED, QuizAttempt.Status.TIMED_OUT],
    ).count()

    if completed_count >= quiz.attempts_allowed:
        raise PermissionDenied(
            f"You have used all {quiz.attempts_allowed} allowed attempt(s) for this quiz."
        )

    # Prevent multiple in-progress attempts for the same quiz
    if QuizAttempt.objects.filter(student=student, quiz=quiz, status=QuizAttempt.Status.IN_PROGRESS).exists():
        raise ValidationError("You already have an in-progress attempt for this quiz.")

    attempt_number = completed_count + 1

    questions_qs = quiz.bank.questions.filter(school=quiz.school)
    question_ids = list(questions_qs.values_list("id", flat=True))
    if quiz.randomize_questions:
        random.shuffle(question_ids)
    question_order = [str(qid) for qid in question_ids[: quiz.total_questions]]

    now = datetime.now(tz=timezone.utc)
    from datetime import timedelta

    attempt = QuizAttempt.objects.create(
        school=quiz.school,
        quiz=quiz,
        student=student,
        attempt_number=attempt_number,
        started_at=now,
        expires_at=now + timedelta(minutes=quiz.duration_minutes),
        question_order=question_order,
        points_total=sum(
            questions_qs.filter(id__in=question_order).values_list("points", flat=True)
        ),
    )
    return attempt


# ── Submit a single answer ────────────────────────────────────────────────────


@transaction.atomic
def submit_answer(
    attempt: QuizAttempt,
    question: Question,
    selected_option_ids: list,
    text_response: str,
    time_spent_seconds: int,
) -> Answer:
    if attempt.status != QuizAttempt.Status.IN_PROGRESS:
        raise PermissionDenied("This attempt is no longer active.")

    from django.utils import timezone as dj_tz

    if dj_tz.now() > attempt.expires_at:
        attempt.status = QuizAttempt.Status.TIMED_OUT
        attempt.save(update_fields=["status"])
        raise PermissionDenied("Time is up — attempt has expired.")

    if str(question.id) not in attempt.question_order:
        raise ValidationError("This question is not part of your attempt.")

    if Answer.objects.filter(attempt=attempt, question=question).exists():
        raise ValidationError("You have already answered this question.")

    # Auto-grade MCQ and TF; SHORT is left un-graded (is_correct=False, reviewed later)
    is_correct = False
    points_awarded = 0
    if question.type in (Question.Type.MCQ, Question.Type.TF):
        correct_ids = set(str(i) for i in question.correct_option_ids)
        submitted_ids = set(str(i) for i in selected_option_ids)
        if correct_ids == submitted_ids:
            is_correct = True
            points_awarded = question.points

    answer = Answer.objects.create(
        school=attempt.school,
        attempt=attempt,
        question=question,
        selected_option_ids=selected_option_ids,
        text_response=text_response,
        is_correct=is_correct,
        points_awarded=points_awarded,
        time_spent_seconds=time_spent_seconds,
        answered_at=dj_tz.now(),
    )

    # Update rolling attempt stats
    QuizAttempt.objects.filter(pk=attempt.pk).update(
        correct_count=attempt.correct_count + (1 if is_correct else 0),
        points_earned=attempt.points_earned + points_awarded,
        last_difficulty=question.difficulty,
    )

    return answer


# ── Finalize / submit attempt ─────────────────────────────────────────────────


@transaction.atomic
def finalize_attempt(attempt: QuizAttempt) -> QuizAttempt:
    if attempt.status not in (QuizAttempt.Status.IN_PROGRESS,):
        raise ValidationError("Attempt is already finalized.")

    attempt.refresh_from_db()
    attempt.status = QuizAttempt.Status.SUBMITTED
    attempt.submitted_at = datetime.now(tz=timezone.utc)

    if attempt.points_total > 0:
        from decimal import Decimal

        attempt.score_percent = (
            Decimal(attempt.points_earned) / Decimal(attempt.points_total) * 100
        ).quantize(Decimal("0.01"))
    else:
        attempt.score_percent = None

    attempt.save(update_fields=["status", "submitted_at", "score_percent"])
    return attempt


# ── Adaptive next question ────────────────────────────────────────────────────


def next_adaptive_question(attempt: QuizAttempt) -> dict:
    """Calls ai_bridge to get the next question difficulty, then picks a question."""
    from apps.ai_bridge.client import AiClient

    answered_ids = set(str(a) for a in attempt.answers.values_list("question_id", flat=True))
    remaining_ids = [qid for qid in attempt.question_order if qid not in answered_ids]

    if not remaining_ids:
        return {"done": True}

    history = list(
        attempt.answers.select_related("question")
        .order_by("answered_at")
        .values("question__difficulty", "is_correct")
    )

    next_difficulty = AiClient.adaptive_next(
        history=[{"difficulty": h["question__difficulty"], "correct": h["is_correct"]} for h in history],
        current_difficulty=attempt.last_difficulty,
    )

    questions = Question.objects.filter(
        school=attempt.school,
        id__in=remaining_ids,
        difficulty=next_difficulty,
    )
    if not questions.exists():
        questions = Question.objects.filter(school=attempt.school, id__in=remaining_ids)

    question = questions.first()
    if question is None:
        return {"done": True}

    from .serializers import QuestionStudentSerializer

    return {"done": False, "question": QuestionStudentSerializer(question).data}
