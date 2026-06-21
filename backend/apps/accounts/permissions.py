"""
File:    backend/apps/accounts/permissions.py
Purpose: Permission classes specific to /api/v1/users/ user-management endpoints.
Owner:   Prashant

Policy decision (2026-05-28):
    Only MAIN_ADMIN (platform "super admin") may create, update, list, or
    delete user accounts. Principals, sub-admins, teachers, and students
    have NO write access to the user-management surface — they can only
    log in and edit their own profile through their dashboard, not other
    people's. This is enforced server-side here AND mirrored in the
    frontend admin/users UI (which is only routed under /dashboard/admin/).

Why locked to MAIN_ADMIN only:
    The product brief calls for a single platform owner controlling
    onboarding. Letting a principal create more principals / sub-admins
    inside their school is a privilege-escalation footgun (a principal
    could create another MAIN_ADMIN-shaped row through any future hole
    in the serializer). Locking it to MAIN_ADMIN gives us one auditable
    person who creates every account, end of story.

Two layers in one class because they always travel together:

  Surface (`has_permission`)
      The actor must be MAIN_ADMIN. Anyone else gets 403 before any
      view code runs.

  Object (`has_object_permission`)
      MAIN_ADMIN may act on any user. (Other roles never reach here
      because `has_permission` already returned False — kept as a
      defensive line in case the surface gate is ever loosened.)
"""

from __future__ import annotations

from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.common.permissions import Role


class CanManageUsers(BasePermission):
    """Hard gate: only MAIN_ADMIN may touch the /api/v1/users/ surface."""

    SURFACE_ROLES = {Role.MAIN_ADMIN}

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in self.SURFACE_ROLES)

    def has_object_permission(self, request, view, obj):
        actor = request.user
        # Only MAIN_ADMIN ever reaches an object-level check thanks to
        # has_permission(), but we still spell it out so anyone reading
        # this class sees the policy in one place.
        return actor.role == Role.MAIN_ADMIN


class CanManageUsersOrOnboard(BasePermission):
    """User-management surface with delegated, onboarding-only sub-admin access.

    MAIN_ADMIN keeps full CRUD. A SUB_ADMIN is allowed ONLY to read their granted
    schools' users and run the onboarding actions (onboard-class,
    generate-credentials, assign-teacher) — never to create/update/delete
    accounts directly, set passwords, create principals/admins, or bulk-upload.
    The per-school capability (can_onboard_students / can_onboard_teachers) is
    enforced inside each action against the acting X-School-Context school.
    """

    # Read + onboarding actions a granted sub-admin may reach. Everything else
    # on the viewset (create/update/partial_update/destroy/set_password/
    # bulk_upload) stays MAIN_ADMIN-only.
    SUBADMIN_ACTIONS = frozenset({
        "list", "retrieve",
        "onboard_class", "generate_credentials", "assign_teacher",
        "student_stats", "student_ids",
    })

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if u.role == Role.MAIN_ADMIN:
            return True
        if u.role == Role.SUB_ADMIN:
            return getattr(view, "action", None) in self.SUBADMIN_ACTIONS
        return False

    def has_object_permission(self, request, view, obj):
        u = request.user
        if u.role == Role.MAIN_ADMIN:
            return True
        # A sub-admin only ever reaches an object check on a safe (read) method;
        # the target must live in one of their granted schools.
        if u.role == Role.SUB_ADMIN and request.method in SAFE_METHODS:
            from apps.assignments.access import has_active_grant

            return has_active_grant(u, getattr(obj, "school_id", None))
        return False
