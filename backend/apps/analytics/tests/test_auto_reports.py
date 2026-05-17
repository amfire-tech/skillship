"""
File:    backend/apps/analytics/tests/test_auto_reports.py
Purpose: Auto-report Celery tasks — date math, fan-out, ContentItem creation.
Owner:   Navanish
"""

from __future__ import annotations

import datetime
import io
import zipfile
from unittest.mock import patch

import pytest

from apps.academics.models import Course
from apps.analytics import tasks
from apps.analytics.models import ClassWeeklyStats
from apps.academics.models import AcademicYear, Class
from apps.content.models import ContentItem


def _seed_school_with_data(school):
    """Make sure `assemble_school_report` returns at least one row for `school`."""
    Course.objects.get_or_create(school=school, code="GEN-1", defaults={"name": "Gen"})
    today = datetime.date.today()
    year = AcademicYear.objects.create(
        school=school, name=f"YR-{school.slug}",
        start_date=today - datetime.timedelta(days=60),
        end_date=today + datetime.timedelta(days=60),
    )
    klass = Class.objects.create(school=school, academic_year=year, grade=10, section="A")
    # Seed a week inside last calendar month so it lands in the monthly window.
    first_of_this_month = today.replace(day=1)
    inside_last_month = first_of_this_month - datetime.timedelta(days=15)
    ClassWeeklyStats.objects.create(
        school=school, klass=klass,
        week_start_date=inside_last_month - datetime.timedelta(days=inside_last_month.weekday() or 7),
        avg_score=82, at_risk_count=1,
    )


class TestDateWindows:
    def test_last_month_window_jan(self):
        s, e = tasks._last_month_window(datetime.date(2026, 2, 5))
        assert s == datetime.date(2026, 1, 1)
        assert e == datetime.date(2026, 1, 31)

    def test_last_month_window_jan_rolls_to_dec_prev_year(self):
        s, e = tasks._last_month_window(datetime.date(2026, 1, 10))
        assert s == datetime.date(2025, 12, 1)
        assert e == datetime.date(2025, 12, 31)

    def test_last_year_window(self):
        s, e = tasks._last_year_window(datetime.date(2026, 1, 1))
        assert s == datetime.date(2025, 1, 1)
        assert e == datetime.date(2025, 12, 31)


@pytest.mark.django_db
class TestGenerateSchoolReport:
    def _patch_storage(self):
        """Patch default_storage so the test doesn't touch the real filesystem."""
        from django.core.files.storage import default_storage

        return (
            patch.object(default_storage, "save", lambda path, content: path),
            patch.object(default_storage, "url", lambda path: f"/media/{path}"),
        )

    def test_creates_pdf_content_item(self, school_a):
        _seed_school_with_data(school_a)
        save_patch, url_patch = self._patch_storage()
        with save_patch, url_patch:
            new_id = tasks.generate_school_report(
                str(school_a.id), "2020-01-01", "2026-12-31", "Test Window",
            )
        assert new_id != ""
        item = ContentItem.objects.get(id=new_id)
        assert item.school == school_a
        assert item.kind == ContentItem.Kind.PDF
        assert item.title.startswith("[Auto Report] Test Window")
        assert "auto-reports/" in item.file_url

    def test_skipped_when_no_data(self, school_a):
        # No ClassWeeklyStats → assemble_school_report has empty rows → task returns ""
        save_patch, url_patch = self._patch_storage()
        with save_patch, url_patch:
            result = tasks.generate_school_report(
                str(school_a.id), "2099-01-01", "2099-12-31", "Future Window",
            )
        assert result == ""
        assert not ContentItem.objects.filter(school=school_a).exists()

    def test_skipped_when_no_course(self, school_a):
        # Seed stats but no Course → task returns "" (cannot attach ContentItem).
        today = datetime.date.today()
        year = AcademicYear.objects.create(
            school=school_a, name="YR",
            start_date=today - datetime.timedelta(days=60),
            end_date=today + datetime.timedelta(days=60),
        )
        klass = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A")
        ClassWeeklyStats.objects.create(
            school=school_a, klass=klass,
            week_start_date=today - datetime.timedelta(days=today.weekday() or 7),
            avg_score=70, at_risk_count=0,
        )
        save_patch, url_patch = self._patch_storage()
        with save_patch, url_patch:
            result = tasks.generate_school_report(
                str(school_a.id), "2020-01-01", "2099-12-31", "X",
            )
        assert result == ""


@pytest.mark.django_db
class TestFanOut:
    def test_monthly_fan_out_enqueues_per_active_school(
        self, school_a, school_b, monkeypatch
    ):
        enqueued: list[tuple[str, str, str, str]] = []

        def fake_delay(school_id, start_iso, end_iso, label):
            enqueued.append((str(school_id), start_iso, end_iso, label))

        monkeypatch.setattr(tasks.generate_school_report, "delay", fake_delay)
        count = tasks.fan_out_monthly_reports()
        assert count == 2
        labels = {row[3] for row in enqueued}
        assert all("Monthly Progress" in label for label in labels)

    def test_yearly_fan_out(self, school_a, monkeypatch):
        enqueued = []

        def fake_delay(school_id, start_iso, end_iso, label):
            enqueued.append((school_id, start_iso, end_iso, label))

        monkeypatch.setattr(tasks.generate_school_report, "delay", fake_delay)
        tasks.fan_out_yearly_reports()
        assert len(enqueued) == 1
        _, start_iso, end_iso, label = enqueued[0]
        assert "Yearly Progress" in label
        # Window should be Jan 1 → Dec 31 of last year.
        s = datetime.date.fromisoformat(start_iso)
        e = datetime.date.fromisoformat(end_iso)
        assert s.month == 1 and s.day == 1
        assert e.month == 12 and e.day == 31


@pytest.mark.django_db
class TestPeriodicTasksSeeded:
    def test_migration_installed_monthly_and_yearly(self):
        from django_celery_beat.models import PeriodicTask

        names = set(
            PeriodicTask.objects.filter(enabled=True).values_list("task", flat=True)
        )
        assert "analytics.fan_out_monthly_reports" in names
        assert "analytics.fan_out_yearly_reports" in names
