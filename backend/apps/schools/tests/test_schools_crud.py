"""
File:    backend/apps/schools/tests/test_schools_crud.py
Purpose: End-to-end tests for /api/v1/schools/ (CRUD) and /api/v1/schools/settings/
         (singleton per-school config row).
Owner:   Prashant

Why these tests, not just the isolation canary in test_isolation.py:
    test_isolation.py guarantees School A's *user data* never leaks into
    School B's queries. This file guarantees the *administrative surface*
    around schools themselves is locked down — only MAIN_ADMIN can manage
    schools; only PRINCIPAL (or MAIN_ADMIN) can change their own settings;
    everyone else gets 403; anonymous gets 401.

    A regression here means a TEACHER could rename a school, or a STUDENT
    could read every school's address book. Both are platform-level
    breakages and would never recover from.
"""

from __future__ import annotations

import uuid

import pytest
from rest_framework.test import APIClient

from apps.schools.models import School, SchoolSettings

LIST_URL = "/api/v1/schools/"
SETTINGS_URL = "/api/v1/schools/settings/"


def _detail_url(school: School) -> str:
    return f"{LIST_URL}{school.id}/"


# ── /schools/ — MAIN_ADMIN can CRUD; everyone else 403; anon 401 ────────────


@pytest.mark.django_db
class TestSchoolsCrudAsMainAdmin:
    def test_list_returns_all_schools(self, api_client, main_admin, password, login, school_a, school_b):
        login(api_client, main_admin, password)
        response = api_client.get(LIST_URL)
        assert response.status_code == 200

        # paginated response: results live under "results"
        results = response.data["results"] if "results" in response.data else response.data
        ids = {item["id"] for item in results}
        assert str(school_a.id) in ids
        assert str(school_b.id) in ids

    def test_create_school_with_explicit_slug(self, api_client, main_admin, password, login):
        login(api_client, main_admin, password)
        payload = {
            "name": "Test Academy",
            "slug": "test-academy",
            "board": "CBSE",
            "city": "Bangalore",
            "state": "Karnataka",
        }
        response = api_client.post(LIST_URL, payload, format="json")
        assert response.status_code == 201, response.content
        assert response.data["slug"] == "test-academy"
        assert response.data["plan"] == "CORE"  # default
        assert response.data["is_active"] is True
        assert School.objects.filter(slug="test-academy").exists()

    def test_create_school_auto_derives_slug_from_name(self, api_client, main_admin, password, login):
        login(api_client, main_admin, password)
        payload = {"name": "Sunrise Public School", "board": "ICSE"}
        response = api_client.post(LIST_URL, payload, format="json")
        assert response.status_code == 201, response.content
        assert response.data["slug"] == "sunrise-public-school"

    def test_create_with_duplicate_slug_returns_400_not_500(
        self, api_client, main_admin, password, login, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {"name": "Other", "slug": school_a.slug, "board": "CBSE"},
            format="json",
        )
        assert response.status_code == 400
        assert "slug" in response.data

    def test_retrieve_school(self, api_client, main_admin, password, login, school_a):
        login(api_client, main_admin, password)
        response = api_client.get(_detail_url(school_a))
        assert response.status_code == 200
        assert response.data["id"] == str(school_a.id)

    def test_partial_update_school(self, api_client, main_admin, password, login, school_a):
        login(api_client, main_admin, password)
        response = api_client.patch(
            _detail_url(school_a), {"city": "Gurgaon"}, format="json"
        )
        assert response.status_code == 200
        school_a.refresh_from_db()
        assert school_a.city == "Gurgaon"

    def test_destroy_school(self, api_client, main_admin, password, login, school_a):
        login(api_client, main_admin, password)
        response = api_client.delete(_detail_url(school_a))
        assert response.status_code == 204
        assert not School.objects.filter(pk=school_a.id).exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "user_fixture",
    ["principal_a", "teacher_a", "student_a"],
)
class TestSchoolsCrudIsForbiddenForNonAdmins:
    """A teacher / student / principal must not see the platform schools surface."""

    def test_list_is_403(self, request, api_client, password, login, user_fixture, school_a):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.get(LIST_URL).status_code == 403

    def test_create_is_403(self, request, api_client, password, login, user_fixture, school_a):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        response = api_client.post(
            LIST_URL,
            {"name": "Stealth", "slug": "stealth", "board": "CBSE"},
            format="json",
        )
        assert response.status_code == 403
        assert not School.objects.filter(slug="stealth").exists()

    def test_retrieve_is_403(self, request, api_client, password, login, user_fixture, school_a):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.get(_detail_url(school_a)).status_code == 403

    def test_destroy_is_403(self, request, api_client, password, login, user_fixture, school_a):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.delete(_detail_url(school_a)).status_code == 403
        assert School.objects.filter(pk=school_a.id).exists()


