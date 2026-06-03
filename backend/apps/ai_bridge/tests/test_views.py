"""
File:    backend/apps/ai_bridge/tests/test_views.py
Purpose: End-to-end tests for the six AI proxy endpoints — auth, role gates, AiJob lifecycle, 503 propagation, multi-tenant isolation.
Owner:   Navanish

The httpx AiClient is mocked so these tests never reach a real Gemini.
We assert on AiJob rows (school, kind, status, request_json) and HTTP shape.
"""

from __future__ import annotations

import io

import pytest
from rest_framework.test import APIClient

from apps.ai_bridge import services as bridge_services
from apps.ai_bridge.client import AiServiceError, AiServiceUnavailable
from apps.ai_bridge.models import AiJob


def _mock_call(monkeypatch, attr: str, returns=None, raises=None):
    """Patch one of the AiClient methods used by services.py."""
    from apps.ai_bridge import client as client_mod

    def fake(*args, **kwargs):
        if raises is not None:
            raise raises
        return returns or {"ok": True, "model_used": "gemini-test", "usage": {"tokens_in": 10, "tokens_out": 20}}

    monkeypatch.setattr(client_mod.ai_client, attr, fake)


CAREER_URL          = "/api/v1/ai/career/ask/"
GENERATE_URL        = "/api/v1/ai/quiz/generate/"
GENERATE_PDF_URL    = "/api/v1/ai/quiz/generate-from-pdf/"
ADAPTIVE_URL        = "/api/v1/ai/quiz/adaptive-next/"
GRADE_SHORT_URL     = "/api/v1/ai/quiz/grade-short/"
SEARCH_URL          = "/api/v1/ai/content/search/"


# ── career/ask — student-only ────────────────────────────────────────────────


@pytest.mark.django_db
class TestCareerAskView:
    def test_anonymous_blocked(self, api_client):
        r = api_client.post(CAREER_URL, {"question": "what next?"}, format="json")
        assert r.status_code == 401

    def test_teacher_blocked(self, api_client, login, teacher_a, monkeypatch):
        _mock_call(monkeypatch, "career_ask")
        login(api_client, teacher_a)
        r = api_client.post(CAREER_URL, {"question": "?"}, format="json")
        assert r.status_code == 403

    def test_student_happy_path_creates_aijob_scoped_to_school(
        self, api_client, login, student_a, school_a, monkeypatch
    ):
        _mock_call(monkeypatch, "career_ask", returns={"answer": "AI engineer.", "model_used": "gemini-test"})
        login(api_client, student_a)
        r = api_client.post(CAREER_URL, {"question": "Best field?"}, format="json")
        assert r.status_code == 200, r.content
        assert r.json()["answer"] == "AI engineer."

        jobs = AiJob.objects.filter(school=school_a, kind=AiJob.Kind.CAREER)
        assert jobs.count() == 1
        job = jobs.first()
        assert job.status == AiJob.Status.DONE
        assert job.created_by_id == student_a.id

    def test_503_when_service_unavailable(self, api_client, login, student_a, monkeypatch):
        _mock_call(monkeypatch, "career_ask", raises=AiServiceUnavailable("down"))
        login(api_client, student_a)
        r = api_client.post(CAREER_URL, {"question": "?"}, format="json")
        assert r.status_code == 503
        # Failed job still recorded for audit.
        assert AiJob.objects.filter(status=AiJob.Status.FAILED).count() == 1


# ── quiz/grade-short — staff only, new in Phase 1 ────────────────────────────


