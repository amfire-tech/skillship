"""
File:    backend/apps/accounts/tests/test_onboarding.py
Purpose: Tests for POST /api/v1/users/onboard-class/ — the MAIN_ADMIN class
         onboarding flow (generate credentials + create students + enrol).
Owner:   Navanish

Covers: the happy path (accounts created, enrolled, school-stamped, and the
        generated credentials actually log in), the MAIN_ADMIN-only gate,
        cross-tenant class rejection, and idempotent re-runs by admission no.
"""

from __future__ import annotations

from datetime import date

import pytest
from rest_framework.test import APIClient

from apps.academics.models import AcademicYear, Class, Enrollment
from apps.accounts.models import User

URL = "/api/v1/users/onboard-class/"


def _make_class(school, *, grade=10, section="A"):
    year = AcademicYear.objects.create(
        school=school, name="2025-26",
        start_date=date(2025, 4, 1), end_date=date(2026, 3, 31), is_current=True,
    )
    return Class.objects.create(school=school, academic_year=year, grade=grade, section=section)


@pytest.mark.django_db
class TestOnboardClassPermissions:
    def _payload(self, school, klass):
        return {
            "school": str(school.id), "klass": str(klass.id),
            "students": [{"first_name": "Aarav", "last_name": "Sharma"}],
        }

    def test_anonymous_blocked(self, api_client, school_a):
        klass = _make_class(school_a)
        resp = api_client.post(URL, self._payload(school_a, klass), format="json")
        assert resp.status_code in (401, 403)

    def test_principal_blocked(self, api_client, login, principal_a, school_a):
        klass = _make_class(school_a)
        login(api_client, principal_a)
        resp = api_client.post(URL, self._payload(school_a, klass), format="json")
        assert resp.status_code == 403

    def test_teacher_blocked(self, api_client, login, teacher_a, school_a):
        klass = _make_class(school_a)
        login(api_client, teacher_a)
        resp = api_client.post(URL, self._payload(school_a, klass), format="json")
        assert resp.status_code == 403


@pytest.mark.django_db
class TestOnboardClassHappyPath:
    def test_creates_accounts_enrols_and_credentials_log_in(
        self, api_client, login, main_admin, school_a, password
    ):
        klass = _make_class(school_a)
        login(api_client, main_admin)

        resp = api_client.post(
            URL,
            {
                "school": str(school_a.id), "klass": str(klass.id),
                "students": [
                    {"first_name": "Aarav", "last_name": "Sharma", "admission_number": "23-1042"},
                    {"first_name": "Diya", "last_name": "Patel"},
                ],
            },
            format="json",
        )
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["created_count"] == 2
        assert body["error_count"] == 0

        # Both accounts exist in school_a as STUDENTs and are enrolled.
        students = User.objects.filter(school=school_a, role=User.Role.STUDENT)
        assert students.count() == 2
        for s in students:
            assert Enrollment.objects.filter(school=school_a, student=s, klass=klass).exists()
            # login + email are namespaced under the school slug.
            assert s.email.endswith("@dps-a.skillship.in")
            assert s.username.startswith("dps-a.")

        # The generated credentials must actually authenticate.
        first = body["students"][0]
        fresh = APIClient()
        out = fresh.post(
            "/api/v1/auth/login/",
            {"email": first["email"], "password": first["password"]},
            format="json",
        )
        assert out.status_code == 200, out.content
        assert out.json()["user"]["role"] == "STUDENT"

    def test_class_must_belong_to_school(
        self, api_client, login, main_admin, school_a, school_b
    ):
        # Class in school_b, but school=school_a → rejected, no accounts made.
        klass_b = _make_class(school_b)
        login(api_client, main_admin)
        resp = api_client.post(
            URL,
            {
                "school": str(school_a.id), "klass": str(klass_b.id),
                "students": [{"first_name": "Aarav"}],
            },
            format="json",
        )
        assert resp.status_code == 400
        assert User.objects.filter(role=User.Role.STUDENT).count() == 0

    def test_same_roll_in_two_sections_gets_distinct_logins(
        self, api_client, login, main_admin, school_a
    ):
        """Roll 01 in 10-A and roll 01 in 10-B are different students and must
        each get their own account + a unique, section-namespaced email."""
        year = AcademicYear.objects.create(
            school=school_a, name="2025-26",
            start_date=date(2025, 4, 1), end_date=date(2026, 3, 31), is_current=True,
        )
        class_a = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A")
        class_b = Class.objects.create(school=school_a, academic_year=year, grade=10, section="B")
        login(api_client, main_admin)

        def onboard(klass):
            return api_client.post(
                URL,
                {
                    "school": str(school_a.id), "klass": str(klass.id),
                    "students": [{"first_name": "Aarav", "admission_number": "01"}],
                },
                format="json",
            ).json()

        a = onboard(class_a)
        b = onboard(class_b)

        assert a["created_count"] == 1
        assert b["created_count"] == 1  # NOT merged into the section-A student
        # Two distinct accounts, two distinct emails carrying the section.
        assert User.objects.filter(school=school_a, role=User.Role.STUDENT).count() == 2
        email_a = a["students"][0]["email"]
        email_b = b["students"][0]["email"]
        assert email_a != email_b
        assert email_a == "10a01@dps-a.skillship.in"
        assert email_b == "10b01@dps-a.skillship.in"

    def test_idempotent_by_admission_number(
        self, api_client, login, main_admin, school_a
    ):
        klass = _make_class(school_a)
        login(api_client, main_admin)
        payload = {
            "school": str(school_a.id), "klass": str(klass.id),
            "students": [{"first_name": "Aarav", "admission_number": "23-1042"}],
        }
        first = api_client.post(URL, payload, format="json")
        assert first.status_code == 200
        assert first.json()["created_count"] == 1

        # Re-running the same roster must NOT create a duplicate account.
        second = api_client.post(URL, payload, format="json")
        assert second.status_code == 200
        body = second.json()
        assert body["created_count"] == 0
        assert body["existing_count"] == 1
        assert User.objects.filter(school=school_a, role=User.Role.STUDENT).count() == 1
