"""
File:    backend/apps/schools/tests/test_logo.py
Purpose: School logo — MAIN_ADMIN can set/clear it (with validation), and every
         role's /auth/me/ exposes their own school's logo.
Owner:   Navanish
"""

from __future__ import annotations

import pytest

pytestmark = pytest.mark.django_db

TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMCAYAAAA6oQAAAABJRU5ErkJggg=="


def test_admin_creates_school_with_logo(api_client, main_admin, login):
    login(api_client, main_admin)
    res = api_client.post(
        "/api/v1/schools/",
        {"name": "Logo School", "board": "CBSE", "logo": TINY_PNG},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["logo"] == TINY_PNG


def test_admin_updates_and_clears_logo(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    res = api_client.patch(f"/api/v1/schools/{school_a.id}/", {"logo": TINY_PNG}, format="json")
    assert res.status_code == 200, res.content
    assert res.data["logo"] == TINY_PNG

    res = api_client.patch(f"/api/v1/schools/{school_a.id}/", {"logo": ""}, format="json")
    assert res.status_code == 200, res.content
    assert res.data["logo"] == ""


def test_logo_must_be_image_data_url(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    res = api_client.patch(
        f"/api/v1/schools/{school_a.id}/", {"logo": "https://evil.example/x.png"}, format="json"
    )
    assert res.status_code == 400
    assert "logo" in res.data


def test_oversized_logo_rejected(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    huge = "data:image/png;base64," + ("A" * 700_001)
    res = api_client.patch(f"/api/v1/schools/{school_a.id}/", {"logo": huge}, format="json")
    assert res.status_code == 400
    assert "logo" in res.data


def test_student_me_exposes_school_logo(api_client, student_a, school_a, login):
    school_a.logo = TINY_PNG
    school_a.save(update_fields=["logo"])
    login(api_client, student_a)
    res = api_client.get("/api/v1/auth/me/")
    assert res.status_code == 200, res.content
    assert res.data["school_logo"] == TINY_PNG


def test_teacher_me_exposes_school_logo(api_client, teacher_a, school_a, login):
    school_a.logo = TINY_PNG
    school_a.save(update_fields=["logo"])
    login(api_client, teacher_a)
    res = api_client.get("/api/v1/auth/me/")
    assert res.status_code == 200, res.content
    assert res.data["school_logo"] == TINY_PNG