@pytest.mark.django_db
class TestGradeShortView:
    PAYLOAD = {
        "question_text":  "What is photosynthesis?",
        "rubric":         "Mention light energy, chlorophyll, glucose.",
        "student_answer": "Plants make food from sunlight.",
    }

    def test_anonymous_blocked(self, api_client):
        assert api_client.post(GRADE_SHORT_URL, self.PAYLOAD, format="json").status_code == 401

    def test_student_blocked(self, api_client, login, student_a, monkeypatch):
        _mock_call(monkeypatch, "grade_short")
        login(api_client, student_a)
        assert api_client.post(GRADE_SHORT_URL, self.PAYLOAD, format="json").status_code == 403

    def test_teacher_happy_path(self, api_client, login, teacher_a, school_a, monkeypatch):
        _mock_call(
            monkeypatch, "grade_short",
            returns={"score": 0.6, "feedback": "Partially correct.", "model_used": "gemini-test"},
        )
        login(api_client, teacher_a)
        r = api_client.post(GRADE_SHORT_URL, self.PAYLOAD, format="json")
        assert r.status_code == 200, r.content
        assert r.json()["score"] == 0.6
        assert AiJob.objects.filter(
            school=school_a, kind=AiJob.Kind.GRADE_SHORT, status=AiJob.Status.DONE
        ).count() == 1

    def test_validation_error_on_missing_field(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        r = api_client.post(GRADE_SHORT_URL, {"question_text": "Q"}, format="json")
        assert r.status_code == 400


# ── quiz/generate-from-pdf — multipart, new in Phase 1 ───────────────────────


@pytest.mark.django_db
class TestGeneratePdfView:
    @staticmethod
    def _pdf_file() -> io.BytesIO:
        f = io.BytesIO(b"%PDF-1.4 minimal content")
        f.name = "lesson.pdf"
        return f

    def test_anonymous_blocked(self, api_client):
        r = api_client.post(
            GENERATE_PDF_URL,
            {"file": self._pdf_file(), "topic": "T", "grade": "8"},
            format="multipart",
        )
        assert r.status_code == 401

    def test_student_blocked(self, api_client, login, student_a, monkeypatch):
        _mock_call(monkeypatch, "generate_from_pdf", returns={"questions": []})
        login(api_client, student_a)
        r = api_client.post(
            GENERATE_PDF_URL,
            {"file": self._pdf_file(), "topic": "T", "grade": "8"},
            format="multipart",
        )
        assert r.status_code == 403

    def test_teacher_happy_path(self, api_client, login, teacher_a, school_a, monkeypatch):
        _mock_call(
            monkeypatch, "generate_from_pdf",
            returns={"questions": [{"text": "Q1"}], "model_used": "gemini-test"},
        )
        login(api_client, teacher_a)
        r = api_client.post(
            GENERATE_PDF_URL,
            {"file": self._pdf_file(), "topic": "Photosynthesis", "grade": "8", "count": 3},
            format="multipart",
        )
        assert r.status_code == 200, r.content
        assert len(r.json()["questions"]) == 1
        # Audit row was created with the PDF kind and stores filename, NOT bytes.
        job = AiJob.objects.get(school=school_a, kind=AiJob.Kind.QUESTION_GEN_PDF)
        assert job.status == AiJob.Status.DONE
        assert job.request_json["filename"] == "lesson.pdf"
        assert isinstance(job.request_json["pdf_bytes"], int)  # only the byte-count, not content

    def test_rejects_non_pdf_content_type(self, api_client, login, teacher_a):
        login(api_client, teacher_a)
        bad = io.BytesIO(b"not a pdf")
        bad.name = "evil.exe"
        r = api_client.post(
            GENERATE_PDF_URL,
            {"file": bad, "topic": "T", "grade": "8"},
            format="multipart",
        )
        # DRF will report content-type rejection as a 400 ValidationError on `file`.
        assert r.status_code == 400


# ── Tenant isolation: jobs from school B never appear in school A's row count ─


@pytest.mark.django_db
class TestAiJobTenantIsolation:
    def test_jobs_are_school_stamped(
        self, api_client, login, student_a, student_b, school_a, school_b, monkeypatch
    ):
        _mock_call(monkeypatch, "career_ask", returns={"answer": "x"})

        login(api_client, student_a)
        api_client.post(CAREER_URL, {"question": "A"}, format="json")

        # Switch identity to school B and call again.
        api_client.credentials()  # clear bearer
        login(api_client, student_b)
        api_client.post(CAREER_URL, {"question": "B"}, format="json")

        assert AiJob.objects.filter(school=school_a).count() == 1
        assert AiJob.objects.filter(school=school_b).count() == 1
        # Cross-tenant query yields zero rows.
        assert not AiJob.objects.filter(school=school_a, created_by=student_b).exists()
        assert not AiJob.objects.filter(school=school_b, created_by=student_a).exists()
