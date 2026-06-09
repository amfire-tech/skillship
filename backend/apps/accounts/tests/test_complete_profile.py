"""
File:    backend/apps/accounts/tests/test_complete_profile.py
Purpose: Tests for POST /api/v1/auth/complete-profile/ — the student's one-time,
         first-login profile setup that then locks.
Owner:   Navanish

Covers: a student completing once (name/roll set, class + enrolment created,
        profile_completed flips True), the one-time lock (second attempt 403),
        the school being read from the account (never the body), and the
        student-only / authenticated gates.
"""

from __future__ import annotations

import pytest

from apps.academics.models import Class, Enrollment
from apps.accounts.models import User

URL = "/api/v1/auth/complete-profile/"


def _payload(**overrides):
    base = {
        "first_name": "Aarav",
        "last_name": "Sharma",
        "admission_number": "23",
        "grade": 6,
        "section": "a",
    }
    base.update(overrides)
    return base


@pytest.mark.django_db
class TestCompleteProfile:
    def test_anonymous_blocked(self, api_client):
        resp = api_client.post(URL, _payload(), format="json")
        assert resp.status_code in (401, 403)

    def test_non_student_rejected(self, api_client, login, principal_a):
        login(api_client, principal_a)
        resp = api_client.post(URL, _payload(), format="json")
        assert resp.status_code == 403

    def test_student_completes_once(self, api_client, login, student_a, school_a):
        login(api_client, student_a)
        resp = api_client.post(URL, _payload(), format="json")
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["profile_completed"] is True
        assert body["first_name"] == "Aarav"

        student_a.refresh_from_db()
        assert student_a.profile_completed is True
        assert student_a.first_name == "Aarav"
        assert student_a.admission_number == "23"

        # Class created in the student's own school, section upper-cased, enrolled.
        klass = Class.objects.get(school=school_a, grade=6, section="A")
        assert Enrollment.objects.filter(school=school_a, student=student_a, klass=klass).exists()

    def test_second_attempt_rejected(self, api_client, login, student_a):
        login(api_client, student_a)
        first = api_client.post(URL, _payload(), format="json")
        assert first.status_code == 200

        # Locked — the student can never change it again.
        second = api_client.post(URL, _payload(first_name="Hacker"), format="json")
        assert second.status_code == 403
        student_a.refresh_from_db()
        assert student_a.first_name == "Aarav"

    def test_school_comes_from_account_not_body(
        self, api_client, login, student_a, school_a, school_b
    ):
        """A student passing another school's id must not escape their tenant —
        the enrolment lands in their OWN school regardless of the body."""
        login(api_client, student_a)
        resp = api_client.post(URL, _payload(school=str(school_b.id)), format="json")
        assert resp.status_code == 200, resp.content

        assert Enrollment.objects.filter(school=school_a, student=student_a).exists()
        assert not Enrollment.objects.filter(school=school_b).exists()
        assert not Class.objects.filter(school=school_b).exists()

    def test_missing_required_field_rejected(self, api_client, login, student_a):
        login(api_client, student_a)
        resp = api_client.post(URL, _payload(admission_number=""), format="json")
        assert resp.status_code == 400
        student_a.refresh_from_db()
        assert student_a.profile_completed is False
