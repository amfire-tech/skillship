"""
File:    backend/apps/assignments/tests/test_subadmin.py
Purpose: The roaming sub-admin model — grant-based school resolution, per-school
         capability gates (quiz approval, onboarding), tenant isolation, and the
         grant management API.
Owner:   Navanish
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIRequestFactory

from apps.accounts.models import User
from apps.assignments.models import SubAdminGrant
from apps.common.tenancy import resolve_school_id
from apps.quizzes.models import Quiz
from apps.quizzes.tests.conftest import _make_bank, _make_course, _make_mcq

HDR = "HTTP_X_SCHOOL_CONTEXT"  # the X-School-Context header, WSGI-encoded


@pytest.fixture
def sub_admin(db, password) -> User:
    """A roaming sub-admin: no home school, reaches schools only via grants."""
    return User.objects.create_user(
        username="sub_admin",
        email="sub@skillship.test",
        password=password,
        first_name="Sub",
        last_name="Admin",
        role=User.Role.SUB_ADMIN,
        school=None,
    )


def _grant(sub, school, *, manage=False, students=False, teachers=False,
           quizzes=False, is_active=True) -> SubAdminGrant:
    return SubAdminGrant.objects.create(
        subadmin=sub, school=school, is_active=is_active,
        can_manage_school=manage, can_onboard_students=students,
        can_onboard_teachers=teachers, can_approve_quizzes=quizzes,
    )


def _review_quiz(school, teacher) -> Quiz:
    course = _make_course(school)
    bank = _make_bank(school, course, teacher)
    for i in range(3):
        _make_mcq(school, bank, teacher, f"Q{i}")
    return Quiz.objects.create(
        school=school, course=course, bank=bank, created_by=teacher,
        title="Pending", status=Quiz.Status.REVIEW, total_questions=3,
    )


# ── Resolver: one school per request, only when actively granted ──────────────


@pytest.mark.django_db
class TestResolver:
    def _req(self, user, school_id=None):
        rf = APIRequestFactory()
        extra = {HDR: str(school_id)} if school_id else {}
        req = rf.get("/", **extra)
        req.user = user
        return req

    def test_active_grant_header_resolves(self, sub_admin, school_a):
        _grant(sub_admin, school_a, manage=True)
        assert resolve_school_id(self._req(sub_admin, school_a.id)) == str(school_a.id)

    def test_no_header_returns_none(self, sub_admin, school_a):
        _grant(sub_admin, school_a, manage=True)
        assert resolve_school_id(self._req(sub_admin)) is None

    def test_ungranted_school_blocked(self, sub_admin, school_a, school_b):
        _grant(sub_admin, school_a, manage=True)
        assert resolve_school_id(self._req(sub_admin, school_b.id)) is None

    def test_revoked_grant_blocked(self, sub_admin, school_a):
        _grant(sub_admin, school_a, manage=True, is_active=False)
        assert resolve_school_id(self._req(sub_admin, school_a.id)) is None


# ── Schools surface ───────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestSchoolsAccess:
    def test_lists_only_granted_schools(self, api_client, login, sub_admin, school_a, school_b):
        _grant(sub_admin, school_a, manage=True)
        login(api_client, sub_admin)
        r = api_client.get("/api/v1/schools/")
        assert r.status_code == 200, r.content
        ids = {row["id"] for row in r.json()["results"]}
        assert str(school_a.id) in ids
        assert str(school_b.id) not in ids

    def test_cannot_create_school(self, api_client, login, sub_admin, school_a):
        _grant(sub_admin, school_a, manage=True)
        login(api_client, sub_admin)
        r = api_client.post(
            "/api/v1/schools/",
            {"name": "New", "slug": "new", "board": "CBSE"},
            format="json",
        )
        assert r.status_code == 403


# ── Quiz approval (per-school capability) ─────────────────────────────────────


@pytest.mark.django_db
class TestQuizApproval:
    def test_with_grant_publishes(self, api_client, login, sub_admin, school_a, teacher_a):
        quiz = _review_quiz(school_a, teacher_a)
        _grant(sub_admin, school_a, quizzes=True)
        login(api_client, sub_admin)
        r = api_client.post(f"/api/v1/quizzes/{quiz.id}/publish/", **{HDR: str(school_a.id)})
        assert r.status_code == 200, r.content
        quiz.refresh_from_db()
        assert quiz.status == Quiz.Status.PUBLISHED
        # The approver + role snapshot are recorded so the super-admin can see
        # the quiz was approved by a sub-admin.
        assert quiz.published_by_id == sub_admin.id
        assert quiz.published_by_role == User.Role.SUB_ADMIN

    def test_without_quiz_cap_403(self, api_client, login, sub_admin, school_a, teacher_a):
        quiz = _review_quiz(school_a, teacher_a)
        _grant(sub_admin, school_a, students=True)  # granted, but not for quizzes
        login(api_client, sub_admin)
        r = api_client.post(f"/api/v1/quizzes/{quiz.id}/publish/", **{HDR: str(school_a.id)})
        assert r.status_code == 403
        quiz.refresh_from_db()
        assert quiz.status == Quiz.Status.REVIEW

    def test_principal_cannot_publish(self, api_client, login, principal_a, school_a, teacher_a):
        """Publishing is gated to MAIN_ADMIN/SUB_ADMIN — PRINCIPAL can submit-for-review, not approve."""
        quiz = _review_quiz(school_a, teacher_a)
        login(api_client, principal_a)
        r = api_client.post(f"/api/v1/quizzes/{quiz.id}/publish/")
        assert r.status_code == 403
        quiz.refresh_from_db()
        assert quiz.status == Quiz.Status.REVIEW


# ── Onboarding (per-school capability) ────────────────────────────────────────


@pytest.mark.django_db
class TestOnboarding:
    URL = "/api/v1/users/generate-credentials/"

    def test_requires_onboard_cap(self, api_client, login, sub_admin, school_a):
        _grant(sub_admin, school_a, manage=True)  # no student onboarding
        login(api_client, sub_admin)
        r = api_client.post(self.URL, {"count": 2}, format="json", **{HDR: str(school_a.id)})
        assert r.status_code == 403

    def test_with_cap_onboards_into_acting_school(self, api_client, login, sub_admin, school_a):
        _grant(sub_admin, school_a, students=True)
        login(api_client, sub_admin)
        r = api_client.post(self.URL, {"count": 2}, format="json", **{HDR: str(school_a.id)})
        assert r.status_code in (200, 207), r.content
        # The minted students landed in the acting school, not nowhere.
        assert User.objects.filter(role=User.Role.STUDENT, school_id=school_a.id).count() == 2

    def test_teacher_onboarding_needs_teacher_cap(self, api_client, login, sub_admin, school_a):
        # Student cap alone must not let them mint TEACHER logins.
        _grant(sub_admin, school_a, students=True)
        login(api_client, sub_admin)
        r = api_client.post(
            self.URL, {"count": 1, "role": "TEACHER"}, format="json", **{HDR: str(school_a.id)},
        )
        assert r.status_code == 403

    def test_teacher_onboarding_with_teacher_cap(self, api_client, login, sub_admin, school_a):
        _grant(sub_admin, school_a, teachers=True)
        login(api_client, sub_admin)
        r = api_client.post(
            self.URL, {"count": 2, "role": "TEACHER"}, format="json", **{HDR: str(school_a.id)},
        )
        assert r.status_code in (200, 207), r.content
        assert User.objects.filter(role=User.Role.TEACHER, school_id=school_a.id).count() == 2


# ── User-listing isolation ────────────────────────────────────────────────────


@pytest.mark.django_db
class TestUsersIsolation:
    def test_lists_only_granted_school_students(
        self, api_client, login, sub_admin, school_a, school_b, student_a, student_b
    ):
        _grant(sub_admin, school_a, students=True)
        login(api_client, sub_admin)
        r = api_client.get("/api/v1/users/?role=STUDENT", **{HDR: str(school_a.id)})
        assert r.status_code == 200, r.content
        ids = {row["id"] for row in r.json()["results"]}
        assert str(student_a.id) in ids
        assert str(student_b.id) not in ids

    def test_cannot_edit_accounts(self, api_client, login, sub_admin, school_a, student_a):
        _grant(sub_admin, school_a, students=True)
        login(api_client, sub_admin)
        r = api_client.patch(
            f"/api/v1/users/{student_a.id}/",
            {"first_name": "Hacked"}, format="json", **{HDR: str(school_a.id)},
        )
        assert r.status_code == 403


# ── Grant management API ──────────────────────────────────────────────────────


@pytest.mark.django_db
class TestGrantApi:
    URL = "/api/v1/assignments/subadmin-grants/"

    def test_main_admin_upserts(self, api_client, login, main_admin, sub_admin, school_a):
        login(api_client, main_admin)
        body = {
            "subadmin": str(sub_admin.id),
            "school": str(school_a.id),
            "can_approve_quizzes": True,
        }
        r = api_client.post(self.URL, body, format="json")
        assert r.status_code == 201, r.content

        # Re-POST the same pair updates capabilities instead of erroring.
        body["can_approve_quizzes"] = False
        body["can_onboard_students"] = True
        r2 = api_client.post(self.URL, body, format="json")
        assert r2.status_code == 200, r2.content
        g = SubAdminGrant.objects.get(subadmin=sub_admin, school=school_a)
        assert g.can_onboard_students is True
        assert g.can_approve_quizzes is False

    def test_my_access_returns_active_only(self, api_client, login, sub_admin, school_a, school_b):
        _grant(sub_admin, school_a, students=True)
        _grant(sub_admin, school_b, quizzes=True, is_active=False)  # revoked
        login(api_client, sub_admin)
        r = api_client.get(self.URL + "my-access/")
        assert r.status_code == 200, r.content
        schools = {row["school"] for row in r.json()}
        assert str(school_a.id) in schools
        assert str(school_b.id) not in schools

    def test_subadmin_cannot_write_grants(self, api_client, login, sub_admin, school_a):
        login(api_client, sub_admin)
        r = api_client.post(
            self.URL,
            {"subadmin": str(sub_admin.id), "school": str(school_a.id)},
            format="json",
        )
        assert r.status_code == 403
