"""
File:    backend/apps/academics/tests/test_academics_crud.py
Purpose: End-to-end tests for the four academics endpoints
         (years / classes / courses / enrollments) plus the bulk-CSV upload.
Owner:   Prashant

Why one big file:
    All four resources share the same permission shape (MAIN_ADMIN | PRINCIPAL
    on the surface, same-school on objects), the same TenantScopedViewSet
    plumbing, and almost the same cross-FK validation pattern. Splitting them
    into four files would duplicate fixtures and obscure the symmetry. When
    one of them sprouts a different rule, *that* test class moves to its own
    file — not before.

Coverage (49 cases, parametrised where the rule is identical across roles):
    - YEARS / CLASSES / COURSES / ENROLLMENTS each get the standard
      "MAIN_ADMIN any, PRINCIPAL same-school, TEACHER+STUDENT 403, anon 401"
      sweep on at least one verb each.
    - Cross-tenant FK smuggling is tested explicitly on Class.academic_year,
      Class.class_teacher and Enrollment.{student,klass,course} — these are
      the joints where a bug becomes a data leak.
    - bulk-csv: happy path, duplicate-row dedupe, unknown-email error,
      unknown-grade/section error, missing-current-year error.
"""

from __future__ import annotations

import io
from datetime import date

import pytest

from apps.academics.models import AcademicYear, Class, Course, Enrollment

YEARS_URL = "/api/v1/academics/years/"
CLASSES_URL = "/api/v1/academics/classes/"
COURSES_URL = "/api/v1/academics/courses/"
ENROLL_URL = "/api/v1/academics/enrollments/"
BULK_CSV_URL = f"{ENROLL_URL}bulk-csv/"


# ── Shared per-test fixtures ────────────────────────────────────────────────


@pytest.fixture
def year_a(school_a):
    return AcademicYear.objects.create(
        school=school_a,
        name="2025-26",
        start_date=date(2025, 6, 1),
        end_date=date(2026, 4, 30),
        is_current=True,
    )


@pytest.fixture
def year_b(school_b):
    return AcademicYear.objects.create(
        school=school_b,
        name="2025-26",
        start_date=date(2025, 6, 1),
        end_date=date(2026, 4, 30),
        is_current=True,
    )


@pytest.fixture
def class_a(school_a, year_a):
    return Class.objects.create(school=school_a, academic_year=year_a, grade=10, section="A")


@pytest.fixture
def class_b(school_b, year_b):
    return Class.objects.create(school=school_b, academic_year=year_b, grade=10, section="A")


@pytest.fixture
def course_a(school_a):
    return Course.objects.create(
        school=school_a, name="Mathematics 10", code="MATH-10", grade_min=9, grade_max=10
    )


@pytest.fixture
def course_b(school_b):
    return Course.objects.create(
        school=school_b, name="Mathematics 10", code="MATH-10", grade_min=9, grade_max=10
    )


# ── /years/ ─────────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestAcademicYearCrud:
    def test_principal_lists_only_own_school_years(
        self, api_client, principal_a, password, login, year_a, year_b
    ):
        login(api_client, principal_a, password)
        resp = api_client.get(YEARS_URL)
        assert resp.status_code == 200
        results = resp.data["results"] if "results" in resp.data else resp.data
        ids = {r["id"] for r in results}
        assert str(year_a.id) in ids
        assert str(year_b.id) not in ids

    def test_principal_creates_year_in_own_school(
        self, api_client, principal_a, password, login, school_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            YEARS_URL,
            {
                "name": "2026-27",
                "start_date": "2026-06-01",
                "end_date": "2027-04-30",
                "is_current": False,
            },
            format="json",
        )
        assert resp.status_code == 201, resp.content
        assert resp.data["school"] == str(school_a.id)
        assert AcademicYear.objects.filter(name="2026-27", school=school_a).exists()

    def test_principal_a_cannot_see_school_b_year_via_detail(
        self, api_client, principal_a, password, login, year_b
    ):
        login(api_client, principal_a, password)
        # Filtered out → 404, not 403, so we don't confirm the id exists.
        resp = api_client.get(f"{YEARS_URL}{year_b.id}/")
        assert resp.status_code == 404

    def test_end_date_before_start_date_is_400(
        self, api_client, principal_a, password, login
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            YEARS_URL,
            {"name": "Bad", "start_date": "2026-06-01", "end_date": "2026-05-01"},
            format="json",
        )
        assert resp.status_code == 400
        assert "end_date" in resp.data

    def test_duplicate_name_in_same_school_is_400(
        self, api_client, principal_a, password, login, year_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            YEARS_URL,
            {
                "name": year_a.name,
                "start_date": "2026-06-01",
                "end_date": "2027-04-30",
            },
            format="json",
        )
        assert resp.status_code == 400


