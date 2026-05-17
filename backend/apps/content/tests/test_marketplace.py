"""
File:    backend/apps/content/tests/test_marketplace.py
Purpose: Marketplace purchase flow — tenant scoping, MAIN_ADMIN guard, course_id validation.
Owner:   Navanish

These tests cover the Phase 1 hardening of `purchase_listing`:
  - MAIN_ADMIN (school=NULL) cannot purchase.
  - Optional course_id must belong to the buyer's school.
  - Listings copy into the buyer's tenant as ContentItem rows.
"""

from __future__ import annotations

import pytest

from apps.academics.models import Course
from apps.content.models import ContentItem, MarketplaceListing


@pytest.fixture
def course_a(school_a):
    return Course.objects.create(school=school_a, name="MathA", code="MATH-A")


@pytest.fixture
def course_b(school_b):
    return Course.objects.create(school=school_b, name="MathB", code="MATH-B")


@pytest.fixture
def listing(school_a):
    return MarketplaceListing.objects.create(
        title="Algebra Intro PDF",
        description="Free chapter",
        author_school=school_a,
        kind=MarketplaceListing.Kind.PDF,
        price_inr=0,
        file_url="https://cdn.test/algebra.pdf",
        is_active=True,
    )


def _purchase_url(listing) -> str:
    return f"/api/v1/content/marketplace/{listing.id}/purchase/"


@pytest.mark.django_db
class TestMarketplacePurchase:
    def test_anonymous_blocked(self, api_client, listing):
        r = api_client.post(_purchase_url(listing), {}, format="json")
        assert r.status_code == 401

    def test_main_admin_rejected_no_school(
        self, api_client, login, main_admin, listing
    ):
        login(api_client, main_admin)
        r = api_client.post(_purchase_url(listing), {}, format="json")
        # Service raises ValidationError → DRF 400.
        assert r.status_code == 400
        assert "school-scoped" in r.content.decode().lower()
        assert not ContentItem.objects.exists()

    def test_school_a_student_purchases_into_own_tenant(
        self, api_client, login, student_a, school_a, course_a, listing
    ):
        login(api_client, student_a)
        r = api_client.post(_purchase_url(listing), {}, format="json")
        assert r.status_code == 201, r.content

        items = ContentItem.objects.filter(school=school_a)
        assert items.count() == 1
        item = items.first()
        assert item.title == "Algebra Intro PDF"
        assert item.course_id == course_a.id  # the only course in school A

    def test_explicit_course_id_must_belong_to_buyer_school(
        self, api_client, login, student_a, course_a, course_b, listing
    ):
        login(api_client, student_a)
        r = api_client.post(
            _purchase_url(listing),
            {"course_id": str(course_b.id)},  # cross-school course
            format="json",
        )
        assert r.status_code == 400
        assert "not a course in your school" in str(r.content).lower()

    def test_no_course_in_school_returns_400(
        self, api_client, login, student_b, school_b, listing
    ):
        """student_b's school has no Course yet — purchase should be a clean validation error, not a 500."""
        assert not Course.objects.filter(school=school_b).exists()
        login(api_client, student_b)
        r = api_client.post(_purchase_url(listing), {}, format="json")
        assert r.status_code == 400

    def test_buyer_tenant_isolation(
        self, api_client, login, student_a, student_b, school_a, school_b, course_a, course_b, listing
    ):
        """A purchase in school A must not leak into school B's ContentItem list."""
        login(api_client, student_a)
        api_client.post(_purchase_url(listing), {}, format="json")
        api_client.credentials()
        login(api_client, student_b)
        api_client.post(_purchase_url(listing), {}, format="json")

        assert ContentItem.objects.filter(school=school_a).count() == 1
        assert ContentItem.objects.filter(school=school_b).count() == 1
        # No row is mis-stamped.
        assert not ContentItem.objects.filter(school=school_a, course=course_b).exists()
        assert not ContentItem.objects.filter(school=school_b, course=course_a).exists()
