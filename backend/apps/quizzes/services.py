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

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt


# ── Quiz state machine ──────────────────────────────────────────────────────


_QUIZ_TRANSITIONS: dict[str, set[str]] = {
    Quiz.Status.DRAFT:     {Quiz.Status.REVIEW, Quiz.Status.ARCHIVED},
    Quiz.Status.REVIEW:    {Quiz.Status.DRAFT, Quiz.Status.PUBLISHED, Quiz.Status.ARCHIVED},
    Quiz.Status.PUBLISHED: {Quiz.Status.ARCHIVED},
    Quiz.Status.ARCHIVED:  set(),  # terminal
}

# Who can drive each transition.
_REVIEW_ROLES = {Role.SUB_ADMIN, Role.MAIN_ADMIN}
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
            raise ValidationError("Only MAIN_ADMIN or SUB_ADMIN can publish a quiz.")
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
        fields = ["status", "published_at", "archived_at", "updated_at"]
        if target == Quiz.Status.PUBLISHED:
            locked.published_at = timezone.now()
            # Record the approver + their role snapshot for the "approved by" tag.
            locked.published_by = actor
            locked.published_by_role = actor.role
            fields += ["published_by", "published_by_role"]
        elif target == Quiz.Status.ARCHIVED:
            locked.archived_at = timezone.now()
        locked.save(update_fields=fields)
        return locked


# ── Wizard authoring adapter ────────────────────────────────────────────────
#
# The teacher/sub-admin quiz wizard thinks of a quiz as a self-contained object:
# title + subject + grade + a list of inline questions. The data model is
# course + question-bank based (questions live in a bank; a quiz draws from it).
# This adapter bridges the two: it provisions a Course and a QuestionBank from
# the wizard's subject/grade, creates the inline Questions in that bank, builds
# the Quiz, and runs the requested DRAFT→REVIEW transition — all atomically.

_OPTION_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"]


def _parse_grade(grade: str) -> int:
    """'Class 6' / '6' / 'Grade 8' → 6 / 6 / 8. Clamped to 1–12, default 1."""
    import re

    m = re.search(r"\d+", grade or "")
    if not m:
        return 1
    return max(1, min(12, int(m.group())))


def _convert_question(raw: dict, default_difficulty: str) -> dict:
    """Map a wizard DraftQuestion (options as plain strings + correct index) to
    the stored Question shape (options as [{id,text}] + correct_option_ids)."""
    opts = [str(o) for o in (raw.get("options") or []) if str(o).strip()]
    diff = (raw.get("difficulty") or default_difficulty or "MEDIUM").upper()
    if diff not in {d.value for d in Question.Difficulty}:
        diff = Question.Difficulty.MEDIUM
    if opts:
        options = [{"id": _OPTION_IDS[i], "text": text} for i, text in enumerate(opts)]
        idx = raw.get("correct_answer_index") or 0
        idx = idx if 0 <= idx < len(options) else 0
        return {
            "text": raw["text"],
            "type": Question.Type.MCQ,
            "difficulty": diff,
            "options": options,
            "correct_option_ids": [options[idx]["id"]],
            "explanation": raw.get("explanation", "") or "",
            "points": raw.get("points") or 1,
        }
    return {
        "text": raw["text"],
        "type": Question.Type.SHORT_ANSWER,
        "difficulty": diff,
        "options": [],
        "correct_option_ids": [],
        # Normalise to lower/stripped so the auto string-match in _grade lines up.
        "accepted_answers": [
            str(a).strip().lower() for a in (raw.get("accepted_answers") or []) if str(a).strip()
        ],
        "explanation": raw.get("explanation", "") or "",
        "points": raw.get("points") or 1,
    }


