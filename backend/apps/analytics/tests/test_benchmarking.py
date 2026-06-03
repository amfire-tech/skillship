"""
File:    backend/apps/analytics/tests/test_benchmarking.py
Purpose: Cross-class / cross-school benchmarking — ranking, percentiles, role gates.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest

from apps.academics.models import AcademicYear, Class
from apps.analytics.models import ClassWeeklyStats


URL = "/api/v1/analytics/benchmarking/"


def _seed_class(school, *, grade: int, section: str, avg_score: float, at_risk: int = 0):
    today = datetime.date.today()
    year, _ = AcademicYear.objects.get_or_create(
        school=school,
        name=f"YR-{grade}-{section}",
        defaults={
            "start_date": today - datetime.timedelta(days=60),
            "end_date":   today + datetime.timedelta(days=60),
        },
    )
    klass = Class.objects.create(school=school, academic_year=year, grade=grade, section=section)
    ClassWeeklyStats.objects.create(
        school=school, klass=klass,
        week_start_date=today - datetime.timedelta(days=today.weekday() or 7),
        avg_score=avg_score, at_risk_count=at_risk,
    )
    return klass


@pytest.mark.django_db
class TestClassBenchmarking:
    def test_anonymous_blocked(self, api_client):
        assert api_client.get(f"{URL}?level=class").status_code == 401

    def test_student_blocked(self, api_client, login, school_a, student_a):
        login(api_client, student_a)
        assert api_client.get(f"{URL}?level=class").status_code == 403

    def test_principal_ranking_within_school(
        self, api_client, login, school_a, principal_a
    ):
        _seed_class(school_a, grade=10, section="A", avg_score=85)
        _seed_class(school_a, grade=10, section="B", avg_score=92)
        _seed_class(school_a, grade=10, section="C", avg_score=68)

        login(api_client, principal_a)
        body = api_client.get(f"{URL}?level=class").json()
        assert body["count"] == 3
        # Median of 85, 92, 68 → 85
        assert body["median"] == 85.0
        ranks = body["results"]
        assert ranks[0]["label"] == "Grade 10-B"
        assert ranks[0]["rank"] == 1
        assert ranks[0]["delta_median"] == pytest.approx(7.0, abs=0.01)
        assert ranks[-1]["label"] == "Grade 10-C"
        assert ranks[-1]["rank"] == 3

    def test_empty_window_returns_zero(
        self, api_client, login, school_a, principal_a
    ):
        login(api_client, principal_a)
        # No ClassWeeklyStats in DB for this scope → count 0, results [].
        body = api_client.get(f"{URL}?level=class&from=2020-01-01&to=2020-01-31").json()
        assert body["count"] == 0
        assert body["results"] == []
        assert body["median"] is None

    def test_principal_b_does_not_see_school_a_classes(
        self, api_client, login, school_a, school_b, principal_b
    ):
        _seed_class(school_a, grade=10, section="A", avg_score=85)
        login(api_client, principal_b)
        body = api_client.get(f"{URL}?level=class").json()
        # principal_b's school has no rows → count 0.
        assert body["count"] == 0


@pytest.mark.django_db
class TestSchoolBenchmarking:
    def test_main_admin_only(self, api_client, login, principal_a):
        login(api_client, principal_a)
        assert api_client.get(f"{URL}?level=school").status_code == 403

    def test_main_admin_ranks_active_schools(
        self, api_client, login, school_a, school_b, main_admin
    ):
        _seed_class(school_a, grade=10, section="A", avg_score=90)
        _seed_class(school_b, grade=10, section="A", avg_score=72)
        login(api_client, main_admin)
        body = api_client.get(f"{URL}?level=school").json()
        assert body["count"] == 2
        assert body["results"][0]["slug"] == "dps-a"
        assert body["results"][0]["rank"] == 1
        assert body["results"][1]["slug"] == "sxb-b"

    def test_invalid_level_rejected(self, api_client, login, main_admin):
        login(api_client, main_admin)
        assert api_client.get(f"{URL}?level=district").status_code == 400

    def test_main_admin_class_level_requires_school_id(
        self, api_client, login, main_admin
    ):
        login(api_client, main_admin)
        # MAIN_ADMIN at class level without school_id → 400.
        assert api_client.get(f"{URL}?level=class").status_code == 400
