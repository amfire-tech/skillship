"""
File:    backend/apps/exam_alerts/tests/test_exam_alerts.py
Purpose: Tests for /api/v1/exam-alerts/ — teacher creates an exam for a class,
         enrolled students see it, tenant isolation + role gates hold.
Owner:   Navanish
"""

from __future__ import annotations

from datetime import date

import pytest

from apps.academics.models import AcademicYear, Class, Enrollment

URL = "/api/v1/exam-alerts/"


def _year(school):
    return AcademicYear.objects.create(
        school=school, name="2025-26",
        start_date=date(2025, 6, 1), end_date=date(2026, 5, 31), is_current=True,
    )


def _klass(school, year, grade=9, section="A"):
    return Class.objects.create(school=school, academic_year=year, grade=grade, section=section)


def _payload(klass):
    return {
        "title": "Mid-Term Science Exam",
        "category": "SEMESTER",
        "mode": "PHYSICAL",
        "exam_date": "2026-07-15",
        "klass": str(klass.id),
        "venue": "Room 204",
        "description": "Chapters 1-6.",
    }


@pytest.mark.django_db
class TestExamAlerts:
    def test_teacher_creates_student_in_class_sees(
        self, api_client, login, teacher_a, student_a, school_a
    ):
        year = _year(school_a)
        klass = _klass(school_a, year)
        Enrollment.objects.create(school=school_a, student=student_a, klass=klass, course=None)

        login(api_client, teacher_a)
        created = api_client.post(URL, _payload(klass), format="json")
        assert created.status_code == 201, created.content
        assert created.json()["class_name"] == "Grade 9-A"

        # The enrolled student sees it.
        api_client.credentials()
        login(api_client, student_a)
        rows = api_client.get(URL).json()["results"]
        assert [r["title"] for r in rows] == ["Mid-Term Science Exam"]
        assert rows[0]["category_display"] == "Semester Exam"

    def test_student_in_other_class_does_not_see(
        self, api_client, login, teacher_a, student_a, school_a, password
    ):
        from apps.accounts.models import User

        year = _year(school_a)
        klass_9 = _klass(school_a, year, 9, "A")
        klass_10 = _klass(school_a, year, 10, "B")
        # student_a is in 9-A; a second student sits in 10-B.
        Enrollment.objects.create(school=school_a, student=student_a, klass=klass_9, course=None)
        other = User.objects.create_user(
            username="s10b", email="s10b@dps-a.test", password=password,
            role=User.Role.STUDENT, school=school_a,
        )
        Enrollment.objects.create(school=school_a, student=other, klass=klass_10, course=None)

        login(api_client, teacher_a)
        assert api_client.post(URL, _payload(klass_9), format="json").status_code == 201

        api_client.credentials()
        login(api_client, other)
        assert api_client.get(URL).json()["results"] == []  # alert is for 9-A, not 10-B

    def test_tenant_isolation(self, api_client, login, teacher_a, school_a, student_b):
        year = _year(school_a)
        klass = _klass(school_a, year)
        login(api_client, teacher_a)
        assert api_client.post(URL, _payload(klass), format="json").status_code == 201

        # A student in a different school sees nothing.
        api_client.credentials()
        login(api_client, student_b)
        assert api_client.get(URL).json()["results"] == []

    def test_student_cannot_create(self, api_client, login, student_a, school_a):
        year = _year(school_a)
        klass = _klass(school_a, year)
        login(api_client, student_a)
        assert api_client.post(URL, _payload(klass), format="json").status_code == 403

    def test_cross_school_class_rejected(
        self, api_client, login, teacher_a, school_b
    ):
        # A teacher in school_a may not attach an alert to a class in school_b.
        year_b = _year(school_b)
        klass_b = _klass(school_b, year_b)
        login(api_client, teacher_a)
        resp = api_client.post(URL, _payload(klass_b), format="json")
        assert resp.status_code == 400
