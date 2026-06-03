"""
File:    backend/apps/analytics/benchmarking.py
Purpose: Cross-class and cross-school benchmarking aggregates.
Owner:   Navanish

Two scopes:
  - level="class"  → rank every class in the caller's school by avg score over
                     the date window, with percentile + delta-vs-median.
  - level="school" → MAIN_ADMIN only; same shape but across active schools.

Source data:
  - Class level rolls up `ClassWeeklyStats` (already computed by Celery in 1.4).
  - School level rolls up the same table, grouped by school.

Why not raw answers? At benchmark time we want a stable, pre-aggregated view —
this is the read-side of the daily/weekly rebuild. Going back to `Answer` for
every dashboard hit would not scale.
"""

from __future__ import annotations

from decimal import Decimal
from statistics import median
from typing import Any

from django.db.models import Avg, Sum

from .models import ClassWeeklyStats


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def _percentile_band(rank: int, count: int) -> str:
    """Top X% bucket for the row, based on rank (1 is best)."""
    if count <= 0:
        return "n/a"
    pct = (rank - 1) / count * 100
    if pct < 10:
        return "Top 10%"
    if pct < 25:
        return "Top 25%"
    if pct < 50:
        return "Top 50%"
    if pct < 75:
        return "Bottom 50%"
    return "Bottom 25%"


def compute_class_benchmarking(*, school_id, date_range) -> dict[str, Any]:
    """Rank every class in `school_id` by avg score over the window."""
    rows = list(
        ClassWeeklyStats.objects
        .filter(
            school_id=school_id,
            week_start_date__gte=date_range.start,
            week_start_date__lte=date_range.end,
        )
        .values("klass_id", "klass__grade", "klass__section")
        .annotate(avg=Avg("avg_score"), at_risk=Sum("at_risk_count"))
    )

    enriched = []
    for r in rows:
        avg = _to_float(r["avg"]) or 0.0
        enriched.append({
            "class_id":  str(r["klass_id"]),
            "label":     f"Grade {r['klass__grade']}-{r['klass__section']}",
            "avg_score": round(avg, 2),
            "at_risk":   int(r["at_risk"] or 0),
        })

    if not enriched:
        return {"level": "class", "count": 0, "median": None, "results": []}

    enriched.sort(key=lambda x: -x["avg_score"])
    med = round(median(x["avg_score"] for x in enriched), 2)

    count = len(enriched)
    for rank, row in enumerate(enriched, start=1):
        row["rank"]         = rank
        row["percentile"]   = _percentile_band(rank, count)
        row["delta_median"] = round(row["avg_score"] - med, 2)

    return {
        "level":   "class",
        "count":   count,
        "median":  med,
        "results": enriched,
    }


def compute_school_benchmarking(*, date_range) -> dict[str, Any]:
    """Rank every active school by avg score over the window. MAIN_ADMIN only."""
    rows = list(
        ClassWeeklyStats.objects
        .filter(
            school__is_active=True,
            week_start_date__gte=date_range.start,
            week_start_date__lte=date_range.end,
        )
        .values("school_id", "school__name", "school__slug")
        .annotate(avg=Avg("avg_score"), at_risk=Sum("at_risk_count"))
    )

    enriched = []
    for r in rows:
        avg = _to_float(r["avg"]) or 0.0
        enriched.append({
            "school_id": str(r["school_id"]),
            "name":      r["school__name"],
            "slug":      r["school__slug"],
            "avg_score": round(avg, 2),
            "at_risk":   int(r["at_risk"] or 0),
        })

    if not enriched:
        return {"level": "school", "count": 0, "median": None, "results": []}

    enriched.sort(key=lambda x: -x["avg_score"])
    med = round(median(x["avg_score"] for x in enriched), 2)

    count = len(enriched)
    for rank, row in enumerate(enriched, start=1):
        row["rank"]         = rank
        row["percentile"]   = _percentile_band(rank, count)
        row["delta_median"] = round(row["avg_score"] - med, 2)

    return {
        "level":   "school",
        "count":   count,
        "median":  med,
        "results": enriched,
    }
