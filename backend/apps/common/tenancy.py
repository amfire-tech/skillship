"""
File:    backend/apps/common/tenancy.py
Purpose: resolve_school_id() — the single source of truth for "which school is
         this request acting in", used by both TenantMiddleware (request.school_id)
         and TenantScopedViewSet (the ORM filter). Centralising it keeps the
         Skillship-teacher cross-school rule in ONE audited place.
Owner:   Navanish

The rule:
  - MAIN_ADMIN              → None (operates across all schools; not auto-scoped).
  - Skillship teacher       → the school named in the `X-School-Context` request
                              header, but ONLY if they have an ACTIVE
                              SkillshipAssignment to it. No/invalid header → None
                              (they see nothing — never another school's data).
  - SUB_ADMIN               → the school named in the `X-School-Context` header,
                              but ONLY if they have an ACTIVE SubAdminGrant to it.
                              Same roaming rule as a Skillship teacher: one school
                              per request, never an ungranted one. No/invalid
                              header → None.
  - Everyone else           → their own user.school_id.

A roaming actor (Skillship teacher or sub-admin) therefore acts in exactly ONE
school per request, and never one they aren't actively granted. Revoking the
grant (is_active=False) cuts access on the very next request.
"""

from __future__ import annotations

from .permissions import Role

SCHOOL_CONTEXT_HEADER = "X-School-Context"


def _skillship_context_school_id(request, user):
    """The header-named school IFF the Skillship teacher has an active grant."""
    # request.headers is available on the raw Django request throughout the
    # lifecycle (unlike DRF's request.query_params), so this works from the
    # middleware's lazy resolver too.
    school_id = request.headers.get(SCHOOL_CONTEXT_HEADER)
    if not school_id:
        return None
    # Imported lazily to avoid an app-loading cycle (common ← assignments ← …).
    from apps.assignments.models import SkillshipAssignment

    ok = SkillshipAssignment.objects.filter(
        teacher_id=user.id, school_id=school_id, is_active=True
    ).exists()
    return school_id if ok else None


def _subadmin_context_school_id(request, user):
    """The header-named school IFF the sub-admin has an active grant for it."""
    school_id = request.headers.get(SCHOOL_CONTEXT_HEADER)
    if not school_id:
        return None
    # Lazy import to avoid the common ← assignments app-loading cycle.
    from apps.assignments.access import has_active_grant

    return school_id if has_active_grant(user, school_id) else None


def resolve_school_id(request):
    """Return the concrete school UUID (str) this request acts in, or None.

    Returns a raw value (never a SimpleLazyObject) so it can be handed straight
    to the ORM as a filter kwarg.
    """
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    if user.role == Role.MAIN_ADMIN:
        return None
    if getattr(user, "is_skillship_teacher", False):
        return _skillship_context_school_id(request, user)
    if user.role == Role.SUB_ADMIN:
        return _subadmin_context_school_id(request, user)
    return user.school_id


def require_school_id(request):
    """The concrete acting school for a WRITE/staff endpoint, or raise 403.

    Use this anywhere that previously read `request.user.school_id` to stamp or
    gate a row: for a Skillship teacher that attribute is None, which would
    create a null-tenant row or silently match the wrong scope. Refusing is the
    safe default — the teacher must select an actively-assigned school first.
    """
    school_id = resolve_school_id(request)
    if school_id is None:
        from rest_framework.exceptions import PermissionDenied

        raise PermissionDenied(
            "No active school context. Select an assigned school first "
            "(send the X-School-Context header)."
        )
    return school_id