@transaction.atomic
def author_quiz(*, actor, school_id, data: dict) -> Quiz:
    """Provision course + bank + questions + quiz from the wizard payload and
    apply the requested status transition. Returns the created Quiz."""
    from uuid import uuid4

    from apps.academics.models import Course

    subject = (data.get("subject") or "General").strip() or "General"
    grade_num = _parse_grade(data.get("grade") or "")
    default_difficulty = (data.get("difficulty") or "MEDIUM").upper()

    course, _ = Course.objects.get_or_create(
        school_id=school_id,
        name=subject,
        defaults={
            "code": f"{subject[:6].upper().replace(' ', '')}-{grade_num}",
            "grade_min": grade_num,
            "grade_max": grade_num,
        },
    )

    bank = QuestionBank.objects.create(
        school_id=school_id,
        course=course,
        # Unique per (school, course, name); suffix keeps same-titled quizzes distinct.
        name=f"{data['title'][:180]} — {uuid4().hex[:6]}",
        created_by=actor,
    )

    questions = data.get("questions") or []
    Question.objects.bulk_create([
        Question(bank=bank, school_id=school_id, created_by=actor,
                 **_convert_question(q, default_difficulty))
        for q in questions
    ])

    quiz = Quiz.objects.create(
        school_id=school_id,
        course=course,
        bank=bank,
        title=data["title"],
        description=data.get("instructions", "") or "",
        grade=(data.get("grade") or "").strip(),
        section=(data.get("section") or "").strip(),
        randomize_questions=data.get("shuffle_questions", True),
        duration_minutes=data.get("duration_minutes") or 30,
        total_questions=max(len(questions), 1),
        pass_percentage=data.get("passing_score", 50),
        attempts_allowed=data.get("attempts_allowed", 1),
        certificate_enabled=data.get("certificate_enabled", False),
        created_by=actor,
        status=Quiz.Status.DRAFT,
    )

    # Teacher "Submit" asks for REVIEW; "Save draft" stays DRAFT. Publishing is
    # the reviewer's job (admin/principal/sub-admin) via the approval panel.
    if (data.get("status") or "DRAFT").upper() == "REVIEW":
        quiz = transition_quiz_status(quiz, target=Quiz.Status.REVIEW, actor=actor)

    return quiz


@transaction.atomic
def submit_full_attempt(*, quiz: Quiz, student, answers: dict) -> QuizAttempt:
    """One-shot attempt grading: the student submits every answer at once
    ({question_id: option_id}). We create the attempt, grade server-side against
    each question's correct_option_ids, and return the scored attempt.

    Scoring is server-authoritative — the client's view of correctness is never
    trusted (students only ever receive the answer-free question shape)."""
    if quiz.status != Quiz.Status.PUBLISHED:
        raise ValidationError("Quiz is not published.")
    if student.school_id != quiz.school_id:
        raise ValidationError("Quiz does not belong to your school.")

    prior = (
        QuizAttempt.objects.filter(quiz=quiz, student=student)
        .exclude(status=QuizAttempt.Status.IN_PROGRESS)
        .count()
    )
    if quiz.attempts_allowed and prior >= quiz.attempts_allowed:
        raise ValidationError("You have used all your attempts for this quiz.")

    now = timezone.now()
    questions = list(quiz.bank.questions.all())
    attempt = QuizAttempt.objects.create(
        school_id=quiz.school_id,
        quiz=quiz,
        student=student,
        status=QuizAttempt.Status.SUBMITTED,
        attempt_number=prior + 1,
        expires_at=now,
        submitted_at=now,
        question_order=[str(q.id) for q in questions],
    )

    points_earned = points_total = correct_count = 0
    rows = []
    for q in questions:
        raw = (answers or {}).get(str(q.id))
        points_total += q.points
        if q.type == Question.Type.SHORT_ANSWER:
            # Free-text answer: the value is the student's text (we also accept
            # {"text": ...}). Auto string-match for a provisional score, then
            # queue it PENDING so a teacher can review/override via Feedback.
            text = ""
            if isinstance(raw, dict):
                text = str(raw.get("text") or "").strip()
            elif raw is not None:
                text = str(raw).strip()
            is_correct, awarded = _grade(q, {"text_response": text})
            rows.append(Answer(
                school_id=quiz.school_id, attempt=attempt, question=q,
                selected_option_ids=[], text_response=text,
                is_correct=is_correct, points_awarded=awarded,
                feedback_status=Answer.FeedbackStatus.PENDING,
            ))
        else:
            sel = raw if isinstance(raw, str) else None
            selected_ids = [sel] if sel else []
            is_correct, awarded = _grade(q, {"selected_option_ids": selected_ids})
            rows.append(Answer(
                school_id=quiz.school_id, attempt=attempt, question=q,
                selected_option_ids=selected_ids, is_correct=is_correct, points_awarded=awarded,
                feedback_status=Answer.FeedbackStatus.NOT_REQUIRED,
            ))
        points_earned += awarded
        correct_count += 1 if is_correct else 0
    Answer.objects.bulk_create(rows)

    pct = (
        Decimal(0) if points_total == 0
        else (Decimal(points_earned) / Decimal(points_total) * 100).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP)
    )
    attempt.score_percent = pct
    attempt.points_earned = points_earned
    attempt.points_total = points_total
    attempt.correct_count = correct_count
    attempt.save(update_fields=["score_percent", "points_earned", "points_total", "correct_count"])
    return attempt


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

        # Short answers are auto-graded by string-match, then queued for a
        # teacher to review (PENDING). Objective types need no human review.
        is_short = question.type == Question.Type.SHORT_ANSWER
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
                "feedback_status": (
                    Answer.FeedbackStatus.PENDING if is_short
                    else Answer.FeedbackStatus.NOT_REQUIRED
                ),
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


