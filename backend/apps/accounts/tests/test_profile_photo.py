"""
File:    backend/apps/accounts/tests/test_profile_photo.py
Purpose: POST /api/v1/auth/profile-photo/ — self-service avatar upload, used
         primarily by Skillship teachers so a principal can recognise them.
Owner:   Navanish
"""

from __future__ import annotations

import pytest

PHOTO_URL = "/api/v1/auth/profile-photo/"
ME_URL = "/api/v1/auth/me/"
TINY_PNG = "data:image/png;base64,iVBORw0KGgo="


@pytest.mark.django_db
def test_sets_and_returns_photo_on_me(api_client, principal_a, login):
    login(api_client, principal_a)
    res = api_client.post(PHOTO_URL, {"photo": TINY_PNG}, format="json")
    assert res.status_code == 200, res.content
    assert res.data["profile_photo"] == TINY_PNG

    res = api_client.get(ME_URL)
    assert res.data["profile_photo"] == TINY_PNG


@pytest.mark.django_db
def test_empty_string_clears_photo(api_client, principal_a, login):
    login(api_client, principal_a)
    api_client.post(PHOTO_URL, {"photo": TINY_PNG}, format="json")
    res = api_client.post(PHOTO_URL, {"photo": ""}, format="json")
    assert res.status_code == 200, res.content
    assert res.data["profile_photo"] is None


@pytest.mark.django_db
def test_rejects_non_image_value(api_client, principal_a, login):
    login(api_client, principal_a)
    res = api_client.post(PHOTO_URL, {"photo": "not-a-data-url"}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_requires_auth(api_client):
    res = api_client.post(PHOTO_URL, {"photo": TINY_PNG}, format="json")
    assert res.status_code == 401
