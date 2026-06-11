"""
File:    backend/apps/accounts/tests/test_assign_teacher.py
Purpose: Tests for POST /api/v1/users/assign-teacher/ — MAIN_ADMIN bulk-assigns
         a teacher to students (same-school), or unassigns (teacher=null).
Owner:   Navanish
"""

from __future__ import annotations

import pytest

from apps.accounts.models import User

URL = "/api/v1/users/assign-teacher/"


@pytest.mark.django_db
class TestAssignTeacher:
    def test_anonymous_blocked(self, api_client, teacher_a, student_a):
        resp = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(student_a.id)]}, format="json"
        )
        assert resp.status_code in (401, 403)

    def test_principal_blocked(self, api_client, login, principal_a, teacher_a, student_a):
        login(api_client, principal_a)
        resp = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(student_a.id)]}, format="json"
        )
        assert resp.status_code == 403

    def test_main_admin_assigns(self, api_client, login, main_admin, teacher_a, student_a):
        login(api_client, main_admin)
        resp = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(student_a.id)]}, format="json"
        )
        assert resp.status_code == 200, resp.content
        assert resp.json()["updated_count"] == 1
        student_a.refresh_from_db()
        assert student_a.assigned_teacher_id == teacher_a.id

    def test_unassign_with_null(self, api_client, login, main_admin, teacher_a, student_a):
        student_a.assigned_teacher = teacher_a
        student_a.save(update_fields=["assigned_teacher"])
        login(api_client, main_admin)
        resp = api_client.post(URL, {"teacher": None, "students": [str(student_a.id)]}, format="json")
        assert resp.status_code == 200, resp.content
        student_a.refresh_from_db()
        assert student_a.assigned_teacher_id is None

    def test_cross_school_teacher_rejected(
        self, api_client, login, main_admin, teacher_a, school_b, student_b
    ):
        # teacher_a is in school_a; student_b is in school_b → must be rejected.
        login(api_client, main_admin)
        resp = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(student_b.id)]}, format="json"
        )
        assert resp.status_code == 400
        student_b.refresh_from_db()
        assert student_b.assigned_teacher_id is None

    def test_non_student_target_rejected(self, api_client, login, main_admin, teacher_a):
        # A teacher id in `students` isn't in the STUDENT queryset → 400.
        login(api_client, main_admin)
        resp = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(teacher_a.id)]}, format="json"
        )
        assert resp.status_code == 400

    def test_empty_students_rejected(self, api_client, login, main_admin, teacher_a):
        login(api_client, main_admin)
        resp = api_client.post(URL, {"teacher": str(teacher_a.id), "students": []}, format="json")
        assert resp.status_code == 400
