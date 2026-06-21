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
        body = resp.json()
        assert body["assigned_count"] == 1
        assert body["already_assigned"] == 0
        student_a.refresh_from_db()
        assert student_a.assigned_teacher_id == teacher_a.id

    def test_reassigning_same_student_is_idempotent(
        self, api_client, login, main_admin, teacher_a, student_a
    ):
        """Selecting an already-assigned student again (with a duplicate id, even)
        must not error and must not double-assign — it's reported as
        already_assigned and skipped."""
        login(api_client, main_admin)
        first = api_client.post(
            URL, {"teacher": str(teacher_a.id), "students": [str(student_a.id)]}, format="json"
        )
        assert first.json()["assigned_count"] == 1
        # Re-submit the SAME student twice in one payload.
        again = api_client.post(
            URL,
            {"teacher": str(teacher_a.id), "students": [str(student_a.id), str(student_a.id)]},
            format="json",
        )
        assert again.status_code == 200, again.content
        body = again.json()
        assert body["requested"] == 1          # duplicate id de-duped
        assert body["assigned_count"] == 0     # nothing new written
        assert body["already_assigned"] == 1   # skipped, no error

    def test_mixed_new_and_already_assigned(
        self, api_client, login, main_admin, teacher_a, student_a, school_a, password
    ):
        """One already-assigned + one new student → only the new one is written."""
        student_a.assigned_teacher = teacher_a
        student_a.save(update_fields=["assigned_teacher"])
        new_student = User.objects.create_user(
            username="new_stud", email="new_stud@x.test", password=password,
            first_name="New", last_name="Stud", role=User.Role.STUDENT, school=school_a,
        )
        login(api_client, main_admin)
        resp = api_client.post(
            URL,
            {"teacher": str(teacher_a.id), "students": [str(student_a.id), str(new_student.id)]},
            format="json",
        )
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["requested"] == 2
        assert body["assigned_count"] == 1      # only the new one
        assert body["already_assigned"] == 1
        new_student.refresh_from_db()
        assert new_student.assigned_teacher_id == teacher_a.id

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


STATS = "/api/v1/users/student-stats/"
USERS = "/api/v1/users/"


@pytest.mark.django_db
class TestStudentStatsAndFilters:
    def _make_students(self, school, password, *, activated, generated, teacher=None):
        from apps.accounts.models import User as U
        for i in range(activated):
            U.objects.create_user(
                username=f"act{i}@{school.slug}", email=f"act{i}@{school.slug}.test",
                password=password, role=U.Role.STUDENT, school=school,
                profile_completed=True, assigned_teacher=teacher,
            )
        for i in range(generated):
            U.objects.create_user(
                username=f"gen{i}@{school.slug}", email=f"gen{i}@{school.slug}.test",
                password=password, role=U.Role.STUDENT, school=school,
                profile_completed=False,
            )

    def test_stats_counts_generated_vs_activated(
        self, api_client, login, main_admin, school_a, teacher_a, password
    ):
        self._make_students(school_a, password, activated=3, generated=5, teacher=teacher_a)
        login(api_client, main_admin)
        resp = api_client.get(STATS, {"school": str(school_a.id)})
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["total"] == 8
        assert body["activated"] == 3
        assert body["generated"] == 5
        assert body["assigned"] == 3        # the 3 activated were assigned
        assert body["unassigned"] == 5

    def test_activation_filter_narrows_list(
        self, api_client, login, main_admin, school_a, password
    ):
        self._make_students(school_a, password, activated=2, generated=4)
        login(api_client, main_admin)
        gen = api_client.get(USERS, {"role": "STUDENT", "school": str(school_a.id), "activation": "generated", "page_size": 100})
        assert gen.status_code == 200
        assert gen.json()["count"] == 4
        act = api_client.get(USERS, {"role": "STUDENT", "school": str(school_a.id), "activation": "activated", "page_size": 100})
        assert act.json()["count"] == 2

    def test_stats_is_main_admin_only(self, api_client, login, principal_a):
        login(api_client, principal_a)
        assert api_client.get(STATS).status_code == 403


STUDENT_IDS = "/api/v1/users/student-ids/"


@pytest.mark.django_db
class TestStudentIds:
    def test_returns_all_matching_ids_unpaginated(
        self, api_client, login, main_admin, school_a, password
    ):
        from apps.accounts.models import User as U
        made = [
            U.objects.create_user(
                username=f"gen{i}@{school_a.slug}", email=f"gen{i}@{school_a.slug}.test",
                password=password, role=U.Role.STUDENT, school=school_a, profile_completed=False,
            ).id for i in range(120)  # > one page (PAGE_SIZE 50)
        ]
        login(api_client, main_admin)
        resp = api_client.get(STUDENT_IDS, {"school": str(school_a.id), "activation": "generated"})
        assert resp.status_code == 200, resp.content
        body = resp.json()
        assert body["count"] == 120
        assert set(body["ids"]) == {str(i) for i in made}

    def test_ids_respect_activation_filter(
        self, api_client, login, main_admin, school_a, password
    ):
        from apps.accounts.models import User as U
        U.objects.create_user(
            username="a@x", email="a@x.test", password=password,
            role=U.Role.STUDENT, school=school_a, profile_completed=True,
        )
        gen = U.objects.create_user(
            username="g@x", email="g@x.test", password=password,
            role=U.Role.STUDENT, school=school_a, profile_completed=False,
        )
        login(api_client, main_admin)
        resp = api_client.get(STUDENT_IDS, {"school": str(school_a.id), "activation": "generated"})
        assert resp.json()["ids"] == [str(gen.id)]

    def test_ids_main_admin_only(self, api_client, login, principal_a):
        login(api_client, principal_a)
        assert api_client.get(STUDENT_IDS).status_code == 403
