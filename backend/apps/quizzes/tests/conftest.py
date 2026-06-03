"""
File:    backend/apps/quizzes/tests/conftest.py
Purpose: Quiz-domain fixtures — courses, question banks, published quizzes, attempts.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest

from apps.academics.models import AcademicYear, Course
from apps.quizzes.models import Question, QuestionBank, Quiz, QuizAttempt


def _make_course(school, code="MATH-10"):
    return Course.objects.create(
        school=school, name=f"Course {code}", code=code, grade_min=1, grade_max=12,
    )


def _make_bank(school, course, teacher):
    return QuestionBank.objects.create(
        school=school, course=course, created_by=teacher,
        name=f"{course.code} Bank", description="",
    )


def _make_mcq(school, bank, teacher, text: str, points: int = 1):
    return Question.objects.create(
        school=school, bank=bank, created_by=teacher,
        text=text, type=Question.Type.MCQ, difficulty=Question.Difficulty.EASY,
        options=[{"id": "a", "text": "A"}, {"id": "b", "text": "B"}],
        correct_option_ids=["a"], points=points,
    )


@pytest.fixture
def course_a(school_a):
    return _make_course(school_a, code="MATH-A")


@pytest.fixture
def course_b(school_b):
    return _make_course(school_b, code="MATH-B")


@pytest.fixture
def bank_a(school_a, course_a, teacher_a):
    return _make_bank(school_a, course_a, teacher_a)


@pytest.fixture
def published_quiz_a(school_a, course_a, bank_a, teacher_a):
    """A published quiz in school A with 3 questions of 1 point each."""
    for i in range(3):
        _make_mcq(school_a, bank_a, teacher_a, f"Q{i+1}", points=1)
    quiz = Quiz.objects.create(
        school=school_a, course=course_a, bank=bank_a, created_by=teacher_a,
        title="Algebra Test", description="",
        status=Quiz.Status.PUBLISHED,
        duration_minutes=10,
        total_questions=3,
        is_adaptive=False,
    )
    return quiz


def _submitted_attempt(quiz, student, score: float, when: datetime.datetime, attempt_number: int = 1):
    """Create one already-submitted attempt with a deterministic score."""
    points_total = quiz.total_questions
    points_earned = int(round(score * points_total / 100))
    attempt = QuizAttempt.objects.create(
        school=quiz.school, quiz=quiz, student=student,
        status=QuizAttempt.Status.SUBMITTED,
        attempt_number=attempt_number,
        expires_at=when + datetime.timedelta(minutes=10),
        submitted_at=when,
        score_percent=score,
        points_earned=points_earned,
        points_total=points_total,
        correct_count=points_earned,
    )
    # `started_at` is auto_now_add — backdate via a save to make duration deterministic.
    QuizAttempt.objects.filter(pk=attempt.pk).update(
        started_at=when - datetime.timedelta(seconds=120),
    )
    attempt.refresh_from_db()
    return attempt