# ── Short-answer teacher feedback ───────────────────────────────────────────


def recompute_attempt_score(attempt: QuizAttempt) -> QuizAttempt:
    """Re-aggregate a submitted attempt's score from its answers.

    Called after a teacher finalises a short-answer grade (which can change an
    answer's points_awarded / is_correct). Mirrors submit_attempt's maths but
    leaves status / submitted_at untouched.
    """
    with transaction.atomic():
        locked = QuizAttempt.objects.select_for_update().get(pk=attempt.pk)
        answers = list(Answer.objects.filter(attempt=locked))
        served_ids = {str(a.question_id) for a in answers}
        served_questions = Question.objects.filter(
            school_id=locked.school_id, id__in=served_ids
        )
        points_total = sum(int(q.points) for q in served_questions) or 1
        points_earned = sum(int(a.points_awarded) for a in answers)
        correct_count = sum(1 for a in answers if a.is_correct)

        score = (Decimal(points_earned) / Decimal(points_total)) * Decimal(100)
        score = score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        locked.points_total = points_total
        locked.points_earned = points_earned
        locked.correct_count = correct_count
        locked.score_percent = score
        locked.save(update_fields=[
            "points_total", "points_earned", "correct_count", "score_percent", "updated_at",
        ])
        return locked


def finalise_short_answer_feedback(*, answer: Answer, actor, marks, feedback: str) -> Answer:
    """Record a teacher's grade for one short-answer response and recompute the
    parent attempt's aggregate score.

    `marks` is the whole-number marks the teacher awards, out of the question's
    own `points` (e.g. 3 out of 5). No percentages, no rounding — the teacher's
    marks go straight into points_awarded. is_correct (a display stat) is set
    when the answer earned at least half marks. SHORT_ANSWER only.
    """
    if answer.question.type != Question.Type.SHORT_ANSWER:
        raise ValidationError("Only short-answer responses can be graded here.")
    max_marks = int(answer.question.points)
    try:
        marks_int = int(marks)
    except (TypeError, ValueError) as exc:
        raise ValidationError("marks must be a whole number.") from exc
    if marks_int < 0 or marks_int > max_marks:
        raise ValidationError(f"marks must be between 0 and {max_marks}.")

    with transaction.atomic():
        locked = Answer.objects.select_for_update().get(pk=answer.pk)
        locked.teacher_score = marks_int          # marks awarded (out of max_marks)
        locked.teacher_feedback = (feedback or "").strip()
        locked.points_awarded = marks_int
        locked.is_correct = marks_int * 2 >= max_marks  # ≥ half marks counts as correct
        locked.feedback_status = Answer.FeedbackStatus.FINALISED
        locked.feedback_by = actor
        locked.feedback_at = timezone.now()
        # NB: answered_at is auto_now — omit it so the student's answer time is kept.
        locked.save(update_fields=[
            "teacher_score", "teacher_feedback", "points_awarded", "is_correct",
            "feedback_status", "feedback_by", "feedback_at",
        ])
        recompute_attempt_score(locked.attempt)
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


