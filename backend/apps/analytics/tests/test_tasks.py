"""
File:    backend/apps/analytics/tests/test_tasks.py
Purpose: Verify the Phase 1 Celery wrappers — services math + fan-out per active school.
Owner:   Navanish

Celery is run in EAGER mode (default in dev settings — celery_app inherits CELERY_*).
We don't need a real broker for these tests — we just call the task fns directly
and patch the `.delay()` shims to assert fan-out cardinality.
"""

from __future__ import annotations

import datetime

import pytest
from django.utils import timezone

from apps.academics.models import AcademicYear, Class, Course, Enrollment
from apps.analytics import services, tasks
from apps.analytics.models import StudentDailyStats
from apps.quizzes.models import Quiz, QuizAttempt
from apps.quizzes.tests.conftest import _make_bank, _make_mcq
from apps.schools.models import School


@pytest.mark.django_db
class TestRebuildDailyStats:
    def test_aggregates_one_attempt_per_student(
        self, school_a, teacher_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        bank = _make_bank(school_a, course, teacher_a)
        for i in range(2):
            _make_mcq(school_a, bank, teacher_a, f"Q{i+1}")
        quiz = Quiz.objects.create(
            school=school_a, course=course, bank=bank, status=Quiz.Status.PUBLISHED,
            total_questions=2, duration_minutes=10,
        )
        when = timezone.now()
        QuizAttempt.objects.create(
            school=school_a, quiz=quiz, student=student_a,
            status=QuizAttempt.Status.SUBMITTED, attempt_number=1,
            expires_at=when, submitted_at=when, score_percent=80,
            points_earned=1, points_total=2, correct_count=1,
        )

        rows = services.rebuild_daily_stats(school_id=school_a.id, date=when.date())
        assert rows == 1
        stat = StudentDailyStats.objects.get(school=school_a, student=student_a, date=when.date())
        assert stat.quizzes_taken == 1
        assert float(stat.avg_score) == 80.0

    def test_idempotent_on_rerun(self, school_a, teacher_a, student_a):
        """Running the rebuild twice for the same day must not duplicate rows."""
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        bank = _make_bank(school_a, course, teacher_a)
        _make_mcq(school_a, bank, teacher_a, "Q1")
        quiz = Quiz.objects.create(
            school=school_a, course=course, bank=bank, status=Quiz.Status.PUBLISHED,
            total_questions=1, duration_minutes=10,
        )
        when = timezone.now()
        QuizAttempt.objects.create(
            school=school_a, quiz=quiz, student=student_a,
            status=QuizAttempt.Status.SUBMITTED, attempt_number=1,
            expires_at=when, submitted_at=when, score_percent=50,
            points_earned=0, points_total=1, correct_count=0,
        )

        services.rebuild_daily_stats(school_id=school_a.id, date=when.date())
        services.rebuild_daily_stats(school_id=school_a.id, date=when.date())
        assert StudentDailyStats.objects.filter(school=school_a, date=when.date()).count() == 1


@pytest.mark.django_db
class TestFanOut:
    def test_daily_fan_out_enqueues_one_per_active_school(
        self, school_a, school_b, monkeypatch
    ):
        inactive = School.objects.create(
            name="Gone", slug="gone", board=School.Board.CBSE,
            city="X", state="X", is_active=False,
        )
        enqueued: list[tuple[str, str]] = []

        def fake_delay(school_id, date_iso):
            enqueued.append((str(school_id), date_iso))

        monkeypatch.setattr(tasks.rebuild_daily_stats_for_school, "delay", fake_delay)
        count = tasks.fan_out_daily_rebuild()

        assert count == 2  # school_a + school_b; `inactive` is skipped.
        school_ids = {sid for sid, _ in enqueued}
        assert school_ids == {str(school_a.id), str(school_b.id)}
        assert str(inactive.id) not in school_ids

        # Date is *yesterday* (this is the contract — today's data is still mutable).
        yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        assert all(d == yesterday for _, d in enqueued)

    def test_weekly_fan_out_aligns_to_last_monday(
        self, school_a, monkeypatch
    ):
        enqueued: list[tuple[str, str]] = []

        def fake_delay(school_id, week_iso):
            enqueued.append((str(school_id), week_iso))

        monkeypatch.setattr(tasks.rebuild_weekly_stats_for_school, "delay", fake_delay)
        tasks.fan_out_weekly_rebuild()

        assert len(enqueued) == 1
        _, week_iso = enqueued[0]
        d = datetime.date.fromisoformat(week_iso)
        assert d.weekday() == 0  # Monday
        assert d <= datetime.date.today()


@pytest.mark.django_db
class TestPeriodicTasksSeeded:
    def test_migration_installed_both_schedules(self):
        """The 0002 migration must leave two enabled PeriodicTask rows."""
        from django_celery_beat.models import PeriodicTask

        names = set(
            PeriodicTask.objects.filter(enabled=True).values_list("task", flat=True)
        )
        assert "analytics.fan_out_daily_rebuild" in names
        assert "analytics.fan_out_weekly_rebuild" in names
