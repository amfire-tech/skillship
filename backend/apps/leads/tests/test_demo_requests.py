"""
File:    backend/apps/leads/tests/test_demo_requests.py
Purpose: Behaviour tests for the public /demo-requests/ POST + admin triage surface.
Owner:   Navanish

Covers:
  - Anonymous can POST a valid lead → 201, row persisted with status=NEW.
  - POST validation: missing required field, bad email, bad student_range.
  - Anonymous cannot list or read existing leads.
  - Principal (any school-bound user) cannot list leads either — MAIN_ADMIN only.
  - MAIN_ADMIN can list, retrieve, and PATCH status / triage_notes.
  - The PATCH surface cannot tamper with read-only contact fields.
"""

from __future__ import annotations

import pytest
from rest_framework.test import APIClient

from apps.leads.models import DemoRequest

LIST_URL = "/api/v1/demo-requests/"


def _valid_payload(**overrides) -> dict:
    payload = {
        "schoolName": "Sunrise Public School",
        "principalName": "Anita Sharma",
        "city": "Pune",
        "studentRange": "251-500",
        "phoneNumber": "+91-9876543210",
        "emailAddress": "principal@sunrise.test",
        "schoolBoard": "cbse",
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
class TestPublicCreate:
    def test_anonymous_can_submit_valid_lead(self, api_client: APIClient):
        response = api_client.post(LIST_URL, _valid_payload(), format="json")
        assert response.status_code == 201, response.content

        # Echoed read shape carries snake_case + id + status=NEW
        assert response.data["school_name"] == "Sunrise Public School"
        assert response.data["status"] == "NEW"
        assert "id" in response.data

        # Row actually persisted
        assert DemoRequest.objects.count() == 1
        lead = DemoRequest.objects.get()
        assert lead.email_address == "principal@sunrise.test"
        assert lead.school_board == "cbse"

    def test_school_board_is_optional(self, api_client: APIClient):
        response = api_client.post(LIST_URL, _valid_payload(schoolBoard=""), format="json")
        assert response.status_code == 201
        assert DemoRequest.objects.get().school_board == ""

    def test_missing_required_field_is_rejected(self, api_client: APIClient):
        payload = _valid_payload()
        del payload["schoolName"]
        response = api_client.post(LIST_URL, payload, format="json")
        assert response.status_code == 400
        assert "schoolName" in response.data
        assert DemoRequest.objects.count() == 0

    def test_invalid_email_is_rejected(self, api_client: APIClient):
        response = api_client.post(
            LIST_URL, _valid_payload(emailAddress="not-an-email"), format="json"
        )
        assert response.status_code == 400
        assert "emailAddress" in response.data
        assert DemoRequest.objects.count() == 0

    def test_invalid_student_range_is_rejected(self, api_client: APIClient):
        response = api_client.post(
            LIST_URL, _valid_payload(studentRange="ten-million"), format="json"
        )
        assert response.status_code == 400
        assert "studentRange" in response.data


@pytest.mark.django_db
class TestReadIsPrivileged:
    def test_anonymous_cannot_list(self, api_client: APIClient):
        DemoRequest.objects.create(
            school_name="Existing",
            principal_name="X",
            city="Delhi",
            student_range=DemoRequest.StudentRange.UP_TO_250,
            phone_number="123",
            email_address="x@x.test",
        )
        response = api_client.get(LIST_URL)
        assert response.status_code == 401

    def test_principal_cannot_list(self, api_client, principal_a, password, login):
        login(api_client, principal_a, password)
        response = api_client.get(LIST_URL)
        assert response.status_code == 403

    def test_main_admin_can_list(self, api_client, main_admin, password, login):
        DemoRequest.objects.create(
            school_name="Lead 1",
            principal_name="A",
            city="Delhi",
            student_range=DemoRequest.StudentRange.UP_TO_250,
            phone_number="1",
            email_address="a@a.test",
        )
        DemoRequest.objects.create(
            school_name="Lead 2",
            principal_name="B",
            city="Mumbai",
            student_range=DemoRequest.StudentRange.OVER_1000,
            phone_number="2",
            email_address="b@b.test",
        )
        login(api_client, main_admin, password)
        response = api_client.get(LIST_URL)
        assert response.status_code == 200
        assert response.data["count"] == 2


@pytest.mark.django_db
class TestAdminTriage:
    def test_main_admin_can_patch_status_and_notes(
        self, api_client, main_admin, password, login
    ):
        lead = DemoRequest.objects.create(
            school_name="Triage Test",
            principal_name="P",
            city="Delhi",
            student_range=DemoRequest.StudentRange.UP_TO_250,
            phone_number="1",
            email_address="p@p.test",
        )
        login(api_client, main_admin, password)

        response = api_client.patch(
            f"{LIST_URL}{lead.id}/",
            {"status": "CONTACTED", "triage_notes": "Spoke 2026-05-25, sending pricing."},
            format="json",
        )
        assert response.status_code == 200, response.content

        lead.refresh_from_db()
        assert lead.status == "CONTACTED"
        assert lead.triage_notes.startswith("Spoke 2026-05-25")

    def test_patch_cannot_tamper_with_contact_fields(
        self, api_client, main_admin, password, login
    ):
        lead = DemoRequest.objects.create(
            school_name="Original Name",
            principal_name="Original Principal",
            city="Delhi",
            student_range=DemoRequest.StudentRange.UP_TO_250,
            phone_number="1",
            email_address="real@real.test",
        )
        login(api_client, main_admin, password)

        # Attempt to overwrite the immutable lead contact fields. The serializer
        # marks them read-only, so DRF silently drops the values rather than 400.
        response = api_client.patch(
            f"{LIST_URL}{lead.id}/",
            {
                "school_name": "Tampered",
                "email_address": "attacker@evil.test",
                "status": "CONVERTED",
            },
            format="json",
        )
        assert response.status_code == 200

        lead.refresh_from_db()
        assert lead.school_name == "Original Name"
        assert lead.email_address == "real@real.test"
        assert lead.status == "CONVERTED"