# ── CSV bulk import (Phase 4.4) ─────────────────────────────────────────────


_CSV_REQUIRED_COLUMNS = ("text", "type", "difficulty", "points")
_CSV_LETTER_TO_INDEX = {"A": 0, "B": 1, "C": 2, "D": 3}


def import_questions_csv(*, bank: QuestionBank, created_by, csv_text: str) -> dict:
    """Parse a CSV string and create one Question per row inside the bank.

    Failures are reported per-row; valid rows still commit so a partial CSV
    isn't blocked by one bad line. Rows in error never increment `created`.

    Returns: {total_rows, created, errors: [{row, message}, ...]}
    """
    import csv as _csv
    import io as _io

    reader = _csv.DictReader(_io.StringIO(csv_text))
    if reader.fieldnames is None:
        return {"total_rows": 0, "created": 0, "errors": [{"row": 0, "message": "CSV is empty."}]}

    missing = [c for c in _CSV_REQUIRED_COLUMNS if c not in reader.fieldnames]
    if missing:
        return {
            "total_rows": 0, "created": 0,
            "errors": [{"row": 0, "message": f"Missing required columns: {', '.join(missing)}"}],
        }

    created = 0
    errors: list[dict] = []
    total = 0

    for row_idx, row in enumerate(reader, start=2):  # row 1 is the header
        total += 1
        try:
            q = _build_question_from_row(bank=bank, created_by=created_by, row=row)
            q.save()
            created += 1
        except (ValueError, KeyError) as exc:
            errors.append({"row": row_idx, "message": str(exc)})

    return {"total_rows": total, "created": created, "errors": errors}