# ── /courses/ ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestCourseCrud:
    def test_principal_creates_course(
        self, api_client, principal_a, password, login, school_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            COURSES_URL,
            {
                "name": "AI Foundations",
                "code": "AI-INTRO",
                "stream": "AI",
                "grade_min": 8,
                "grade_max": 10,
            },
            format="json",
        )
        assert resp.status_code == 201, resp.content
        assert resp.data["school"] == str(school_a.id)
        assert Course.objects.filter(school=school_a, code="AI-INTRO").exists()

    def test_grade_range_inverted_is_400(
        self, api_client, principal_a, password, login
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            COURSES_URL,
            {"name": "Wrong", "code": "WRONG", "grade_min": 10, "grade_max": 5},
            format="json",
        )
        assert resp.status_code == 400
        assert "grade_max" in resp.data

    def test_two_schools_can_share_a_course_code(
        self, api_client, principal_a, principal_b, password, login, school_a, school_b
    ):
        login(api_client, principal_a, password)
        a_resp = api_client.post(COURSES_URL, {"name": "X", "code": "DUP-CODE"}, format="json")
        assert a_resp.status_code == 201

        # Re-login as principal_b — same code allowed because uniqueness is
        # per-school, not global.
        api_client.credentials()  # clear auth header
        login(api_client, principal_b, password)
        b_resp = api_client.post(COURSES_URL, {"name": "X", "code": "DUP-CODE"}, format="json")
        assert b_resp.status_code == 201, b_resp.content


# ── /classes/ — including cross-FK same-school checks ───────────────────────


