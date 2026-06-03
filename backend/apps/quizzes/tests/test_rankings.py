"""
File:    backend/apps/quizzes/tests/test_rankings.py
Purpose: The Phase 1 rankings/leaderboard endpoint — ordering, best-of-N, tenant isolation, self-row.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.quizzes.models import Quiz, QuizAttempt
from apps.quizzes.tests.conftest import _make_course, _make_bank, _make_mcq, _submitted_attempt


def _ranking_url(quiz: Quiz, **params) -> str:
    base = f"/api/v1/quizzes/quizzes/{quiz.id}/rankings/"
    if params:
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{base}?{query}"
    return base


def _make_extra_student(school, *, username: str, email: str):
    return User.objects.create_user(
        username=username, email=email, password="Skillship#Test-2026",
        first_name=username, last_name="Test",
        role=User.Role.STUDENT, school=school,
    )


@pytest.mark.django_db
class TestRankings:
    def test_anonymous_blocked(self, api_client, published_quiz_a):
        r = api_client.get(_ranking_url(published_quiz_a))
        assert r.status_code == 401

    def test_empty_when_no_attempts(self, api_client, login, principal_a, published_quiz_a):
        login(api_client, principal_a)
        r = api_client.get(_ranking_url(published_quiz_a))
        assert r.status_code == 200
        body = r.json()
        assert body["count"] == 0
        assert body["results"] == []

    def test_orders_by_score_descending_then_earlier_submit(
        self, api_client, login, principal_a, school_a, published_quiz_a, student_a
    ):
        other = _make_extra_student(school_a, username="stud2", email="s2@a.test")
        third = _make_extra_student(school_a, username="stud3", email="s3@a.test")
        t0 = timezone.now() - datetime.timedelta(minutes=30)

        _submitted_attempt(published_quiz_a, student_a, score=80, when=t0)
        # `other` ties on score but submits later → ranks lower.
        _submitted_attempt(published_quiz_a, other, score=80, when=t0 + datetime.timedelta(minutes=5))
        _submitted_attempt(published_quiz_a, third, score=100, when=t0 + datetime.timedelta(minutes=2))

        login(api_client, principal_a)
        body = api_client.get(_ranking_url(published_quiz_a)).json()

        ranks = body["results"]
        assert [r["rank"] for r in ranks] == [1, 2, 3]
        assert ranks[0]["student_id"] == str(third.id)
        assert ranks[0]["score_percent"] == 100.0
        # Tie-breaker: earlier submission wins.
        assert ranks[1]["student_id"] == str(student_a.id)
        assert ranks[2]["student_id"] == str(other.id)
        # Duration is computed from started_at → submitted_at (120 s in fixture).
        assert ranks[0]["duration_seconds"] == 120

    def test_best_attempt_per_student(
        self, api_client, login, principal_a, published_quiz_a, student_a
    ):
        """Two attempts by same student — leaderboard surfaces only the best."""
        t = timezone.now() - datetime.timedelta(minutes=20)
        _submitted_attempt(published_quiz_a, student_a, score=50, when=t, attempt_number=1)
        _submitted_attempt(published_quiz_a, student_a, score=90, when=t + datetime.timedelta(minutes=5), attempt_number=2)

        login(api_client, principal_a)
        body = api_client.get(_ranking_url(published_quiz_a)).json()
        assert body["count"] == 1
        assert len(body["results"]) == 1
        assert body["results"][0]["score_percent"] == 90.0

    def test_limit_caps_results_and_appends_self_for_outsider_student(
        self, api_client, login, school_a, published_quiz_a, student_a
    ):
        # 3 high-scoring students push student_a to 4th place; limit=3 → student_a appended via `self`.
        top1 = _make_extra_student(school_a, username="top1", email="t1@a.test")
        top2 = _make_extra_student(school_a, username="top2", email="t2@a.test")
        top3 = _make_extra_student(school_a, username="top3", email="t3@a.test")
        t = timezone.now() - datetime.timedelta(minutes=30)
        _submitted_attempt(published_quiz_a, top1, score=100, when=t)
        _submitted_attempt(published_quiz_a, top2, score=95,  when=t + datetime.timedelta(seconds=10))
        _submitted_attempt(published_quiz_a, top3, score=90,  when=t + datetime.timedelta(seconds=20))
        _submitted_attempt(published_quiz_a, student_a, score=40, when=t + datetime.timedelta(seconds=30))

        login(api_client, student_a)
        body = api_client.get(_ranking_url(published_quiz_a, limit=3)).json()
        assert body["count"] == 4
        assert len(body["results"]) == 3
        assert "self" in body
        assert body["self"]["rank"] == 4
        assert body["self"]["student_id"] == str(student_a.id)

    def test_no_self_row_when_student_in_top_n(
        self, api_client, login, school_a, published_quiz_a, student_a
    ):
        t = timezone.now() - datetime.timedelta(minutes=20)
        _submitted_attempt(published_quiz_a, student_a, score=95, when=t)
        login(api_client, student_a)
        body = api_client.get(_ranking_url(published_quiz_a, limit=10)).json()
        assert "self" not in body

    def test_in_progress_attempts_excluded(
        self, api_client, login, principal_a, school_a, published_quiz_a, student_a
    ):
        QuizAttempt.objects.create(
            school=school_a, quiz=published_quiz_a, student=student_a,
            status=QuizAttempt.Status.IN_PROGRESS,
            expires_at=timezone.now() + datetime.timedelta(minutes=5),
        )
        login(api_client, principal_a)
        body = api_client.get(_ranking_url(published_quiz_a)).json()
        assert body["count"] == 0


@pytest.mark.django_db
class TestRankingsTenantIsolation:
    def test_school_b_student_cannot_see_school_a_rankings(
        self, api_client, login, published_quiz_a, student_b
    ):
        login(api_client, student_b)
        r = api_client.get(_ranking_url(published_quiz_a))
        # `get_object()` filters by school — cross-tenant lookup returns 404, not 403.
        assert r.status_code == 404

    def test_school_b_principal_cannot_see_school_a_rankings(
        self, api_client, login, published_quiz_a, principal_b
    ):
        login(api_client, principal_b)
        r = api_client.get(_ranking_url(published_quiz_a))
        assert r.status_code == 404