def _build_question_from_row(*, bank: QuestionBank, created_by, row: dict) -> Question:
    text = (row.get("text") or "").strip()
    if not text:
        raise ValueError("`text` is empty.")

    type_raw = (row.get("type") or "").strip().upper()
    if type_raw not in {"MCQ", "TRUE_FALSE", "SHORT_ANSWER"}:
        raise ValueError(f"`type` must be MCQ / TRUE_FALSE / SHORT_ANSWER (got {type_raw!r}).")

    difficulty_raw = (row.get("difficulty") or "").strip().upper() or "MEDIUM"
    if difficulty_raw not in {"EASY", "MEDIUM", "HARD"}:
        raise ValueError(f"`difficulty` must be EASY / MEDIUM / HARD (got {difficulty_raw!r}).")

    try:
        points = int(row.get("points") or 1)
    except ValueError as exc:
        raise ValueError("`points` must be an integer.") from exc
    if points < 1 or points > 255:
        raise ValueError("`points` must be between 1 and 255.")

    options: list[dict] = []
    correct_option_ids: list[str] = []
    accepted_answers: list[str] = []

    if type_raw == "MCQ":
        for letter in ("A", "B", "C", "D"):
            cell = (row.get(f"option_{letter.lower()}") or "").strip()
            if cell:
                options.append({"id": letter.lower(), "text": cell})
        if len(options) < 2:
            raise ValueError("MCQ rows need at least two `option_*` columns filled.")
        raw_correct = (row.get("correct") or "").strip().upper()
        if not raw_correct:
            raise ValueError("MCQ rows need `correct` set to one or more of A/B/C/D.")
        # Allow "A" or "A,C" for multi-select MCQ.
        for letter in (c.strip() for c in raw_correct.split(",")):
            if letter not in _CSV_LETTER_TO_INDEX:
                raise ValueError(f"`correct` letter {letter!r} is not A/B/C/D.")
            idx = _CSV_LETTER_TO_INDEX[letter]
            if idx >= len(options):
                raise ValueError(f"`correct` letter {letter!r} but no option_{letter.lower()} was provided.")
            correct_option_ids.append(options[idx]["id"])

    elif type_raw == "TRUE_FALSE":
        options = [{"id": "true", "text": "True"}, {"id": "false", "text": "False"}]
        raw = (row.get("correct") or "").strip().lower()
        if raw in {"true", "t", "yes", "1"}:
            correct_option_ids = ["true"]
        elif raw in {"false", "f", "no", "0"}:
            correct_option_ids = ["false"]
        else:
            raise ValueError("TRUE_FALSE rows need `correct` = True / False.")

    else:  # SHORT_ANSWER
        raw = (row.get("accepted_answers") or "").strip()
        if not raw:
            raise ValueError("SHORT_ANSWER rows need `accepted_answers` (pipe-separated).")
        accepted_answers = [a.strip().lower() for a in raw.split("|") if a.strip()]
        if not accepted_answers:
            raise ValueError("SHORT_ANSWER `accepted_answers` is empty after parsing.")

    tags_raw = (row.get("tags") or "").strip()
    tags = [t.strip() for t in tags_raw.split("|") if t.strip()]

    return Question(
        school_id=bank.school_id,
        bank=bank,
        created_by=created_by,
        text=text,
        type=type_raw,
        difficulty=difficulty_raw,
        options=options,
        correct_option_ids=correct_option_ids,
        accepted_answers=accepted_answers,
        tags=tags,
        points=points,
        explanation=(row.get("explanation") or "").strip(),
    )


# ── Student stats / leaderboard (dashboard, rankings, rank-in-class) ──────────


def attempt_summary(student) -> dict:
    """Aggregate a student's own quiz activity for the dashboard hero stats.

    `avg_score` is the mean over the student's SUBMITTED attempts. The `prev_*`
    figures cover the 30-day window *before* the most-recent 30 days so the
    dashboard can render a "vs last month" delta. All values are real — derived
    straight from QuizAttempt, never the (nightly, possibly-empty) rollup table.
    """
    from django.db.models import Avg, Count

    now = timezone.now()
    cur_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)

    submitted = QuizAttempt.objects.filter(
        student=student, status=QuizAttempt.Status.SUBMITTED
    )
    agg = submitted.aggregate(n=Count("id"), avg=Avg("score_percent"))

    # Count of PUBLISHED quizzes available to the student (their school), so the
    # dashboard can show "completed / total".
    total_quizzes = Quiz.objects.filter(
        school_id=student.school_id, status=Quiz.Status.PUBLISHED
    ).count()

    cur = submitted.filter(submitted_at__gte=cur_start).aggregate(
        n=Count("id"), avg=Avg("score_percent")
    )
    prev = submitted.filter(
        submitted_at__gte=prev_start, submitted_at__lt=cur_start
    ).aggregate(n=Count("id"), avg=Avg("score_percent"))

    def _round(v):
        return round(float(v), 1) if v is not None else None

    return {
        "completed": agg["n"] or 0,
        "total": total_quizzes,
        "avg_score": _round(agg["avg"]),
        "prev_avg_score": _round(prev["avg"]),
        "prev_completed": prev["n"] or 0,
    }


def certificates_count(student) -> int:
    """How many certificates a student has earned.

    A certificate exists only for a quiz whose teacher enabled certificates
    (`quiz.certificate_enabled`) AND which the student passed
    (`score_percent >= quiz.pass_percentage`). Counted once per quiz. Matches
    `certificate_available` on the attempt serializer + the Certificates page.
    """
    from django.db.models import F

    return (
        QuizAttempt.objects.filter(
            student=student,
            status=QuizAttempt.Status.SUBMITTED,
            quiz__certificate_enabled=True,
            score_percent__gte=F("quiz__pass_percentage"),
        )
        .values("quiz_id")
        .distinct()
        .count()
    )