@pytest.mark.django_db
class TestSchoolsAnonymous:
    def test_list_is_401(self, api_client, db, school_a):
        assert api_client.get(LIST_URL).status_code == 401

    def test_retrieve_is_401(self, api_client, db, school_a):
        assert api_client.get(_detail_url(school_a)).status_code == 401


# ── /schools/settings/ — singleton, scoped by caller ────────────────────────


@pytest.mark.django_db
class TestSchoolSettings:
    def test_principal_can_read_own_settings_autocreated_on_first_hit(
        self, api_client, principal_a, password, login, school_a
    ):
        login(api_client, principal_a, password)
        assert not SchoolSettings.objects.filter(school=school_a).exists()

        response = api_client.get(SETTINGS_URL)
        assert response.status_code == 200
        assert response.data["school"] == str(school_a.id)
        assert response.data["ai_enabled"] is True  # model default
        assert SchoolSettings.objects.filter(school=school_a).exists()

    def test_principal_can_patch_own_settings(
        self, api_client, principal_a, password, login, school_a
    ):
        login(api_client, principal_a, password)
        response = api_client.patch(
            SETTINGS_URL,
            {"ai_enabled": False, "branding": {"primary_color": "#001E62"}},
            format="json",
        )
        assert response.status_code == 200
        assert response.data["ai_enabled"] is False
        assert response.data["branding"]["primary_color"] == "#001E62"

    def test_teacher_cannot_patch_settings(
        self, api_client, teacher_a, password, login
    ):
        login(api_client, teacher_a, password)
        response = api_client.patch(SETTINGS_URL, {"ai_enabled": False}, format="json")
        assert response.status_code == 403

    def test_student_cannot_patch_settings(
        self, api_client, student_a, password, login
    ):
        login(api_client, student_a, password)
        response = api_client.patch(SETTINGS_URL, {"ai_enabled": False}, format="json")
        assert response.status_code == 403

    def test_principal_a_cannot_read_school_b_settings_even_via_query_param(
        self, api_client, principal_a, password, login, school_b
    ):
        """A principal's settings GET is *derived from their own school* — the
        ?school= query param is honoured only for MAIN_ADMIN. Even if a
        principal_a tries `?school=<school_b.id>`, they still see THEIR own."""
        login(api_client, principal_a, password)
        response = api_client.get(f"{SETTINGS_URL}?school={school_b.id}")
        assert response.status_code == 200
        assert response.data["school"] != str(school_b.id)

    def test_main_admin_must_specify_school_to_read_settings(
        self, api_client, main_admin, password, login
    ):
        login(api_client, main_admin, password)
        response = api_client.get(SETTINGS_URL)
        assert response.status_code == 403

    def test_main_admin_can_read_any_school_settings_with_query_param(
        self, api_client, main_admin, password, login, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.get(f"{SETTINGS_URL}?school={school_a.id}")
        assert response.status_code == 200
        assert response.data["school"] == str(school_a.id)

    def test_main_admin_with_unknown_school_id_is_404(
        self, api_client, main_admin, password, login
    ):
        login(api_client, main_admin, password)
        response = api_client.get(f"{SETTINGS_URL}?school={uuid.uuid4()}")
        assert response.status_code == 404

    def test_anonymous_is_401(self, api_client, db):
        assert api_client.get(SETTINGS_URL).status_code == 401
