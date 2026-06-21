"""
Shared DRF permission classes for role-based access and tenant isolation.

Usage in views:
    permission_classes = [IsAuthenticated, IsSameSchool, IsTeacher]
"""

from rest_framework.permissions import BasePermission


class Role:
    """String constants matching User.Role choices — use these in permission checks."""

    MAIN_ADMIN = "MAIN_ADMIN"
    SUB_ADMIN = "SUB_ADMIN"
    PRINCIPAL = "PRINCIPAL"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"


# ── Single-role checks ────────────────────────────────────────────────────────


class IsMainAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.MAIN_ADMIN


class IsSubAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.SUB_ADMIN


class IsPrincipal(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.PRINCIPAL


class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.TEACHER


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.STUDENT


# ── Composite checks ─────────────────────────────────────────────────────────


class IsSchoolStaff(BasePermission):
    """Any authenticated user who belongs to a school and has a staff-level role."""

    STAFF_ROLES = {Role.SUB_ADMIN, Role.PRINCIPAL, Role.TEACHER}

    def has_permission(self, request, view):
        # The *acting* school: own school for normal staff, or a Skillship
        # teacher's selected (actively-assigned) school. resolve_school_id
        # returns the concrete value (request.school_id is a lazy proxy that is
        # never `None` by identity), so a Skillship teacher passes once they've
        # picked an assigned school and is blocked otherwise.
        from .tenancy import resolve_school_id

        return (
            request.user.is_authenticated
            and request.user.role in self.STAFF_ROLES
            and resolve_school_id(request) is not None
        )


class IsSameSchool(BasePermission):
    """
    Object-level permission: the object's school must match the requester's school.
    MAIN_ADMIN bypasses this check (they can see any school's data).
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.MAIN_ADMIN:
            return True
        return getattr(obj, "school_id", None) == request.school_id
