"""
File:    backend/apps/quizzes/tests/test_multi_class.py
Purpose: One quiz targeting several classes — authoring normalises the class
         label, and students see the quiz only if their grade is in it.
Owner:   Navanish
"""

from __future__ import annotations

import pytest

from apps.academics.models import Enrollment
from apps.accounts.models import User
from apps.quizzes.models import Quiz
from apps.quizzes.tests.test_assignments import _make_class, _make_published_quiz

AUTHORING_URL = "/api/v1/quizzes/authoring/"
LIST_URL = "/api/v1/quizzes/"


def _payload(grade: str) -> dict:
    return {
        "title": "Sensors across grades",
        "subject": "Robotics",
        "grade": grade,
        "questions": [{
            "text": "What does a light sensor detect?",
            "options": ["Heat", "Brightness", "Sound", "Distance"],
            "correct_answer_index": 1,
        }],
    }


@pytest.mark.django_db
class TestMultiClassAuthoring:
    def test_label_is_deduped_and_ordered(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        r = api_client.post(AUTHORING_URL, _payload("Class 7, class 6,Class 7"), format="json")
        assert r.status_code == 201, r.content
        quiz = Quiz.objects.get(title="Sensors across grades")
        assert quiz.grade == "Class 6, Class 7"
        assert (quiz.course.grade_min, quiz.course.grade_max) == (6, 7)

    def test_all_twelve_classes_fit(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        every = ", ".join(f"Class {n}" for n in range(1, 13))
        r = api_client.post(AUTHORING_URL, _payload(every), format="json")
        assert r.status_code == 201, r.content
        assert Quiz.objects.get(title="Sensors across grades").grade == every

    def test_out_of_range_class_rejected(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        r = api_client.post(AUTHORING_URL, _payload("Class 6, Class 13"), format="json")
        assert r.status_code == 400
        assert "grade" in r.json()


@pytest.mark.django_db
class TestMultiClassVisibility:
    def _student_in_grade(self, school, teacher, password, grade: int) -> User:
        student = User.objects.create_user(
            username=f"student_g{grade}", email=f"g{grade}@dps-a.test", password=password,
            role=User.Role.STUDENT, school=school,
        )
        klass = _make_class(school, teacher, grade=grade)
        Enrollment.objects.create(school=school, student=student, klass=klass)
        return student

    def test_only_listed_grades_see_quiz(self, api_client, login, school_a, teacher_a, password):
        quiz = _make_published_quiz(school_a, teacher_a)
        quiz.grade = "Class 6, Class 7, Class 8"
        quiz.save(update_fields=["grade"])

        for grade, expected in [(6, True), (7, True), (8, True), (9, False), (1, False)]:
            student = self._student_in_grade(school_a, teacher_a, password, grade)
            api_client.credentials()
            login(api_client, student)
            ids = [q["id"] for q in api_client.get(LIST_URL).json()["results"]]
            assert (str(quiz.id) in ids) is expected, f"grade {grade}"
