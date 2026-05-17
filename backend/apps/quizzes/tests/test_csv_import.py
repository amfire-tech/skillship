"""
File:    backend/apps/quizzes/tests/test_csv_import.py
Purpose: CSV bulk question import — happy path, validation errors, per-row reporting, role + tenant gates.
Owner:   Navanish
"""

from __future__ import annotations

import io

import pytest

from apps.quizzes.models import Question, QuestionBank
from apps.quizzes.tests.conftest import _make_bank, _make_course


GOOD_CSV = """text,type,difficulty,points,option_a,option_b,option_c,option_d,correct,accepted_answers,tags,explanation
"What is 2+2?",MCQ,EASY,1,3,4,5,6,B,,math|arithmetic,Basic addition
"Earth is flat?",TRUE_FALSE,EASY,1,,,,,False,,geography,"It's a sphere"
"Capital of India?",SHORT_ANSWER,MEDIUM,2,,,,,,delhi|new delhi,geography,
"""


def _upload(api_client, url, csv_text):
    f = io.BytesIO(csv_text.encode("utf-8"))
    f.name = "questions.csv"
    return api_client.post(url, {"file": f}, format="multipart")


@pytest.mark.django_db
class TestCsvImportHappyPath:
    def test_three_question_types_imported(
        self, api_client, login, school_a, teacher_a
    ):
        course = _make_course(school_a, code="CSV-1")
        bank = _make_bank(school_a, course, teacher_a)
        login(api_client, teacher_a)
        url = f"/api/v1/quizzes/banks/{bank.id}/import-csv/"
        r = _upload(api_client, url, GOOD_CSV)
        assert r.status_code == 200, r.content
        body = r.json()
        assert body["total_rows"] == 3
        assert body["created"] == 3
        assert body["errors"] == []

        # Verify the rows are tenant-stamped and look right.
        qs = Question.objects.filter(bank=bank)
        assert qs.count() == 3
        mcq = qs.filter(type="MCQ").first()
        assert mcq.options == [
            {"id": "a", "text": "3"}, {"id": "b", "text": "4"},
            {"id": "c", "text": "5"}, {"id": "d", "text": "6"},
        ]
        assert mcq.correct_option_ids == ["b"]
        tf = qs.filter(type="TRUE_FALSE").first()
        assert tf.correct_option_ids == ["false"]
        sa = qs.filter(type="SHORT_ANSWER").first()
        assert sa.accepted_answers == ["delhi", "new delhi"]
        assert sa.points == 2


@pytest.mark.django_db
class TestCsvImportPerRowErrors:
    def test_partial_success_reports_row_errors(
        self, api_client, login, school_a, teacher_a
    ):
        course = _make_course(school_a, code="CSV-2")
        bank = _make_bank(school_a, course, teacher_a)
        bad_csv = (
            "text,type,difficulty,points,option_a,option_b,option_c,option_d,correct,accepted_answers,tags,explanation\n"
            '"Good MCQ",MCQ,EASY,1,A1,B1,,,A,,,\n'           # row 2 — fine
            '"Bad type",FOO,EASY,1,,,,,,,,\n'                # row 3 — bad type
            '"Bad correct letter",MCQ,EASY,1,A1,B1,,,Z,,,\n' # row 4 — invalid letter
            '"Empty short",SHORT_ANSWER,EASY,1,,,,,,,,\n'    # row 5 — no accepted_answers
        )
        login(api_client, teacher_a)
        url = f"/api/v1/quizzes/banks/{bank.id}/import-csv/"
        r = _upload(api_client, url, bad_csv)
        assert r.status_code == 200
        body = r.json()
        assert body["total_rows"] == 4
        assert body["created"] == 1
        assert {e["row"] for e in body["errors"]} == {3, 4, 5}

    def test_missing_required_column_aborts(
        self, api_client, login, school_a, teacher_a
    ):
        course = _make_course(school_a, code="CSV-3")
        bank = _make_bank(school_a, course, teacher_a)
        login(api_client, teacher_a)
        url = f"/api/v1/quizzes/banks/{bank.id}/import-csv/"
        r = _upload(api_client, url, "text,type,difficulty\nx,MCQ,EASY\n")
        body = r.json()
        assert body["created"] == 0
        assert "Missing required columns: points" in body["errors"][0]["message"]


@pytest.mark.django_db
class TestCsvImportTenantIsolation:
    def test_teacher_b_cannot_import_into_school_a_bank(
        self, api_client, login, school_a, teacher_a, principal_b
    ):
        course = _make_course(school_a, code="CSV-X")
        bank = _make_bank(school_a, course, teacher_a)
        login(api_client, principal_b)
        url = f"/api/v1/quizzes/banks/{bank.id}/import-csv/"
        r = _upload(api_client, url, GOOD_CSV)
        # Cross-tenant lookup returns 404 (object not visible in get_queryset).
        assert r.status_code == 404


@pytest.mark.django_db
class TestCsvImportFileLevel:
    def test_no_file_rejected(self, api_client, login, school_a, teacher_a):
        course = _make_course(school_a, code="CSV-F")
        bank = _make_bank(school_a, course, teacher_a)
        login(api_client, teacher_a)
        r = api_client.post(f"/api/v1/quizzes/banks/{bank.id}/import-csv/", {}, format="multipart")
        assert r.status_code == 400

    def test_non_utf8_rejected(self, api_client, login, school_a, teacher_a):
        course = _make_course(school_a, code="CSV-F2")
        bank = _make_bank(school_a, course, teacher_a)
        login(api_client, teacher_a)
        bad = io.BytesIO(b"\xff\xfe\x00\x00")  # not valid UTF-8
        bad.name = "x.csv"
        r = api_client.post(f"/api/v1/quizzes/banks/{bank.id}/import-csv/", {"file": bad}, format="multipart")
        assert r.status_code == 400