@pytest.mark.django_db
class TestClassCrud:
    def test_principal_creates_class_in_own_year(
        self, api_client, principal_a, password, login, school_a, year_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            CLASSES_URL,
            {"academic_year": str(year_a.id), "grade": 10, "section": "B"},
            format="json",
        )
        assert resp.status_code == 201, resp.content
        assert resp.data["school"] == str(school_a.id)
        assert resp.data["academic_year"] == str(year_a.id)

    def test_principal_cannot_use_other_schools_academic_year(
        self, api_client, principal_a, password, login, year_b
    ):
        """Cross-tenant smuggling check — passing School B's year_id from
        Principal A's session must 400 with a clear field error, not 500."""
        login(api_client, principal_a, password)
        resp = api_client.post(
            CLASSES_URL,
            {"academic_year": str(year_b.id), "grade": 11, "section": "C"},
            format="json",
        )
        assert resp.status_code == 400
        assert "academic_year" in resp.data
        assert not Class.objects.filter(grade=11, section="C").exists()

    def test_class_teacher_must_be_in_same_school(
        self, api_client, principal_a, password, login, year_a, school_b
    ):
        from apps.accounts.models import User

        teacher_b = User.objects.create_user(
            username="teacher_b_extra",
            email="teacher.extra@school-b.test",
            password="Skillship#Test-2026",
            role=User.Role.TEACHER,
            school=school_b,
        )
        login(api_client, principal_a, password)
        resp = api_client.post(
            CLASSES_URL,
            {
                "academic_year": str(year_a.id),
                "grade": 9,
                "section": "Z",
                "class_teacher": str(teacher_b.id),
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "class_teacher" in resp.data

    def test_class_teacher_must_have_role_teacher(
        self, api_client, principal_a, password, login, year_a, student_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            CLASSES_URL,
            {
                "academic_year": str(year_a.id),
                "grade": 9,
                "section": "Y",
                "class_teacher": str(student_a.id),
            },
            format="json",
        )
        # Student isn't even in the queryset for class_teacher, so we get a
        # standard PrimaryKeyRelatedField "object does not exist" 400.
        assert resp.status_code == 400
        assert "class_teacher" in resp.data

    def test_grade_section_unique_per_year(
        self, api_client, principal_a, password, login, year_a, class_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            CLASSES_URL,
            {"academic_year": str(year_a.id), "grade": class_a.grade, "section": class_a.section},
            format="json",
        )
        assert resp.status_code == 400


# ── /enrollments/ — including cross-FK same-school checks ───────────────────


@pytest.mark.django_db
class TestEnrollmentCrud:
    def test_principal_enrolls_student_in_own_class(
        self, api_client, principal_a, password, login, student_a, class_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {"student": str(student_a.id), "klass": str(class_a.id)},
            format="json",
        )
        assert resp.status_code == 201, resp.content
        assert Enrollment.objects.filter(student=student_a, klass=class_a, course=None).exists()

    def test_enrollment_with_course(
        self, api_client, principal_a, password, login, student_a, class_a, course_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {
                "student": str(student_a.id),
                "klass": str(class_a.id),
                "course": str(course_a.id),
            },
            format="json",
        )
        assert resp.status_code == 201, resp.content

    def test_cross_school_student_is_400(
        self, api_client, principal_a, password, login, student_b, class_a
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {"student": str(student_b.id), "klass": str(class_a.id)},
            format="json",
        )
        # student is filtered out of the queryset, so DRF returns the
        # standard "object does not exist" 400.
        assert resp.status_code == 400
        assert "student" in resp.data

    def test_cross_school_class_is_400(
        self, api_client, principal_a, password, login, student_a, class_b
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {"student": str(student_a.id), "klass": str(class_b.id)},
            format="json",
        )
        # klass IS in the queryset (no role filter), so we hit our explicit
        # _validate_same_school and get 400 on the field.
        assert resp.status_code == 400
        assert "klass" in resp.data

    def test_cross_school_course_is_400(
        self, api_client, principal_a, password, login, student_a, class_a, course_b
    ):
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {
                "student": str(student_a.id),
                "klass": str(class_a.id),
                "course": str(course_b.id),
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "course" in resp.data

    def test_duplicate_enrollment_is_400(
        self, api_client, principal_a, password, login, student_a, class_a
    ):
        Enrollment.objects.create(school_id=class_a.school_id, student=student_a, klass=class_a)
        login(api_client, principal_a, password)
        resp = api_client.post(
            ENROLL_URL,
            {"student": str(student_a.id), "klass": str(class_a.id)},
            format="json",
        )
        # uniqueness on (student, klass, course) trips the DB → DRF maps to 400.
        assert resp.status_code == 400


# ── Surface gating across every endpoint, every disallowed role ─────────────


@pytest.mark.django_db
@pytest.mark.parametrize("user_fixture", ["teacher_a", "student_a"])
@pytest.mark.parametrize("url", [YEARS_URL, CLASSES_URL, COURSES_URL, ENROLL_URL])
class TestAcademicsClosedToTeachersAndStudents:
    def test_list_is_403(self, request, api_client, password, login, user_fixture, url):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        resp = api_client.get(url)
        # A TEACHER may READ their own school's classes — the ClassViewSet is
        # tenant-scoped (no cross-school leak) and teachers need class context for
        # rosters/assignments (CanReadClassesOrManage). Every other (role,
        # endpoint) pairing stays fully closed.
        if user_fixture == "teacher_a" and url == CLASSES_URL:
            assert resp.status_code == 200
        else:
            assert resp.status_code == 403

    def test_create_is_403(self, request, api_client, password, login, user_fixture, url):
        user = request.getfixturevalue(user_fixture)
        login(api_client, user, password)
        # Body shape doesn't matter — we should be rejected before validation.
        assert api_client.post(url, {}, format="json").status_code == 403


@pytest.mark.django_db
@pytest.mark.parametrize("url", [YEARS_URL, CLASSES_URL, COURSES_URL, ENROLL_URL])
class TestAcademicsAnonymous:
    def test_list_is_401(self, api_client, db, url):
        assert api_client.get(url).status_code == 401


# ── Bulk CSV enrollment upload ──────────────────────────────────────────────


@pytest.mark.django_db
class TestBulkCsvEnrollment:
    @staticmethod
    def _csv_file(rows: str, *, name: str = "enroll.csv"):
        from django.core.files.uploadedfile import SimpleUploadedFile

        return SimpleUploadedFile(name, rows.encode("utf-8"), content_type="text/csv")

    def test_principal_uploads_valid_csv(
        self, api_client, principal_a, password, login, class_a, student_a, course_a
    ):
        login(api_client, principal_a, password)
        csv = "student_email,grade,section,course_code\n"
        csv += f"{student_a.email},{class_a.grade},{class_a.section},{course_a.code}\n"
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 200, resp.content
        assert resp.data["created_count"] == 1
        assert resp.data["error_count"] == 0
        assert Enrollment.objects.filter(student=student_a, klass=class_a, course=course_a).exists()

    def test_duplicate_row_is_skipped_not_errored(
        self, api_client, principal_a, password, login, class_a, student_a
    ):
        Enrollment.objects.create(school_id=class_a.school_id, student=student_a, klass=class_a)
        login(api_client, principal_a, password)
        csv = (
            "student_email,grade,section\n"
            f"{student_a.email},{class_a.grade},{class_a.section}\n"
        )
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 200
        assert resp.data["created_count"] == 0
        assert resp.data["skipped_count"] == 1
        assert resp.data["error_count"] == 0

    def test_unknown_student_email_is_per_row_error(
        self, api_client, principal_a, password, login, class_a
    ):
        login(api_client, principal_a, password)
        csv = (
            "student_email,grade,section\n"
            f"ghost@nowhere.test,{class_a.grade},{class_a.section}\n"
        )
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 207  # multi-status — partial failure
        assert resp.data["created_count"] == 0
        assert resp.data["error_count"] == 1
        assert "ghost@nowhere.test" in resp.data["errors"][0]["error"]

    def test_unknown_grade_section_is_per_row_error(
        self, api_client, principal_a, password, login, student_a, year_a
    ):
        login(api_client, principal_a, password)
        csv = "student_email,grade,section\n" + f"{student_a.email},12,Z\n"
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 207
        assert resp.data["error_count"] == 1

    def test_no_current_year_is_400(
        self, api_client, principal_a, password, login, year_a, student_a
    ):
        # Mark the only year as not-current → upload should refuse cleanly.
        year_a.is_current = False
        year_a.save(update_fields=["is_current"])
        login(api_client, principal_a, password)
        csv = "student_email,grade,section\n" + f"{student_a.email},10,A\n"
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 400
        assert "current" in resp.data["detail"].lower()

    def test_missing_columns_is_400(
        self, api_client, principal_a, password, login, year_a
    ):
        login(api_client, principal_a, password)
        csv = "email,grade\nfoo@bar.test,10\n"
        resp = api_client.post(BULK_CSV_URL, {"file": self._csv_file(csv)}, format="multipart")
        assert resp.status_code == 400
        assert "missing" in resp.data["detail"].lower()

    def test_non_csv_extension_is_400(
        self, api_client, principal_a, password, login
    ):
        login(api_client, principal_a, password)
        not_csv = self._csv_file("anything", name="upload.txt")
        resp = api_client.post(BULK_CSV_URL, {"file": not_csv}, format="multipart")
        assert resp.status_code == 400

    def test_teacher_cannot_use_bulk_upload(
        self, api_client, teacher_a, password, login
    ):
        login(api_client, teacher_a, password)
        resp = api_client.post(
            BULK_CSV_URL,
            {"file": self._csv_file("student_email,grade,section\n")},
            format="multipart",
        )
        assert resp.status_code == 403
