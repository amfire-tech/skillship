"""
File:    backend/apps/assignments/access.py
Purpose: Capability lookups for SubAdminGrant. One place that answers
         "may this sub-admin do <capability> in <school>?" so views and
         permission classes never re-implement the grant query (and never
         leak by forgetting is_active).
Owner:   Navanish

These helpers live in `assignments` (next to the model) and are imported
lazily by apps.common.tenancy to avoid the common ← assignments app cycle.
"""

from __future__ import annotations

from .models import SubAdminGrant


def active_school_ids(user) -> list[str]:
    """Every school the sub-admin currently has an ACTIVE grant for (any caps)."""
    if not _is_subadmin(user):
        return []
    return [
        str(s)
        for s in SubAdminGrant.objects.filter(
            subadmin_id=user.id, is_active=True
        ).values_list("school_id", flat=True)
    ]


def has_active_grant(user, school_id) -> bool:
    """True if the sub-admin has ANY active grant for this school."""
    if not (_is_subadmin(user) and school_id):
        return False
    return SubAdminGrant.objects.filter(
        subadmin_id=user.id, school_id=school_id, is_active=True
    ).exists()


def subadmin_can(user, school_id, capability: str) -> bool:
    """True if the sub-admin has `capability` switched on for `school_id` via an
    active grant. `capability` must be one of SubAdminGrant.CAPABILITIES."""
    if not (_is_subadmin(user) and school_id):
        return False
    if capability not in SubAdminGrant.CAPABILITIES:
        raise ValueError(f"Unknown sub-admin capability: {capability!r}")
    return SubAdminGrant.objects.filter(
        **{
            "subadmin_id": user.id,
            "school_id": school_id,
            "is_active": True,
            capability: True,
        }
    ).exists()


def _is_subadmin(user) -> bool:
    return bool(
        user and getattr(user, "is_authenticated", False) and user.role == "SUB_ADMIN"
    )
