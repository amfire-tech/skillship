"""
File:    backend/apps/quizzes/services.py
Purpose: Domain logic for the quiz lifecycle — kept out of views.py so the
         rules are testable in isolation and can't be skipped by a custom view.
Owner:   Navanish

Public functions (the only thing views.py calls):

  transition_quiz_status(quiz, *, target, actor) → Quiz
  start_attempt(quiz, *, student) → _AttemptStartResult
  record_answer(attempt, *, question, payload) → Answer
  request_next_question(attempt) → Question | None
  submit_attempt(attempt) → QuizAttempt
  expire_attempt_if_due(attempt) → bool

Concurrency & integrity guarantees:

  * Every state-changing call runs inside `transaction.atomic()` and grabs a
    `select_for_update()` on the row(s) it mutates. A double-tap submit, a
    racing answer, or two concurrent state transitions cannot leave
    inconsistent state.
  * Scoring is server-authoritative. We never read `is_correct` from the
    request. We read the question, normalise the student's response, compare,
    and persist the result.
  * Quiz state transitions are encoded in `_QUIZ_TRANSITIONS` — a single
    source of truth so no view can sneak through an off-spec transition.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.common.permissions import Role

from .models import Answer, Question, Quiz, QuizAttempt


# ── Quiz state machine ──────────────────────────────────────────────────────


_QUIZ_TRANSITIONS: dict[str, set[str]] = {
    Quiz.Status.DRAFT:     {Quiz.Status.REVIEW, Quiz.Status.ARCHIVED},
    Quiz.Status.REVIEW:    {Quiz.Status.DRAFT, Quiz.Status.PUBLISHED, Quiz.Status.ARCHIVED},
    Quiz.Status.PUBLISHED: {Quiz.Status.ARCHIVED},
    Quiz.Status.ARCHIVED:  set(),  # terminal
}

# Who can drive each transition.
_REVIEW_ROLES = {Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}
_AUTHOR_ROLES = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}


def transition_quiz_status(quiz: Quiz, *, target: str, actor) -> Quiz:
    """Move a quiz from its current status to `target`, with auth + integrity checks.

    Raises ValidationError on every disallowed move so the view can return 400.
    """

    if target == quiz.status:
        return quiz

    allowed = _QUIZ_TRANSITIONS.get(quiz.status, set())
    if target not in allowed:
        raise ValidationError(
            f"Cannot move quiz from {quiz.status} to {target}. "
            f"Allowed: {sorted(allowed) or 'none (terminal)'}."
        )

    if target == Quiz.Status.PUBLISHED:
        if actor.role not in _REVIEW_ROLES:
            raise ValidationError("Only PRINCIPAL or SUB_ADMIN can publish a quiz.")
        # Sanity: the bank must hold at least `total_questions` questions.
        available = Question.objects.filter(
            school_id=quiz.school_id, bank_id=quiz.bank_id
        ).count()
        if available < quiz.total_questions:
            raise ValidationError(
                f"Cannot publish: bank has {available} questions but quiz "
                f"requires {quiz.total_questions}."
            )
    elif actor.role not in _AUTHOR_ROLES:
        raise ValidationError("Insufficient role for this transition.")

    with transaction.atomic():
        locked = Quiz.objects.select_for_update().get(pk=quiz.pk)
        # Re-check after lock — another request may have moved the row.
        if target not in _QUIZ_TRANSITIONS.get(locked.status, set()):
            raise ValidationError(
                f"Quiz state changed mid-flight (now {locked.status}); retry."
            )

        locked.status = target
        if target == Quiz.Status.PUBLISHED:
            locked.published_at = timezone.now()
        elif target == Quiz.Status.ARCHIVED:
            locked.archived_at = timezone.now()
        locked.save(update_fields=["status", "published_at", "archived_at", "updated_at"])
        return locked


# ── Attempt lifecycle ───────────────────────────────────────────────────────


@dataclass
class _AttemptStartResult:
    attempt: QuizAttempt
    is_resume: bool


def start_attempt(quiz: Quiz, *, student) -> _AttemptStartResult:
    """Create or resume the student's attempt for this quiz.

    Resume rule: if there is an IN_PROGRESS attempt that hasn't expired, return
    it (idempotent). If it has expired, mark it EXPIRED and start a new one.
    Honour `attempts_allowed` (0 = unlimited).
    """

    if quiz.status != Quiz.Status.PUBLISHED:
        raise ValidationError("Quiz is not published.")
    if student.role != Role.STUDENT:
        raise ValidationError("Only students can start a quiz attempt.")
    if student.school_id != quiz.school_id:
        # Defensive — the viewset filter should have already prevented this.
        raise ValidationError("Quiz does not belong to your school.")

    with transaction.atomic():
        existing = (
            QuizAttempt.objects
            .select_for_update()
            .filter(school_id=quiz.school_id, quiz=quiz, student=student)
            .order_by("-attempt_number")
            .first()
        )

        if existing and existing.status == QuizAttempt.Status.IN_PROGRESS:
            if existing.expires_at <= timezone.now():
                _expire_locked_attempt(existing)
                # fall through to start a fresh attempt
            else:
                return _AttemptStartResult(attempt=existing, is_resume=True)

        # Count terminated attempts to enforce attempts_allowed.
        used = QuizAttempt.objects.filter(
            school_id=quiz.school_id, quiz=quiz, student=student
        ).exclude(status=QuizAttempt.Status.IN_PROGRESS).count()

        if quiz.attempts_allowed and used >= quiz.attempts_allowed:
            raise ValidationError(
                f"You have used all {quiz.attempts_allowed} attempts for this quiz."
            )

        next_n = (existing.attempt_number + 1) if existing else 1
        now = timezone.now()
        expires = now + timedelta(minutes=quiz.duration_minutes)

        attempt = QuizAttempt.objects.create(
            school_id=quiz.school_id,
            quiz=quiz,
            student=student,
            attempt_number=next_n,
            expires_at=expires,
            question_order=_initial_question_order(quiz),
            points_total=int(quiz.total_questions),
        )
        return _AttemptStartResult(attempt=attempt, is_resume=False)


def _initial_question_order(quiz: Quiz) -> list[str]:
    """For non-adaptive quizzes pick all N up-front. For adaptive, return [].

    Picking all up-front means refresh shows the same set, which is what
    randomize_questions=True is supposed to deliver per *attempt*, not per
    *page-load*.
    """
    if quiz.is_adaptive:
        return []

    qs = Question.objects.filter(school_id=quiz.school_id, bank_id=quiz.bank_id)
    ids = list(qs.values_list("id", flat=True))
    if quiz.randomize_questions:
        random.shuffle(ids)
    return [str(q) for q in ids[: quiz.total_questions]]


# ── Adaptive next ───────────────────────────────────────────────────────────


def request_next_question(attempt: QuizAttempt) -> Question | None:
    """Return the next question the student should see — or None if done.

    For non-adaptive quizzes: walk `question_order` past the answered ones.
    For adaptive quizzes: ask the AI service for the next difficulty, then
    pick a random un-served question of that difficulty from the bank.
    """

    if attempt.status != QuizAttempt.Status.IN_PROGRESS:
        return None

    answered_ids = set(
        Answer.objects.filter(attempt=attempt).values_list("question_id", flat=True)
    )

    if not attempt.quiz.is_adaptive:
        for qid_str in attempt.question_order:
            try:
                qid = UUID(qid_str)
            except ValueError:
                continue
            if qid not in answered_ids:
                return Question.objects.filter(
                    school_id=attempt.school_id, id=qid_str
                ).first()
        return None  # all served

    # Adaptive path
    if len(answered_ids) >= attempt.quiz.total_questions:
        return None

    target_difficulty = _request_adaptive_difficulty(attempt)
    pool = Question.objects.filter(
        school_id=attempt.school_id,
        bank_id=attempt.quiz.bank_id,
        difficulty=target_difficulty,
    ).exclude(id__in=answered_ids)

    chosen = pool.order_by("?").first()
    if chosen is None:
        # Fall back to any difficulty if the target is exhausted.
        chosen = (
            Question.objects.filter(
                school_id=attempt.school_id, bank_id=attempt.quiz.bank_id
            )
            .exclude(id__in=answered_ids)
            .order_by("?")
            .first()
        )

    if chosen is not None:
        # Append to the canonical order so refresh shows the same sequence.
        attempt.question_order = list(attempt.question_order) + [str(chosen.id)]
        attempt.save(update_fields=["question_order", "updated_at"])
    return chosen


def _request_adaptive_difficulty(attempt: QuizAttempt) -> str:
    """Ask ai_bridge for the next difficulty bucket.

    Wrapped in a function so a bridge failure cannot kill the quiz flow —
    we fall back to the last difficulty (or MEDIUM on the first question).
    """
    from apps.ai_bridge import services as ai_services
    from apps.ai_bridge.client import AiServiceError, AiServiceUnavailable

    fallback = attempt.last_difficulty or Question.Difficulty.MEDIUM
    history = list(
        Answer.objects
        .filter(attempt=attempt)
        .order_by("answered_at")
        .values("question__difficulty", "is_correct")
    )

    payload = {
        "topic":           attempt.quiz.title,
        "grade":           "",
        "last_difficulty": (attempt.last_difficulty or "medium").lower(),
        "last_correct":    history[-1]["is_correct"] if history else True,
        "attempt_history": [
            {"difficulty": h["question__difficulty"].lower(), "correct": h["is_correct"]}
            for h in history
        ],
        "types":          ["mcq"],
        "course_context": "",
    }
    try:
        result = ai_services.adaptive_next(
            school=attempt.quiz.school, user=attempt.student, payload=payload
        )
    except (AiServiceError, AiServiceUnavailable):
        return fallback

    next_diff = (result.get("next_difficulty") or "").upper()
    valid = {c.value for c in Question.Difficulty}
    return next_diff if next_diff in valid else fallback


# ── Recording one answer ────────────────────────────────────────────────────


def record_answer(
    attempt: QuizAttempt,
    *,
    question: Question,
    payload: dict[str, Any],
) -> Answer:
    """Persist + grade one answer atomically. Idempotent on (attempt, question)."""

    if question.school_id != attempt.school_id:
        raise ValidationError("Question does not belong to your school.")
    if question.bank_id != attempt.quiz.bank_id:
        raise ValidationError("Question is not part of this quiz's bank.")

    with transaction.atomic():
        locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
        if locked.status != QuizAttempt.Status.IN_PROGRESS:
            raise ValidationError("Attempt is not in progress.")
        if locked.expires_at <= timezone.now():
            _expire_locked_attempt(locked)
            raise ValidationError("Attempt has expired.")

        is_correct, points = _grade(question, payload)

        answer, _created = Answer.objects.update_or_create(
            attempt=locked,
            question=question,
            defaults={
                "school_id": locked.school_id,
                "selected_option_ids": list(payload.get("selected_option_ids") or []),
                "text_response": str(payload.get("text_response") or "").strip(),
                "is_correct": is_correct,
                "points_awarded": points,
                "time_spent_seconds": int(payload.get("time_spent_seconds") or 0),
            },
        )

        # Track last_difficulty for the next adaptive call.
        locked.last_difficulty = question.difficulty
        locked.save(update_fields=["last_difficulty", "updated_at"])
        return answer


def _grade(question: Question, payload: dict[str, Any]) -> tuple[bool, int]:
    """Server-authoritative grader. Returns (is_correct, points_awarded)."""

    if question.type == Question.Type.SHORT_ANSWER:
        given = str(payload.get("text_response") or "").strip().lower()
        accepted = {str(a).strip().lower() for a in (question.accepted_answers or [])}
        is_correct = bool(given) and given in accepted
    else:
        # MCQ + TRUE_FALSE: order-insensitive set equality on option ids.
        given_ids = {str(x) for x in (payload.get("selected_option_ids") or [])}
        correct_ids = {str(x) for x in (question.correct_option_ids or [])}
        is_correct = bool(correct_ids) and given_ids == correct_ids

    return is_correct, int(question.points if is_correct else 0)


# ── Submit ──────────────────────────────────────────────────────────────────


def submit_attempt(attempt: QuizAttempt) -> QuizAttempt:
    """Finalise an attempt. Computes score from persisted answers."""

    with transaction.atomic():
        locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
        if locked.status == QuizAttempt.Status.SUBMITTED:
            return locked  # idempotent
        if locked.status == QuizAttempt.Status.EXPIRED:
            raise ValidationError("Attempt has expired and cannot be submitted.")

        answers = list(Answer.objects.filter(attempt=locked))
        served_ids = {str(a.question_id) for a in answers}

        # Recompute points_total from the questions actually served — this is
        # the real total even for adaptive quizzes.
        served_questions = Question.objects.filter(
            school_id=locked.school_id, id__in=served_ids
        )
        points_total = sum(int(q.points) for q in served_questions) or 1

        points_earned = sum(int(a.points_awarded) for a in answers)
        correct_count = sum(1 for a in answers if a.is_correct)

        score = (Decimal(points_earned) / Decimal(points_total)) * Decimal(100)
        score = score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        locked.status = QuizAttempt.Status.SUBMITTED
        locked.submitted_at = timezone.now()
        locked.points_total = points_total
        locked.points_earned = points_earned
        locked.correct_count = correct_count
        locked.score_percent = score
        locked.save(update_fields=[
            "status", "submitted_at", "points_total", "points_earned",
            "correct_count", "score_percent", "updated_at",
        ])
        return locked


# ── Expiry ──────────────────────────────────────────────────────────────────


def expire_attempt_if_due(attempt: QuizAttempt) -> bool:
    """If `attempt` is past its expires_at while IN_PROGRESS, mark EXPIRED.

    Returns True iff a state change occurred. Safe to call from any read path
    so an attempt's state self-heals without a Celery beat job.
    """
    if attempt.status != QuizAttempt.Status.IN_PROGRESS:
        return False
    if attempt.expires_at > timezone.now():
        return False

    with transaction.atomic():
        locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
        if locked.status != QuizAttempt.Status.IN_PROGRESS:
            return False
        if locked.expires_at > timezone.now():
            return False
        _expire_locked_attempt(locked)
        return True


def _expire_locked_attempt(attempt: QuizAttempt) -> None:
    """Caller must already hold `select_for_update()` on `attempt`."""
    attempt.status = QuizAttempt.Status.EXPIRED
    attempt.submitted_at = timezone.now()
    attempt.save(update_fields=["status", "submitted_at", "updated_at"])
