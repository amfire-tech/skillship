"""
File:    backend/apps/accounts/tests/test_users_crud.py
Purpose: End-to-end tests for the /api/v1/users/ surface — list / retrieve /
         create / update / delete / set-password — across the full role and
         tenant matrix.
Owner:   Prashant

Why this is its own file:
    test_isolation.py asserts the *invariant* (no school sees another's data).
    test_login.py asserts the *auth contract*. This file asserts the
    *user-management surface* — the matrix of "who may do what to whom".

Policy (2026-05-28 lockdown — see apps/accounts/permissions.py):
    ONLY MAIN_ADMIN may touch /api/v1/users/. Principals, sub-admins, teachers,
    and students are blocked at the surface (403) on EVERY action — they never
    reach the queryset or object layer. MAIN_ADMIN may act on any user in any
    school, subject to the role/school invariant.
"""

from __future__ import annotations

import pytest

from apps.accounts.models import User

LIST_URL = "/api/v1/users/"


def _detail_url(user: User) -> str:
    return f"{LIST_URL}{user.id}/"


def _set_password_url(user: User) -> str:
    return f"{LIST_URL}{user.id}/set-password/"


# ── LIST + RETRIEVE — MAIN_ADMIN sees everything ────────────────────────────


@pytest.mark.django_db
class TestListAndRetrieve:
    def test_main_admin_lists_every_user_across_schools(
        self,
        api_client,
        main_admin,
        password,
        login,
        principal_a,
        teacher_a,
        student_a,
        principal_b,
        student_b,
    ):
        login(api_client, main_admin, password)
        response = api_client.get(LIST_URL)
        assert response.status_code == 200

        results = response.data["results"] if "results" in response.data else response.data
        ids = {item["id"] for item in results}
        assert str(principal_a.id) in ids
        assert str(teacher_a.id) in ids
        assert str(student_a.id) in ids
        assert str(principal_b.id) in ids
        assert str(student_b.id) in ids
        assert str(main_admin.id) in ids

    def test_main_admin_can_retrieve_any_user(
        self, api_client, main_admin, password, login, student_b
    ):
        login(api_client, main_admin, password)
        response = api_client.get(_detail_url(student_b))
        assert response.status_code == 200
        assert response.data["id"] == str(student_b.id)

    def test_main_admin_can_filter_by_role_and_school(
        self, api_client, main_admin, password, login, school_a, student_a, teacher_a, student_b
    ):
        """The User Management screen filters server-side: ?role= and ?school=."""
        login(api_client, main_admin, password)
        response = api_client.get(f"{LIST_URL}?role=STUDENT&school={school_a.id}")
        assert response.status_code == 200
        results = response.data["results"] if "results" in response.data else response.data
        ids = {item["id"] for item in results}
        assert str(student_a.id) in ids       # STUDENT in school_a
        assert str(teacher_a.id) not in ids   # filtered out by role
        assert str(student_b.id) not in ids   # filtered out by school


# ── Surface is closed to every non-admin role, on every action ──────────────


@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture", ["principal_a", "teacher_a", "student_a"])
class TestSurfaceClosedToNonAdmins:
    """Only MAIN_ADMIN may use /users/. Everyone else is blocked at the surface
    (403) before any view logic runs — list, retrieve, create, update, delete,
    and the set-password action alike."""

    def test_list_is_403(self, request, api_client, password, login, user_fixture):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.get(LIST_URL).status_code == 403

    def test_retrieve_is_403(
        self, request, api_client, password, login, user_fixture, principal_a
    ):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.get(_detail_url(principal_a)).status_code == 403

    def test_create_is_403(self, request, api_client, password, login, user_fixture):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "ghost@nowhere.test",
                "username": "ghost",
                "role": "STUDENT",
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 403

    def test_update_is_403(
        self, request, api_client, password, login, user_fixture, teacher_a
    ):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        response = api_client.patch(
            _detail_url(teacher_a), {"first_name": "Hijacked"}, format="json"
        )
        assert response.status_code == 403
        teacher_a.refresh_from_db()
        assert teacher_a.first_name != "Hijacked"

    def test_delete_is_403(
        self, request, api_client, password, login, user_fixture, teacher_a
    ):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        assert api_client.delete(_detail_url(teacher_a)).status_code == 403
        assert User.objects.filter(pk=teacher_a.id).exists()

    def test_set_password_is_403(
        self, request, api_client, password, login, user_fixture, teacher_a
    ):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        response = api_client.post(
            _set_password_url(teacher_a), {"password": "Skillship#Reset-2026"}, format="json"
        )
        assert response.status_code == 403


@pytest.mark.django_db
class TestAnonymous:
    def test_list_is_401(self, api_client, db):
        assert api_client.get(LIST_URL).status_code == 401

    def test_retrieve_is_401(self, api_client, db, principal_a):
        assert api_client.get(_detail_url(principal_a)).status_code == 401


