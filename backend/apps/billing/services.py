"""
File:    backend/apps/billing/services.py
Purpose: Pure aggregation helpers over the billing ledger — kept out of the
         views so they can be unit-tested directly and reused by the principal
         summary, the admin per-school card, and the owner revenue analytics.
Owner:   Navanish
"""

from __future__ import annotations

from collections import defaultdict
from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import TruncMonth, TruncYear
from django.utils import timezone

from apps.schools.models import School

from .models import BillingEntry

ZERO = Decimal("0.00")


def school_summary(school_id) -> dict:
    """Charged / paid / remaining for one school.

    Used by both the PRINCIPAL dashboard widget and the MAIN_ADMIN per-school
    card, so the two never disagree on a school's outstanding due.
    """
    rows = (
        BillingEntry.objects.filter(school_id=school_id)
        .values("kind")
        .annotate(total=Sum("amount"))
    )
    totals = {row["kind"]: (row["total"] or ZERO) for row in rows}
    charged = totals.get(BillingEntry.Kind.CHARGE, ZERO)
    paid = totals.get(BillingEntry.Kind.PAYMENT, ZERO)
    return {
        "school": str(school_id),
        "total_charged": charged,
        "total_paid": paid,
        "remaining": charged - paid,
    }


def revenue_overview(months: int = 12) -> dict:
    """Platform-wide revenue for the MAIN_ADMIN analytics page.

    Returns the blocks the UI needs:
      - totals:     headline KPIs (billed / collected / outstanding,
                    plus collected this calendar year and this month)
      - per_school: a row per school with its charged / paid / due
      - monthly:    collected revenue per calendar month (last `months`)
      - yearly:     collected revenue per calendar year (all time)

    "Revenue" everywhere here means money *collected* (PAYMENT rows) — not the
    amount billed — because that is what the business has actually earned.
    """
    charged: dict = defaultdict(lambda: ZERO)
    paid: dict = defaultdict(lambda: ZERO)
    for row in (
        BillingEntry.objects.values("school_id", "kind").annotate(total=Sum("amount"))
    ):
        bucket = charged if row["kind"] == BillingEntry.Kind.CHARGE else paid
        bucket[row["school_id"]] = row["total"] or ZERO

    per_school = []
    total_charged = total_paid = ZERO
    for s in School.objects.values("id", "name", "city", "plan", "is_active"):
        c = charged.get(s["id"], ZERO)
        p = paid.get(s["id"], ZERO)
        total_charged += c
        total_paid += p
        per_school.append(
            {
                "school": str(s["id"]),
                "name": s["name"],
                "city": s["city"],
                "plan": s["plan"],
                "is_active": s["is_active"],
                "total_charged": c,
                "total_paid": p,
                "remaining": c - p,
            }
        )
    # Show the schools that owe the most first — that's the collections worklist.
    per_school.sort(key=lambda r: r["remaining"], reverse=True)

    now = timezone.localdate()

    # Month-wise collected, zero-filled across a rolling `months`-month window so
    # the chart always shows a continuous axis (a new business with one payment
    # still reads as a proper chart, not a single full-width block).
    month_map = {
        r["month"].strftime("%Y-%m"): (r["total"] or ZERO)
        for r in (
            BillingEntry.objects.filter(kind=BillingEntry.Kind.PAYMENT)
            .annotate(month=TruncMonth("occurred_on"))
            .values("month")
            .annotate(total=Sum("amount"))
        )
        if r["month"] is not None
    }
    window: list[tuple[int, int]] = []
    yy, mm = now.year, now.month
    for _ in range(months):
        window.append((yy, mm))
        mm -= 1
        if mm == 0:
            mm, yy = 12, yy - 1
    window.reverse()
    monthly = [
        {"month": f"{y:04d}-{m:02d}", "collected": month_map.get(f"{y:04d}-{m:02d}", ZERO)}
        for (y, m) in window
    ]

    # Year-wise collected, zero-filled to at least a 5-year window (and widened to
    # cover any older/future-dated payments that exist).
    year_map = {
        str(r["year"].year): (r["total"] or ZERO)
        for r in (
            BillingEntry.objects.filter(kind=BillingEntry.Kind.PAYMENT)
            .annotate(year=TruncYear("occurred_on"))
            .values("year")
            .annotate(total=Sum("amount"))
        )
        if r["year"] is not None
    }
    present_years = [int(y) for y in year_map]
    start_year = min([now.year - 4, *present_years])
    end_year = max([now.year, *present_years])
    yearly = [
        {"year": str(y), "collected": year_map.get(str(y), ZERO)}
        for y in range(start_year, end_year + 1)
    ]

    # Headline "this period" figures, keyed off the current calendar date.
    payments = BillingEntry.objects.filter(kind=BillingEntry.Kind.PAYMENT)
    collected_this_year = (
        payments.filter(occurred_on__year=now.year).aggregate(s=Sum("amount"))["s"] or ZERO
    )
    collected_this_month = (
        payments.filter(occurred_on__year=now.year, occurred_on__month=now.month)
        .aggregate(s=Sum("amount"))["s"]
        or ZERO
    )

    return {
        "totals": {
            "total_charged": total_charged,
            "total_paid": total_paid,
            "total_outstanding": total_charged - total_paid,
            "collected_this_year": collected_this_year,
            "collected_this_month": collected_this_month,
            "school_count": len(per_school),
        },
        "per_school": per_school,
        "monthly": monthly,
        "yearly": yearly,
    }
