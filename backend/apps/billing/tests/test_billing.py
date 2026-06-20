"""
File:    backend/apps/billing/tests/test_billing.py
Purpose: API tests for the billing ledger — owner write / principal read,
         tenant isolation, summary maths, and the revenue overview.
Owner:   Navanish
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from apps.billing.models import BillingEntry

pytestmark = pytest.mark.django_db

ENTRIES = "/api/v1/billing/entries/"
SUMMARY = "/api/v1/billing/entries/summary/"
REVENUE = "/api/v1/billing/revenue/"


def _charge(school, amount, on="2026-04-01"):
    return BillingEntry.objects.create(
        school=school, kind=BillingEntry.Kind.CHARGE, amount=Decimal(amount), occurred_on=on
    )


def _payment(school, amount, on="2026-04-10"):
    return BillingEntry.objects.create(
        school=school, kind=BillingEntry.Kind.PAYMENT, amount=Decimal(amount), occurred_on=on
    )


# ── Owner writes ──────────────────────────────────────────────────────────────


def test_main_admin_can_record_charge_and_payment(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    res = api_client.post(
        f"{ENTRIES}?school={school_a.id}",
        {"kind": "CHARGE", "amount": "49999.00", "occurred_on": "2026-04-01", "note": "Plan 01"},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["school"] == str(school_a.id)
    assert res.data["created_by_name"]  # audit stamped

    res = api_client.post(
        f"{ENTRIES}?school={school_a.id}",
        {"kind": "PAYMENT", "amount": "20000.00", "occurred_on": "2026-04-10", "method": "UPI"},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["method"] == "UPI"


def test_main_admin_must_scope_to_a_school(api_client, main_admin, login):
    login(api_client, main_admin)
    res = api_client.get(ENTRIES)  # no ?school=
    assert res.status_code == 403


def test_charge_drops_payment_method(api_client, main_admin, school_a, login):
    login(api_client, main_admin)
    res = api_client.post(
        f"{ENTRIES}?school={school_a.id}",
        {"kind": "CHARGE", "amount": "1000", "occurred_on": "2026-04-01", "method": "UPI"},
        format="json",
    )
    assert res.status_code == 201, res.content
    assert res.data["method"] == ""


# ── Summary maths ─────────────────────────────────────────────────────────────


def test_summary_computes_remaining(api_client, main_admin, school_a, login):
    _charge(school_a, "50000")
    _charge(school_a, "10000")
    _payment(school_a, "40000")
    login(api_client, main_admin)
    res = api_client.get(f"{SUMMARY}?school={school_a.id}")
    assert res.status_code == 200, res.content
    assert Decimal(res.data["total_charged"]) == Decimal("60000")
    assert Decimal(res.data["total_paid"]) == Decimal("40000")
    assert Decimal(res.data["remaining"]) == Decimal("20000")


# ── Principal read-only, own school only ──────────────────────────────────────


def test_principal_sees_own_summary(api_client, principal_a, school_a, login):
    _charge(school_a, "50000")
    _payment(school_a, "30000")
    login(api_client, principal_a)
    res = api_client.get(SUMMARY)  # no ?school — derived from user
    assert res.status_code == 200, res.content
    assert Decimal(res.data["remaining"]) == Decimal("20000")


def test_principal_cannot_write(api_client, principal_a, school_a, login):
    login(api_client, principal_a)
    res = api_client.post(
        ENTRIES,
        {"kind": "CHARGE", "amount": "1000", "occurred_on": "2026-04-01"},
        format="json",
    )
    assert res.status_code == 403


def test_principal_cannot_see_other_school(api_client, principal_a, school_b, login):
    _charge(school_b, "99999")
    login(api_client, principal_a)
    # Principal A is scoped to school_a; the ?school override is ignored for non-admins.
    res = api_client.get(SUMMARY)
    assert res.status_code == 200
    assert Decimal(res.data["total_charged"]) == Decimal("0")


def test_student_has_no_billing_access(api_client, student_a, login):
    login(api_client, student_a)
    assert api_client.get(SUMMARY).status_code == 403


# ── Revenue overview (owner only) ─────────────────────────────────────────────


def test_revenue_overview(api_client, main_admin, school_a, school_b, login):
    _charge(school_a, "60000")
    _payment(school_a, "40000", on="2026-04-10")
    _charge(school_b, "50000")
    _payment(school_b, "50000", on="2026-05-12")
    login(api_client, main_admin)
    res = api_client.get(REVENUE)
    assert res.status_code == 200, res.content
    totals = res.data["totals"]
    assert Decimal(totals["total_charged"]) == Decimal("110000")
    assert Decimal(totals["total_paid"]) == Decimal("90000")
    assert Decimal(totals["total_outstanding"]) == Decimal("20000")
    assert totals["school_count"] == 2
    # Highest due first
    assert res.data["per_school"][0]["school"] == str(school_a.id)
    months = {m["month"] for m in res.data["monthly"]}
    assert {"2026-04", "2026-05"} <= months
    # Annual rollup + this-period headline figures
    years = {y["year"]: Decimal(y["collected"]) for y in res.data["yearly"]}
    assert years["2026"] == Decimal("90000")
    assert Decimal(totals["collected_this_year"]) == Decimal("90000")


def test_revenue_forbidden_for_principal(api_client, principal_a, login):
    login(api_client, principal_a)
    assert api_client.get(REVENUE).status_code == 403
