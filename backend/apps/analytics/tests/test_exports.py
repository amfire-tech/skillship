"""
File:    backend/apps/analytics/tests/test_exports.py
Purpose: PDF / XLSX export endpoints — auth, tenant scope, response shape, file headers.
Owner:   Navanish
"""

from __future__ import annotations

import datetime
import io
import zipfile

import pytest
from django.utils import timezone

from apps.academics.models import AcademicYear, Class
from apps.analytics.models import ClassWeeklyStats, StudentDailyStats


def _seed(school_a, teacher_a, student_a):
    today = datetime.date.today()
    year = AcademicYear.objects.create(school=school_a, name="2025-26", start_date=today - datetime.timedelta(days=30), end_date=today + datetime.timedelta(days=30))
    klass = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A", class_teacher=teacher_a)
    for i in range(3):
        StudentDailyStats.objects.create(
            school=school_a, student=student_a,
            date=today - datetime.timedelta(days=i),
            quizzes_taken=i + 1, avg_score=70 + i * 5,
            time_spent_seconds=600 + i * 60,
        )
    ClassWeeklyStats.objects.create(
        school=school_a, klass=klass,
        week_start_date=today - datetime.timedelta(days=today.weekday() or 7),
        avg_score=78, at_risk_count=2,
    )
    return klass


@pytest.mark.django_db
class TestStudentReport:
    def test_pdf_export_returns_pdf_bytes(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, student_a)
        url = f"/api/v1/analytics/reports/student/{student_a.id}/export/?fmt=pdf"
        r = api_client.get(url)
        assert r.status_code == 200, r.content
        assert r["Content-Type"] == "application/pdf"
        assert r.content[:4] == b"%PDF"  # PDF magic bytes
        assert "attachment;" in r["Content-Disposition"]

    def test_xlsx_export_is_valid_zip(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, student_a)
        url = f"/api/v1/analytics/reports/student/{student_a.id}/export/?fmt=xlsx"
        r = api_client.get(url)
        assert r.status_code == 200
        # .xlsx is a zip — opening it confirms it's a real workbook, not garbage.
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            names = z.namelist()
            assert any("xl/worksheets/sheet1.xml" in n for n in names)

    def test_student_cannot_export_another_students_report(
        self, api_client, login, school_a, teacher_a, student_a, student_b
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, student_b)
        # student_b is in school_b — cross-tenant + cross-user → 404 (don't reveal existence).
        url = f"/api/v1/analytics/reports/student/{student_a.id}/export/?fmt=pdf"
        assert api_client.get(url).status_code == 404

    def test_principal_can_export_own_school_student(
        self, api_client, login, school_a, teacher_a, student_a, principal_a
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, principal_a)
        url = f"/api/v1/analytics/reports/student/{student_a.id}/export/?fmt=pdf"
        assert api_client.get(url).status_code == 200

    def test_invalid_format_rejected(self, api_client, login, student_a):
        login(api_client, student_a)
        r = api_client.get(f"/api/v1/analytics/reports/student/{student_a.id}/export/?fmt=csv")
        assert r.status_code == 400

    def test_invalid_date_range_rejected(self, api_client, login, student_a):
        login(api_client, student_a)
        url = f"/api/v1/analytics/reports/student/{student_a.id}/export/?from=2026-12-31&to=2026-01-01"
        assert api_client.get(url).status_code == 400


@pytest.mark.django_db
class TestClassAndSchoolReports:
    def test_class_pdf_happy_path(
        self, api_client, login, school_a, teacher_a, student_a, principal_a
    ):
        klass = _seed(school_a, teacher_a, student_a)
        login(api_client, principal_a)
        r = api_client.get(f"/api/v1/analytics/reports/class/{klass.id}/export/?fmt=pdf")
        assert r.status_code == 200
        assert r.content[:4] == b"%PDF"

    def test_student_blocked_from_class_export(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        klass = _seed(school_a, teacher_a, student_a)
        login(api_client, student_a)
        r = api_client.get(f"/api/v1/analytics/reports/class/{klass.id}/export/?fmt=pdf")
        assert r.status_code == 403

    def test_school_pdf_requires_principal_plus(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, teacher_a)
        r = api_client.get(f"/api/v1/analytics/reports/school/{school_a.id}/export/?fmt=pdf")
        assert r.status_code == 403

    def test_school_xlsx_principal_happy_path(
        self, api_client, login, school_a, teacher_a, student_a, principal_a
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, principal_a)
        r = api_client.get(f"/api/v1/analytics/reports/school/{school_a.id}/export/?fmt=xlsx")
        assert r.status_code == 200
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            assert any("xl/worksheets" in n for n in z.namelist())

    def test_cross_tenant_school_export_404(
        self, api_client, login, school_a, teacher_a, student_a, principal_b
    ):
        _seed(school_a, teacher_a, student_a)
        login(api_client, principal_b)
        r = api_client.get(f"/api/v1/analytics/reports/school/{school_a.id}/export/?fmt=pdf")
        assert r.status_code == 404