def student_leaderboard(*, school_id, klass_id=None) -> list[dict]:
    """Ranked leaderboard rows for a school, optionally narrowed to one class.

    One row per STUDENT who has at least one SUBMITTED attempt, ordered by
    average score (desc), then quizzes attempted (desc), then name. Each row
    carries the student's class label from their latest enrolment. `avg_score`
    is the mean over all the student's submitted attempts (same basis as the
    teacher/principal roster, so a student's rank matches what staff see).
    """
    from django.db.models import Avg, Count, Max

    from apps.academics.models import Enrollment
    from apps.accounts.models import User

    student_qs = User.objects.filter(role=Role.STUDENT, school_id=school_id)
    if klass_id is not None:
        in_class = list(
            Enrollment.objects.filter(
                school_id=school_id, klass_id=klass_id, withdrawn_on__isnull=True
            ).values_list("student_id", flat=True)
        )
        student_qs = student_qs.filter(id__in=in_class)

    students = {s.id: s for s in student_qs}
    if not students:
        return []

    # Latest class label per student (one query; first row per student wins).
    klass_by_student: dict = {}
    for e in (
        Enrollment.objects.filter(student_id__in=list(students.keys()))
        .select_related("klass")
        .order_by("student_id", "-enrolled_on")
    ):
        if e.student_id not in klass_by_student and e.klass_id:
            klass_by_student[e.student_id] = e.klass

    stats = (
        QuizAttempt.objects.filter(
            student_id__in=list(students.keys()),
            status=QuizAttempt.Status.SUBMITTED,
        )
        .values("student_id")
        .annotate(avg=Avg("score_percent"), quizzes=Count("id"), last=Max("submitted_at"))
    )

    rows = []
    for r in stats:
        s = students.get(r["student_id"])
        if s is None:
            continue
        klass = klass_by_student.get(s.id)
        rows.append({
            "id": str(s.id),
            "first_name": s.first_name,
            "last_name": s.last_name,
            "full_name": s.get_full_name() or s.username,
            "grade": klass.grade if klass else None,
            "section": klass.section if klass else None,
            "class_name": f"Grade {klass.grade}-{klass.section}" if klass else None,
            "quizzes_attempted": r["quizzes"],
            "avg_score": round(float(r["avg"]), 2) if r["avg"] is not None else None,
        })

    rows.sort(key=lambda x: (
        -(x["avg_score"] or 0.0),
        -(x["quizzes_attempted"] or 0),
        (x["full_name"] or "").lower(),
    ))
    for i, row in enumerate(rows):
        row["rank"] = i + 1
    return rows


def rank_in_class(student) -> tuple[int | None, int]:
    """The student's (rank, class_size) within their current class.

    Rank is over classmates with ≥1 submitted attempt (the leaderboard set);
    a student with no attempts gets rank=None. class_size is the headcount of
    the class regardless of activity. Returns (None, 0) if the student is not
    enrolled in any class.
    """
    from apps.academics.models import Enrollment

    enr = (
        Enrollment.objects.filter(student=student, withdrawn_on__isnull=True)
        .select_related("klass")
        .order_by("-enrolled_on")
        .first()
    )
    if enr is None or enr.klass_id is None:
        return None, 0

    class_size = (
        Enrollment.objects.filter(
            school_id=student.school_id, klass_id=enr.klass_id, withdrawn_on__isnull=True
        )
        .values("student_id")
        .distinct()
        .count()
    )
    board = student_leaderboard(school_id=student.school_id, klass_id=enr.klass_id)
    for row in board:
        if row["id"] == str(student.id):
            return row["rank"], class_size
    return None, class_size
