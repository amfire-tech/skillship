"""
File:    backend/apps/quizzes/tests/test_assignments.py
Purpose: QuizAssignment endpoint — create, list, delete, tenant + role gates,
         student-via-class visibility, DB constraints.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest
from django.db import IntegrityError, transaction

from apps.academics.models import AcademicYear, Class, Enrollment
from apps.quizzes.models import Quiz, QuizAssignment
from apps.quizzes.tests.conftest import _make_bank, _make_mcq, _make_course


URL = "/api/v1/quizzes/assignments/"


def _make_class(school, teacher, *, grade=10, section="A"):
    today = datetime.date.today()
    year = AcademicYear.objects.create(
        school=school, name=f"Y-{grade}-{section}",
        start_date=today - datetime.timedelta(days=60),
        end_date=today + datetime.timedelta(days=60),
    )
    return Class.objects.create(school=school, academic_year=year, grade=grade, section=section, class_teacher=teacher)


def _make_published_quiz(school, teacher):
    course = _make_course(school, code="MATH-X")
    bank = _make_bank(school, course, teacher)
    for i in range(2):
        _make_mcq(school, bank, teacher, f"Q{i+1}")
    return Quiz.objects.create(
        school=school, course=course, bank=bank, created_by=teacher,
        title="Assigned Quiz", status=Quiz.Status.PUBLISHED,
        total_questions=2, duration_minutes=10,
    )


@pytest.mark.django_db
class TestAssignmentCreate:
    def test_anonymous_blocked(self, api_client, school_a, teacher_a):
        quiz = _make_published_quiz(school_a, teacher_a)
        r = api_client.post(URL, {"quiz": str(quiz.id), "student": "00000000-0000-0000-0000-000000000000"}, format="json")
        assert r.status_code == 401

    def test_student_cannot_create(self, api_client, login, school_a, teacher_a, student_a):
        quiz = _make_published_quiz(school_a, teacher_a)
        login(api_client, student_a)
        r = api_client.post(URL, {"quiz": str(quiz.id), "student": str(student_a.id)}, format="json")
        assert r.status_code == 400  # ValidationError "Only staff can assign quizzes."

    def test_teacher_assigns_to_student(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        login(api_client, teacher_a)
        r = api_client.post(URL, {"quiz": str(quiz.id), "student": str(student_a.id)}, format="json")
        assert r.status_code == 201, r.content
        body = r.json()
        assert body["assigned_by"] == str(teacher_a.id)
        assert body["student_name"] is not None

    def test_teacher_assigns_to_class(
        self, api_client, login, school_a, teacher_a
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        klass = _make_class(school_a, teacher_a)
        login(api_client, teacher_a)
        r = api_client.post(URL, {"quiz": str(quiz.id), "klass": str(klass.id)}, format="json")
        assert r.status_code == 201, r.content
        assert r.json()["class_label"] == "Grade 10-A"

    def test_must_provide_exactly_one_target(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        klass = _make_class(school_a, teacher_a)
        login(api_client, teacher_a)
        # Both provided → 400
        r = api_client.post(URL, {"quiz": str(quiz.id), "student": str(student_a.id), "klass": str(klass.id)}, format="json")
        assert r.status_code == 400
        # Neither provided → 400
        r = api_client.post(URL, {"quiz": str(quiz.id)}, format="json")
        assert r.status_code == 400

    def test_draft_quiz_cannot_be_assigned(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        course = _make_course(school_a, code="DR-1")
        bank = _make_bank(school_a, course, teacher_a)
        _make_mcq(school_a, bank, teacher_a, "Q1")
        draft = Quiz.objects.create(
            school=school_a, course=course, bank=bank,
            title="Draft", status=Quiz.Status.DRAFT, total_questions=1,
        )
        login(api_client, teacher_a)
        r = api_client.post(URL, {"quiz": str(draft.id), "student": str(student_a.id)}, format="json")
        assert r.status_code == 400
        assert "PUBLISHED" in str(r.content)

    def test_cross_tenant_target_rejected(
        self, api_client, login, school_a, teacher_a, student_b
    ):
        """Teacher A cannot assign their quiz to a student in school B."""
        quiz = _make_published_quiz(school_a, teacher_a)
        login(api_client, teacher_a)
        r = api_client.post(URL, {"quiz": str(quiz.id), "student": str(student_b.id)}, format="json")
        assert r.status_code == 400


@pytest.mark.django_db
class TestAssignmentVisibility:
    def test_student_sees_only_their_assignments(
        self, api_client, login, school_a, teacher_a, student_a, student_b
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        # Assign to student_a only.
        QuizAssignment.objects.create(
            school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
        )
        login(api_client, student_a)
        ids = {a["id"] for a in api_client.get(URL).json()["results"]}
        assert len(ids) == 1

        api_client.credentials()
        login(api_client, student_b)
        body = api_client.get(URL).json()
        assert body["count"] == 0

    def test_student_sees_class_assignment_via_enrollment(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        """If a class assignment exists and the student is enrolled in the class, they should see it."""
        quiz = _make_published_quiz(school_a, teacher_a)
        klass = _make_class(school_a, teacher_a)
        Enrollment.objects.create(school=school_a, student=student_a, klass=klass)
        QuizAssignment.objects.create(
            school=school_a, quiz=quiz, klass=klass, assigned_by=teacher_a,
        )
        login(api_client, student_a)
        body = api_client.get(URL).json()
        assert body["count"] == 1

    def test_principal_b_does_not_see_school_a_assignments(
        self, api_client, login, school_a, teacher_a, student_a, principal_b
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        QuizAssignment.objects.create(
            school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
        )
        login(api_client, principal_b)
        body = api_client.get(URL).json()
        assert body["count"] == 0


@pytest.mark.django_db
class TestAssignmentDelete:
    def test_teacher_can_revoke(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        a = QuizAssignment.objects.create(
            school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
        )
        login(api_client, teacher_a)
        r = api_client.delete(f"{URL}{a.id}/")
        assert r.status_code == 204
        assert not QuizAssignment.objects.filter(id=a.id).exists()

    def test_student_cannot_delete(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        quiz = _make_published_quiz(school_a, teacher_a)
        a = QuizAssignment.objects.create(
            school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
        )
        login(api_client, student_a)
        r = api_client.delete(f"{URL}{a.id}/")
        assert r.status_code in (400, 403, 405)
        assert QuizAssignment.objects.filter(id=a.id).exists()


@pytest.mark.django_db
class TestAssignmentDbConstraints:
    def test_check_constraint_blocks_both_null(self, school_a, teacher_a):
        quiz = _make_published_quiz(school_a, teacher_a)
        with pytest.raises(IntegrityError), transaction.atomic():
            QuizAssignment.objects.create(
                school=school_a, quiz=quiz, assigned_by=teacher_a,
            )

    def test_unique_per_student(self, school_a, teacher_a, student_a):
        quiz = _make_published_quiz(school_a, teacher_a)
        QuizAssignment.objects.create(
            school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
        )
        with pytest.raises(IntegrityError), transaction.atomic():
            QuizAssignment.objects.create(
                school=school_a, quiz=quiz, student=student_a, assigned_by=teacher_a,
            )
