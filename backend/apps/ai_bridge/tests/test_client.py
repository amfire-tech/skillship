"""
File:    backend/apps/ai_bridge/tests/test_client.py
Purpose: Unit tests for the httpx AiClient — retries, 4xx vs 5xx handling, multipart.
Owner:   Navanish

These are pure unit tests — no Django DB, no AI service. httpx.MockTransport
intercepts every request so we can assert on the wire-level behavior of the
retry loop.
"""

from __future__ import annotations

import httpx
import pytest
from django.test import override_settings

from apps.ai_bridge import client as client_mod
from apps.ai_bridge.client import AiClient, AiServiceError, AiServiceUnavailable


def _patch_client(monkeypatch, handler):
    """Replace AiClient's httpx.Client with one wired to a MockTransport handler.

    Also zeros the backoff tuple so tests don't sleep through real-time waits.
    """
    transport = httpx.MockTransport(handler)
    fake = httpx.Client(
        base_url="http://ai.test",
        headers={"X-Internal-Key": "test-key"},
        transport=transport,
    )

    def _init(self):
        self._http = fake

    monkeypatch.setattr(AiClient, "__init__", _init)
    monkeypatch.setattr(client_mod, "_BACKOFF_SECONDS", (0.0, 0.0, 0.0))


class TestAiClientHappyPath:
    def test_career_ask_returns_json_on_200(self, monkeypatch):
        def handler(request: httpx.Request) -> httpx.Response:
            assert request.url.path == "/api/career/ask"
            assert request.headers["x-internal-key"] == "test-key"
            return httpx.Response(200, json={"answer": "ok"})

        _patch_client(monkeypatch, handler)
        result = AiClient().career_ask({"question": "what is AI?"})
        assert result == {"answer": "ok"}

    def test_grade_short_returns_score(self, monkeypatch):
        def handler(_req: httpx.Request) -> httpx.Response:
            return httpx.Response(200, json={"score": 0.8, "feedback": "good"})

        _patch_client(monkeypatch, handler)
        result = AiClient().grade_short(
            {"question_text": "Q", "rubric": "R", "student_answer": "A"}
        )
        assert result == {"score": 0.8, "feedback": "good"}

    def test_generate_from_pdf_is_multipart(self, monkeypatch):
        seen: dict = {}

        def handler(request: httpx.Request) -> httpx.Response:
            seen["content_type"] = request.headers.get("content-type", "")
            seen["path"] = request.url.path
            seen["key"] = request.headers.get("x-internal-key", "")
            return httpx.Response(200, json={"questions": []})

        _patch_client(monkeypatch, handler)
        AiClient().generate_from_pdf(
            pdf_bytes=b"%PDF-1.4 fake",
            filename="t.pdf",
            form_fields={"topic": "x", "grade": "8", "count": 3, "types": ["mcq", "tf"]},
        )
        assert seen["path"] == "/api/quiz/generate-from-pdf"
        assert seen["key"] == "test-key"
        assert seen["content_type"].startswith("multipart/form-data")


class TestAiClientRetries:
    def test_500_retries_then_raises_unavailable(self, monkeypatch):
        calls = {"n": 0}

        def handler(_req: httpx.Request) -> httpx.Response:
            calls["n"] += 1
            return httpx.Response(500, text="boom")

        _patch_client(monkeypatch, handler)
        with pytest.raises(AiServiceUnavailable):
            AiClient().career_ask({})
        # 3 attempts: first plus 2 retries (backoff tuple length == 3).
        assert calls["n"] == 3

    def test_503_then_200_succeeds(self, monkeypatch):
        seq = iter([503, 200])

        def handler(_req: httpx.Request) -> httpx.Response:
            code = next(seq)
            if code == 200:
                return httpx.Response(200, json={"ok": True})
            return httpx.Response(503, text="busy")

        _patch_client(monkeypatch, handler)
        assert AiClient().career_ask({}) == {"ok": True}

    def test_4xx_is_not_retried(self, monkeypatch):
        calls = {"n": 0}

        def handler(_req: httpx.Request) -> httpx.Response:
            calls["n"] += 1
            return httpx.Response(422, text="bad payload")

        _patch_client(monkeypatch, handler)
        with pytest.raises(AiServiceError):
            AiClient().career_ask({})
        assert calls["n"] == 1, "4xx must surface immediately, no retry"

    def test_connect_error_retries(self, monkeypatch):
        calls = {"n": 0}

        def handler(_req: httpx.Request) -> httpx.Response:
            calls["n"] += 1
            raise httpx.ConnectError("dns")

        _patch_client(monkeypatch, handler)
        with pytest.raises(AiServiceUnavailable):
            AiClient().career_ask({})
        assert calls["n"] == 3
