"""
File:    backend/apps/common/tests/test_seed_demo.py
Purpose: Behaviour tests for the seed_demo management command.
Owner:   Navanish

Covers:
  - Fresh seed produces the documented row counts.
  - Running it a second time is a no-op (idempotency contract).
  - --reset wipes only demo-marked rows, leaves non-demo rows alone.
"""

from __future__ import annotations

from io import StringIO

import pytest
from django.core.management import call_command

from apps.accounts.models import User
from apps.content.models import MarketplaceListing
from apps.leads.models import DemoRequest
from apps.schools.models import School


def _run_seed(*extra_args):
    out = StringIO()
    call_command("seed_demo", "--quiet", *extra_args, stdout=out)
    return out.getvalue()


@pytest.mark.django_db
class TestSeedDemo:
    def test_seed_creates_expected_baseline(self):
        _run_seed()

        # Two schools, plus the documented head-counts per school.
        assert School.objects.count() == 2
        # 1 MAIN_ADMIN + 2 schools × (1 principal + 1 sub_admin + 2 teachers + 6 students)
        assert User.objects.filter(username__startswith="demo_").count() == 1 + 2 * (1 + 1 + 2 + 6)

        # Cross-school surface
        assert MarketplaceListing.objects.filter(title__startswith="[Demo]").count() == 5
        assert DemoRequest.objects.filter(email_address__endswith="@demo.skillship.test").count() == 3

    def test_seed_is_idempotent(self):
        _run_seed()
        first_user_count = User.objects.count()
        first_school_count = School.objects.count()
        first_listing_count = MarketplaceListing.objects.count()

        # Run it a second time — nothing should change.
        _run_seed()

        assert User.objects.count() == first_user_count
        assert School.objects.count() == first_school_count
        assert MarketplaceListing.objects.count() == first_listing_count

    def test_reset_wipes_only_demo_rows(self, school_a):
        # school_a is created by the conftest fixture, NOT by the seeder.
        # It must survive --reset.
        non_demo_school_id = school_a.id

        _run_seed()
        assert School.objects.count() == 3  # 2 demo + 1 non-demo (school_a)

        _run_seed("--reset")

        # Non-demo school survives the reset; the 2 demo schools are then re-seeded.
        assert School.objects.filter(id=non_demo_school_id).exists()
        assert School.objects.count() == 3  # 1 surviving non-demo + 2 re-seeded demo


@pytest.mark.django_db
class TestSeedDemoAnalyticsData:
    """Quiz attempts are the most fragile bit — they need realistic shape so
    the analytics dashboards render. Lock the contract."""

    def test_seeded_attempts_are_submitted_with_scores(self):
        from apps.quizzes.models import QuizAttempt

        _run_seed()

        attempts = QuizAttempt.objects.filter(status=QuizAttempt.Status.SUBMITTED)
        # 2 schools × 3 courses × 6 students = 36 max; we only seed for the
        # first quiz per course, so 2 × 3 × 6 = 36.
        assert attempts.count() >= 12, "Need enough attempts to drive dashboards."

        for a in attempts[:5]:
            assert a.score_percent is not None
            assert 0 < a.score_percent <= 100
            assert a.submitted_at is not None
            assert a.correct_count >= 0
            assert a.points_total > 0
