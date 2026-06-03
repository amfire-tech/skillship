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

from rest_framework.permissions import BasePermission

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
