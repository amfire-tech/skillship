"""
File:    backend/apps/accounts/tests/test_bulk_upload.py
Purpose: /users/bulk-upload/ CSV import — role gate, tenant scope, per-row errors.
Owner:   Navanish
"""

from __future__ import annotations

import io

import pytest

from apps.accounts.models import User


URL = "/api/v1/users/bulk-upload/"


GOOD_CSV = """username,email,first_name,last_name,role,password,admission_number
alice,alice@a.test,Alice,Ant,STUDENT,Pass!2026,A001
bob,bob@a.test,Bob,Beetle,STUDENT,Pass!2026,A002
charlie,charlie@a.test,Charlie,Cat,TEACHER,Pass!2026,
"""


def _upload(api_client, csv_text):
    f = io.BytesIO(csv_text.encode("utf-8"))
    f.name = "users.csv"
    return api_client.post(URL, {"file": f}, format="multipart")


@pytest.mark.django_db
class TestBulkUploadAuth:
    def test_anonymous_blocked(self, api_client):
        f = io.BytesIO(b"username\nx\n"); f.name = "u.csv"
        assert api_client.post(URL, {"file": f}, format="multipart").status_code == 401

    def test_teacher_blocked(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        # CanManageUsers gate denies non-admin/principal callers → 403.
        assert _upload(api_client, GOOD_CSV).status_code == 403

    def test_student_blocked(self, api_client, login, student_a):
        login(api_client, student_a)
        assert _upload(api_client, GOOD_CSV).status_code == 403


@pytest.mark.django_db
class TestBulkUploadByPrincipal:
    def test_principal_imports_into_own_school(
        self, api_client, login, school_a, principal_a
    ):
        login(api_client, principal_a)
        r = _upload(api_client, GOOD_CSV)
        assert r.status_code == 200, r.content
        body = r.json()
        assert body["total_rows"] == 3
        assert body["created"] == 3
        assert body["errors"] == []
        for u in User.objects.filter(email__in=["alice@a.test", "bob@a.test", "charlie@a.test"]):
            assert u.school_id == school_a.id
            assert u.check_password("Pass!2026")

    def test_role_whitelist_blocks_main_admin(
        self, api_client, login, principal_a
    ):
        csv_text = (
            "username,email,first_name,last_name,role,password\n"
            "evil,evil@a.test,Evil,Plan,MAIN_ADMIN,Pass!2026\n"
        )
        login(api_client, principal_a)
        body = _upload(api_client, csv_text).json()
        assert body["created"] == 0
        assert "STUDENT / TEACHER / SUB_ADMIN" in body["errors"][0]["message"]

    def test_principal_ignores_cross_school_column(
        self, api_client, login, school_a, school_b, principal_a
    ):
        """Principal A uploads with `school=<school_b.slug>` → row still lands in school A."""
        csv_text = (
            "username,email,first_name,last_name,role,password,school\n"
            f"sneaky,sneaky@a.test,Sneaky,Thief,STUDENT,Pass!2026,{school_b.slug}\n"
        )
        login(api_client, principal_a)
        body = _upload(api_client, csv_text).json()
        assert body["created"] == 1
        user = User.objects.get(email="sneaky@a.test")
        assert user.school_id == school_a.id  # NOT school_b


@pytest.mark.django_db
class TestBulkUploadByMainAdmin:
    def test_main_admin_uses_school_column(
        self, api_client, login, school_a, school_b, main_admin
    ):
        csv_text = (
            "username,email,first_name,last_name,role,password,school\n"
            f"a1,a1@a.test,A,One,STUDENT,Pass!2026,{school_a.slug}\n"
            f"b1,b1@b.test,B,One,STUDENT,Pass!2026,{school_b.slug}\n"
        )
        login(api_client, main_admin)
        body = _upload(api_client, csv_text).json()
        assert body["created"] == 2
        assert User.objects.get(email="a1@a.test").school_id == school_a.id
        assert User.objects.get(email="b1@b.test").school_id == school_b.id

    def test_main_admin_must_provide_school(
        self, api_client, login, main_admin
    ):
        csv_text = (
            "username,email,first_name,last_name,role,password\n"
            "x,x@x.test,X,Y,STUDENT,Pass!2026\n"
        )
        login(api_client, main_admin)
        body = _upload(api_client, csv_text).json()
        assert body["created"] == 0
        assert "school" in body["errors"][0]["message"].lower()

    def test_unknown_school_rejected(
        self, api_client, login, main_admin
    ):
        csv_text = (
            "username,email,first_name,last_name,role,password,school\n"
            "x,x@x.test,X,Y,STUDENT,Pass!2026,no-such-school\n"
        )
        login(api_client, main_admin)
        body = _upload(api_client, csv_text).json()
        assert body["created"] == 0
        assert "not found" in body["errors"][0]["message"]


@pytest.mark.django_db
class TestBulkUploadValidation:
    def test_missing_required_column_aborts(
        self, api_client, login, principal_a
    ):
        login(api_client, principal_a)
        body = _upload(api_client, "username,email\nalice,a@a.test\n").json()
        assert body["created"] == 0
        assert "Missing required columns" in body["errors"][0]["message"]

    def test_partial_success_per_row(
        self, api_client, login, principal_a
    ):
        csv_text = (
            "username,email,first_name,last_name,role,password\n"
            "good,good@a.test,Good,One,STUDENT,Pass!2026\n"
            "noemail,,No,Email,STUDENT,Pass!2026\n"
            "short,short@a.test,Sh,Ort,STUDENT,abc\n"
        )
        login(api_client, principal_a)
        body = _upload(api_client, csv_text).json()
        assert body["total_rows"] == 3
        assert body["created"] == 1
        assert {e["row"] for e in body["errors"]} == {3, 4}
