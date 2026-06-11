"""
File:    backend/apps/accounts/tests/test_student_roster.py
Purpose: Tests for GET /api/v1/users/roster/ — the role-scoped student roster
         (teacher → own assigned students, principal → own school, admin → all).
Owner:   Navanish
"""

from __future__ import annotations

import pytest

from apps.accounts.models import User

URL = "/api/v1/users/roster/"


def _ids(resp):
    body = resp.json()
    rows = body["results"] if isinstance(body, dict) and "results" in body else body
    return {r["id"] for r in rows}


@pytest.mark.django_db
class TestStudentRoster:
    def test_anonymous_401(self, api_client, student_a):
        assert api_client.get(URL).status_code == 401

    def test_student_role_forbidden(self, api_client, login, student_a):
        login(api_client, student_a)
        assert api_client.get(URL).status_code == 403

    def test_teacher_sees_only_assigned(
        self, api_client, login, teacher_a, student_a, school_a, student_b
    ):
        # student_a assigned to teacher_a; a second school_a student left unassigned.
        student_a.assigned_teacher = teacher_a
        student_a.save(update_fields=["assigned_teacher"])
        other = User.objects.create_user(
            username="unassigned_a", email="un_a@dps-a.test", password="x",
            role=User.Role.STUDENT, school=school_a,
        )
        login(api_client, teacher_a)
        ids = _ids(api_client.get(URL))
        assert str(student_a.id) in ids
        assert str(other.id) not in ids        # not assigned to this teacher
        assert str(student_b.id) not in ids    # other school entirely

    def test_principal_sees_own_school_only(
        self, api_client, login, principal_a, student_a, student_b
    ):
        login(api_client, principal_a)
        ids = _ids(api_client.get(URL))
        assert str(student_a.id) in ids
        assert str(student_b.id) not in ids

    def test_main_admin_filters_by_school_and_teacher(
        self, api_client, login, main_admin, teacher_a, student_a, school_a, student_b
    ):
        student_a.assigned_teacher = teacher_a
        student_a.save(update_fields=["assigned_teacher"])
        login(api_client, main_admin)

        by_school = _ids(api_client.get(f"{URL}?school={school_a.id}"))
        assert str(student_a.id) in by_school
        assert str(student_b.id) not in by_school

        by_teacher = _ids(api_client.get(f"{URL}?teacher={teacher_a.id}"))
        assert by_teacher == {str(student_a.id)}

    def test_roster_row_shape(self, api_client, login, teacher_a, student_a):
        student_a.assigned_teacher = teacher_a
        student_a.admission_number = "42"
        student_a.save(update_fields=["assigned_teacher", "admission_number"])
        login(api_client, teacher_a)
        body = api_client.get(URL).json()
        rows = body["results"] if "results" in body else body
        row = next(r for r in rows if r["id"] == str(student_a.id))
        assert row["roll_number"] == "42"
        assert row["assigned_teacher_name"]  # teacher's display name present
        # class fields are present (None until the student enrols)
        assert "grade" in row and "class_label" in row and "avg_score" in row
