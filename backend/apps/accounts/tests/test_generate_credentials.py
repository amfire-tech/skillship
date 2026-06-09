"""
File:    backend/apps/accounts/tests/test_generate_credentials.py
Purpose: Tests for POST /api/v1/users/generate-credentials/ — MAIN_ADMIN bulk
         mints N blank STUDENT logins (no names yet) for a school.
Owner:   Navanish

Covers: the MAIN_ADMIN-only gate, the happy path (blank accounts created,
        school-stamped, profile_completed=False, unique emails that actually
        log in), and the count bounds.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

URL = "/api/v1/users/generate-credentials/"


@pytest.mark.django_db
class TestGenerateCredentialsPermissions:
    def test_anonymous_blocked(self, api_client, school_a):
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 3}, format="json")
        assert resp.status_code in (401, 403)

    def test_principal_blocked(self, api_client, login, principal_a, school_a):
        login(api_client, principal_a)
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 3}, format="json")
        assert resp.status_code == 403
        assert User.objects.filter(role=User.Role.STUDENT).count() == 0

    def test_teacher_blocked(self, api_client, login, teacher_a, school_a):
        login(api_client, teacher_a)
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 3}, format="json")
        assert resp.status_code == 403


@pytest.mark.django_db
class TestGenerateCredentialsHappyPath:
    def test_mints_blank_accounts_that_log_in(self, api_client, login, main_admin, school_a):
        login(api_client, main_admin)
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 5}, format="json")
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["generated_count"] == 5
        assert body["error_count"] == 0
        assert body["school_name"] == school_a.name

        students = User.objects.filter(school=school_a, role=User.Role.STUDENT)
        assert students.count() == 5
        for s in students:
            assert s.profile_completed is False  # must complete profile on first login
            assert s.first_name == ""             # no name yet
            assert s.email.endswith("@dps-a.skillship.in")
            assert s.username.startswith("dps-a.")

        # Emails are unique.
        emails = [row["email"] for row in body["students"]]
        assert len(set(emails)) == 5

        # A generated credential actually authenticates.
        first = body["students"][0]
        fresh = APIClient()
        out = fresh.post(
            "/api/v1/auth/login/",
            {"email": first["email"], "password": first["password"]},
            format="json",
        )
        assert out.status_code == 200, out.content
        assert out.json()["user"]["role"] == "STUDENT"
        assert out.json()["user"]["profile_completed"] is False

    def test_two_batches_are_unique_across_the_school(self, api_client, login, main_admin, school_a):
        """Generating a second batch must never reuse a login from the first —
        all credentials under one school are unique, batch after batch."""
        login(api_client, main_admin)
        b1 = api_client.post(URL, {"school": str(school_a.id), "count": 10}, format="json").json()
        b2 = api_client.post(URL, {"school": str(school_a.id), "count": 10}, format="json").json()

        emails = [s["email"] for s in b1["students"]] + [s["email"] for s in b2["students"]]
        usernames = [s["username"] for s in b1["students"]] + [s["username"] for s in b2["students"]]
        assert len(set(emails)) == 20      # no overlap between the two batches
        assert len(set(usernames)) == 20
        assert User.objects.filter(school=school_a, role=User.Role.STUDENT).count() == 20

    def test_count_below_minimum_rejected(self, api_client, login, main_admin, school_a):
        login(api_client, main_admin)
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 0}, format="json")
        assert resp.status_code == 400
        assert User.objects.filter(role=User.Role.STUDENT).count() == 0

    def test_count_above_maximum_rejected(self, api_client, login, main_admin, school_a):
        login(api_client, main_admin)
        resp = api_client.post(URL, {"school": str(school_a.id), "count": 501}, format="json")
        assert resp.status_code == 400
        assert User.objects.filter(role=User.Role.STUDENT).count() == 0
