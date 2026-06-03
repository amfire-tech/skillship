"""
File:    backend/apps/analytics/tests/test_skills.py
Purpose: Skill-wise analytics endpoints — math, tenant scope, role gates.
Owner:   Navanish
"""

from __future__ import annotations

import datetime

import pytest
from django.utils import timezone

from apps.academics.models import AcademicYear, Class, Course, Enrollment
from apps.quizzes.models import Answer, Question, QuestionBank, Quiz, QuizAttempt


def _build_attempt_with_answers(school, course, teacher, student, *, tagged_results):
    """Seed one submitted attempt with answers carrying skill tags.

    tagged_results = list[(tags: list[str], is_correct: bool, points_awarded: int, time_sec: int)]
    """
    bank = QuestionBank.objects.create(
        school=school, course=course, created_by=teacher,
        name="Bank", description="",
    )
    quiz = Quiz.objects.create(
        school=school, course=course, bank=bank,
        title="T", status=Quiz.Status.PUBLISHED,
        total_questions=len(tagged_results), duration_minutes=10,
    )
    now = timezone.now()
    attempt = QuizAttempt.objects.create(
        school=school, quiz=quiz, student=student,
        status=QuizAttempt.Status.SUBMITTED, attempt_number=1,
        expires_at=now, submitted_at=now,
        score_percent=80, points_earned=0, points_total=0, correct_count=0,
    )
    for i, (tags, correct, points, secs) in enumerate(tagged_results):
        q = Question.objects.create(
            school=school, bank=bank, created_by=teacher,
            text=f"Q{i}", type=Question.Type.MCQ,
            options=[{"id": "a", "text": "A"}], correct_option_ids=["a"],
            points=2, tags=tags,
        )
        Answer.objects.create(
            school=school, attempt=attempt, question=q,
            is_correct=correct, points_awarded=points, time_spent_seconds=secs,
        )
    return attempt


@pytest.mark.django_db
class TestStudentSkillBreakdown:
    URL = "/api/v1/analytics/dashboards/student/skills/"

    def test_anonymous_blocked(self, api_client):
        assert api_client.get(self.URL).status_code == 401

    def test_aggregates_per_tag(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        _build_attempt_with_answers(
            school_a, course, teacher_a, student_a,
            tagged_results=[
                (["algebra"],     True,  2, 30),
                (["algebra"],     False, 0, 60),
                (["geometry"],    True,  2, 20),
                (["algebra", "geometry"], True, 2, 40),
            ],
        )
        login(api_client, student_a)
        body = api_client.get(self.URL).json()
        skills = {row["tag"]: row for row in body["skills"]}
        # algebra: 3 attempts, 2 correct → 66.67%
        assert skills["algebra"]["attempts"] == 3
        assert skills["algebra"]["correct"] == 2
        assert skills["algebra"]["accuracy_pct"] == pytest.approx(66.67, abs=0.01)
        # geometry: 2 attempts, 2 correct → 100%
        assert skills["geometry"]["attempts"] == 2
        assert skills["geometry"]["accuracy_pct"] == 100.0
        # Strongest first ordering — geometry (100%) before algebra (66.67%)
        assert body["skills"][0]["tag"] == "geometry"

    def test_untagged_questions_bucket(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        _build_attempt_with_answers(
            school_a, course, teacher_a, student_a,
            tagged_results=[
                ([],          True,  2, 15),  # untagged
                (["physics"], False, 0, 45),
            ],
        )
        login(api_client, student_a)
        skills = {r["tag"]: r for r in api_client.get(self.URL).json()["skills"]}
        assert "_untagged" in skills
        assert skills["_untagged"]["attempts"] == 1
        assert skills["_untagged"]["correct"] == 1

    def test_in_progress_attempts_excluded(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        bank = QuestionBank.objects.create(
            school=school_a, course=course, created_by=teacher_a, name="B",
        )
        q = Question.objects.create(
            school=school_a, bank=bank, text="Q", type=Question.Type.MCQ,
            options=[{"id": "a", "text": "A"}], correct_option_ids=["a"],
            points=1, tags=["algebra"],
        )
        quiz = Quiz.objects.create(
            school=school_a, course=course, bank=bank, title="T",
            status=Quiz.Status.PUBLISHED, total_questions=1, duration_minutes=10,
        )
        now = timezone.now()
        attempt = QuizAttempt.objects.create(
            school=school_a, quiz=quiz, student=student_a,
            status=QuizAttempt.Status.IN_PROGRESS, attempt_number=1, expires_at=now,
        )
        Answer.objects.create(
            school=school_a, attempt=attempt, question=q,
            is_correct=True, points_awarded=1, time_spent_seconds=10,
        )
        login(api_client, student_a)
        body = api_client.get(self.URL).json()
        assert body["skills"] == []

    def test_student_cannot_query_another_students_breakdown(
        self, api_client, login, school_a, teacher_a, student_a, student_b
    ):
        login(api_client, student_b)
        r = api_client.get(f"{self.URL}?student_id={student_a.id}")
        # Different school + different user → 404 (don't reveal existence).
        assert r.status_code == 404

    def test_teacher_can_query_student_in_same_school(
        self, api_client, login, school_a, teacher_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        _build_attempt_with_answers(
            school_a, course, teacher_a, student_a,
            tagged_results=[(["algebra"], True, 2, 30)],
        )
        login(api_client, teacher_a)
        r = api_client.get(f"{self.URL}?student_id={student_a.id}")
        assert r.status_code == 200
        assert len(r.json()["skills"]) == 1


@pytest.mark.django_db
class TestClassSkillBreakdown:
    def test_student_blocked(self, api_client, login, school_a, student_a):
        # Need a Class to even probe the endpoint.
        year = AcademicYear.objects.create(
            school=school_a, name="Y",
            start_date=datetime.date.today(), end_date=datetime.date.today() + datetime.timedelta(days=30),
        )
        klass = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A")
        login(api_client, student_a)
        r = api_client.get(f"/api/v1/analytics/dashboards/class/{klass.id}/skills/")
        assert r.status_code == 403

    def test_class_aggregates_across_enrolled_students(
        self, api_client, login, school_a, teacher_a, principal_a, student_a
    ):
        course = Course.objects.create(school=school_a, name="M", code="M-1")
        year = AcademicYear.objects.create(
            school=school_a, name="Y",
            start_date=datetime.date.today() - datetime.timedelta(days=30),
            end_date=datetime.date.today() + datetime.timedelta(days=30),
        )
        klass = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A")
        Enrollment.objects.create(school=school_a, student=student_a, klass=klass)

        _build_attempt_with_answers(
            school_a, course, teacher_a, student_a,
            tagged_results=[
                (["algebra"], True,  2, 30),
                (["algebra"], True,  2, 40),
            ],
        )
        login(api_client, principal_a)
        body = api_client.get(f"/api/v1/analytics/dashboards/class/{klass.id}/skills/").json()
        assert len(body["skills"]) == 1
        assert body["skills"][0]["tag"] == "algebra"
        assert body["skills"][0]["attempts"] == 2
        assert body["skills"][0]["accuracy_pct"] == 100.0

    def test_cross_tenant_class_404(
        self, api_client, login, school_a, principal_b
    ):
        year = AcademicYear.objects.create(
            school=school_a, name="Y",
            start_date=datetime.date.today(), end_date=datetime.date.today() + datetime.timedelta(days=30),
        )
        klass = Class.objects.create(school=school_a, academic_year=year, grade=10, section="A")
        login(api_client, principal_b)
        r = api_client.get(f"/api/v1/analytics/dashboards/class/{klass.id}/skills/")
        assert r.status_code == 404
