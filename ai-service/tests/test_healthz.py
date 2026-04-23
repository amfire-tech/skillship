"""
File:    ai-service/tests/test_healthz.py
Purpose: Smoke test — GET /healthz returns 200 + model name.
Owner:   Navanish
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_healthz_returns_200(client: TestClient):
    """Test that /healthz endpoint returns 200 status code."""
    response = client.get("/healthz")
    assert response.status_code == 200


def test_healthz_response_structure(client: TestClient):
    """Test that /healthz returns expected response structure."""
    response = client.get("/healthz")
    data = response.json()
    
    assert "status" in data
    assert data["status"] == "ok"
    assert "model" in data
    assert "service" in data
    assert data["service"] == "Skillship AI"


def test_root_endpoint_returns_200(client: TestClient):
    """Test that root endpoint returns 200 status code."""
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert "service" in data
    assert "version" in data
    assert "docs" in data


def test_protected_endpoint_without_key(client: TestClient):
    """Test that protected endpoints require X-Internal-Key header."""
    response = client.post("/api/career/ask", json={})
    assert response.status_code == 403


def test_protected_endpoint_with_invalid_key(client: TestClient):
    """Test that protected endpoints reject invalid X-Internal-Key."""
    response = client.post(
        "/api/career/ask",
        json={},
        headers={"X-Internal-Key": "invalid-key"}
    )
    assert response.status_code == 403