# ── CREATE — role/school invariant + role-based gating (MAIN_ADMIN) ──────────


@pytest.mark.django_db
class TestCreateAsMainAdmin:
    def test_creates_a_principal_in_school(
        self, api_client, main_admin, password, login, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "new.principal@school-a.test",
                "username": "new_principal",
                "first_name": "New",
                "last_name": "Principal",
                "role": "PRINCIPAL",
                "school": str(school_a.id),
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 201, response.content
        assert response.data["role"] == "PRINCIPAL"
        assert response.data["school"] == str(school_a.id)
        # password must never appear in the read response
        assert "password" not in response.data
        created = User.objects.get(email="new.principal@school-a.test")
        assert created.check_password("Skillship#Test-2026")

    def test_creates_main_admin_with_null_school(
        self, api_client, main_admin, password, login
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "second.admin@skillship.test",
                "username": "second_admin",
                "role": "MAIN_ADMIN",
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 201, response.content
        assert response.data["school"] is None

    def test_main_admin_with_school_returns_400(
        self, api_client, main_admin, password, login, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "bad.admin@skillship.test",
                "username": "bad_admin",
                "role": "MAIN_ADMIN",
                "school": str(school_a.id),
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "school" in response.data

    def test_non_admin_without_school_returns_400(
        self, api_client, main_admin, password, login
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "orphan@nowhere.test",
                "username": "orphan",
                "role": "TEACHER",
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "school" in response.data

    def test_weak_password_returns_400(
        self, api_client, main_admin, password, login, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": "weak@school-a.test",
                "username": "weak",
                "role": "STUDENT",
                "school": str(school_a.id),
                "password": "123",  # too short, common, all-numeric
            },
            format="json",
        )
        assert response.status_code == 400
        assert "password" in response.data

    def test_duplicate_email_returns_400(
        self, api_client, main_admin, password, login, principal_a, school_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            LIST_URL,
            {
                "email": principal_a.email,
                "username": "another_one",
                "role": "TEACHER",
                "school": str(school_a.id),
                "password": "Skillship#Test-2026",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "email" in response.data


# ── UPDATE — only safe fields (MAIN_ADMIN) ──────────────────────────────────


@pytest.mark.django_db
class TestUpdate:
    def test_main_admin_can_patch_any_user(
        self, api_client, main_admin, password, login, student_b
    ):
        login(api_client, main_admin, password)
        response = api_client.patch(
            _detail_url(student_b),
            {"first_name": "Renamed"},
            format="json",
        )
        assert response.status_code == 200
        student_b.refresh_from_db()
        assert student_b.first_name == "Renamed"

    def test_role_change_is_rejected_silently(
        self, api_client, main_admin, password, login, student_a
    ):
        """`role` is read_only on UpdateSerializer — the request succeeds, but
        the role value is ignored. This prevents a privilege-escalation footgun
        where a typo in a PATCH promotes a student to principal."""
        login(api_client, main_admin, password)
        response = api_client.patch(
            _detail_url(student_a),
            {"role": "PRINCIPAL", "first_name": "Stays a student"},
            format="json",
        )
        assert response.status_code == 200
        student_a.refresh_from_db()
        assert student_a.role == "STUDENT"
        assert student_a.first_name == "Stays a student"

    def test_school_change_is_rejected_silently(
        self, api_client, main_admin, password, login, student_a, school_b
    ):
        login(api_client, main_admin, password)
        response = api_client.patch(
            _detail_url(student_a),
            {"school": str(school_b.id), "first_name": "Stays in A"},
            format="json",
        )
        assert response.status_code == 200
        student_a.refresh_from_db()
        assert student_a.school_id != school_b.id


# ── DESTROY (MAIN_ADMIN) ────────────────────────────────────────────────────


@pytest.mark.django_db
class TestDestroy:
    def test_main_admin_can_delete_any_user(
        self, api_client, main_admin, password, login, student_b
    ):
        login(api_client, main_admin, password)
        response = api_client.delete(_detail_url(student_b))
        assert response.status_code == 204
        assert not User.objects.filter(pk=student_b.id).exists()


# ── /set-password/ custom action (MAIN_ADMIN) ───────────────────────────────


@pytest.mark.django_db
class TestSetPassword:
    NEW_PW = "Skillship#Reset-2026"

    def test_main_admin_resets_any_password(
        self, api_client, main_admin, password, login, student_b
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            _set_password_url(student_b), {"password": self.NEW_PW}, format="json"
        )
        assert response.status_code == 204
        student_b.refresh_from_db()
        assert student_b.check_password(self.NEW_PW)

    def test_weak_password_returns_400(
        self, api_client, main_admin, password, login, student_a
    ):
        login(api_client, main_admin, password)
        response = api_client.post(
            _set_password_url(student_a), {"password": "123"}, format="json"
        )
        assert response.status_code == 400
        assert "password" in response.data
