"""
File:    backend/apps/quizzes/tests/test_quiz_lifecycle.py
Purpose: Quiz state machine + role gates + tenant isolation across the quiz API surface.
Owner:   Navanish
"""

from __future__ import annotations

import pytest

from apps.quizzes.models import Quiz, QuizAttempt
from apps.quizzes.tests.conftest import _make_course, _make_bank, _make_mcq


@pytest.fixture
def draft_quiz_a(school_a, course_a, bank_a, teacher_a):
    for i in range(3):
        _make_mcq(school_a, bank_a, teacher_a, f"Q{i+1}")
    return Quiz.objects.create(
        school=school_a, course=course_a, bank=bank_a, created_by=teacher_a,
        title="Draft Quiz", duration_minutes=10, total_questions=3,
    )


def _url(quiz: Quiz, action: str = "") -> str:
    base = f"/api/v1/quizzes/quizzes/{quiz.id}/"
    return base + action + ("/" if action else "")


@pytest.mark.django_db
class TestQuizLifecycle:
    def test_teacher_submits_for_review(self, api_client, login, teacher_a, draft_quiz_a):
        login(api_client, teacher_a)
        r = api_client.post(_url(draft_quiz_a, "submit-for-review"))
        assert r.status_code == 200, r.content
        draft_quiz_a.refresh_from_db()
        assert draft_quiz_a.status == Quiz.Status.REVIEW

    def test_teacher_cannot_publish(self, api_client, login, teacher_a, draft_quiz_a):
        """Only PRINCIPAL / SUB_ADMIN can publish — the workflow gate is real."""
        login(api_client, teacher_a)
        api_client.post(_url(draft_quiz_a, "submit-for-review"))
        r = api_client.post(_url(draft_quiz_a, "publish"))
        assert r.status_code == 403

    def test_principal_publishes(self, api_client, login, teacher_a, principal_a, draft_quiz_a):
        login(api_client, teacher_a)
        api_client.post(_url(draft_quiz_a, "submit-for-review"))
        api_client.credentials()
        login(api_client, principal_a)
        r = api_client.post(_url(draft_quiz_a, "publish"))
        assert r.status_code == 200, r.content
        draft_quiz_a.refresh_from_db()
        assert draft_quiz_a.status == Quiz.Status.PUBLISHED
        assert draft_quiz_a.published_at is not None

    def test_publish_from_draft_is_rejected(
        self, api_client, login, principal_a, draft_quiz_a
    ):
        """DRAFT → PUBLISHED is not a legal edge — must pass REVIEW first."""
        login(api_client, principal_a)
        r = api_client.post(_url(draft_quiz_a, "publish"))
        assert r.status_code == 400


@pytest.mark.django_db
class TestQuizListIsolation:
    def test_student_only_sees_published_in_own_school(
        self, api_client, login,
        school_a, course_a, bank_a, teacher_a,
        student_a, student_b,
    ):
        # 3 quizzes in school A: draft, review, published.
        for i in range(3):
            _make_mcq(school_a, bank_a, teacher_a, f"Q{i+1}")
        draft = Quiz.objects.create(
            school=school_a, course=course_a, bank=bank_a,
            title="Draft", status=Quiz.Status.DRAFT, total_questions=3,
        )
        review = Quiz.objects.create(
            school=school_a, course=course_a, bank=bank_a,
            title="Review", status=Quiz.Status.REVIEW, total_questions=3,
        )
        pub = Quiz.objects.create(
            school=school_a, course=course_a, bank=bank_a,
            title="Pub", status=Quiz.Status.PUBLISHED, total_questions=3,
        )

        login(api_client, student_a)
        ids = {q["id"] for q in api_client.get("/api/v1/quizzes/quizzes/").json()["results"]}
        assert str(pub.id) in ids
        assert str(draft.id) not in ids
        assert str(review.id) not in ids

        # Student B in another school sees zero of A's quizzes.
        api_client.credentials()
        login(api_client, student_b)
        ids_b = {q["id"] for q in api_client.get("/api/v1/quizzes/quizzes/").json()["results"]}
        assert ids_b.isdisjoint({str(draft.id), str(review.id), str(pub.id)})


@pytest.mark.django_db
class TestQuizCrossTenantWrites:
    def test_principal_b_cannot_publish_school_a_quiz(
        self, api_client, login, school_a, course_a, bank_a, teacher_a, principal_b
    ):
        for i in range(2):
            _make_mcq(school_a, bank_a, teacher_a, f"Q{i+1}")
        quiz = Quiz.objects.create(
            school=school_a, course=course_a, bank=bank_a,
            title="A quiz", status=Quiz.Status.REVIEW, total_questions=2,
        )
        login(api_client, principal_b)
        r = api_client.post(_url(quiz, "publish"))
        # Cross-tenant get_object() returns 404, not 403 — defence in depth.
        assert r.status_code == 404
        quiz.refresh_from_db()
        assert quiz.status == Quiz.Status.REVIEW

    def test_locked_after_attempt_exists(
        self, api_client, login, school_a, course_a, bank_a, teacher_a,
        principal_a, student_a, draft_quiz_a,
    ):
        """Editing a PUBLISHED quiz with at least one attempt must be blocked."""
        from django.utils import timezone

        # Push to PUBLISHED via the real workflow.
        login(api_client, teacher_a)
        api_client.post(_url(draft_quiz_a, "submit-for-review"))
        api_client.credentials()
        login(api_client, principal_a)
        api_client.post(_url(draft_quiz_a, "publish"))

        QuizAttempt.objects.create(
            school=school_a, quiz=draft_quiz_a, student=student_a,
            expires_at=timezone.now(),
        )

        api_client.credentials()
        login(api_client, teacher_a)
        r = api_client.patch(_url(draft_quiz_a), {"title": "Rename"}, format="json")
        assert r.status_code == 400
