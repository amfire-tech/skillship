"""
File:    backend/apps/quizzes/permissions.py
Purpose: DRF permission classes for the quizzes surface.
Owner:   Navanish

The matrix we enforce:

  Resource              | Read                                  | Write
  ----------------------|---------------------------------------|----------------------------------
  QuestionBank          | TEACHER+ in same school               | TEACHER, PRINCIPAL, SUB_ADMIN
  Question              | TEACHER+ in same school (with answers)| TEACHER, PRINCIPAL, SUB_ADMIN
                        | STUDENT (without correct answers — at | (no student writes)
                        |  attempt time only, via QuizAttempt)  |
  Quiz                  | STUDENT only sees PUBLISHED in their  | TEACHER creates DRAFT.
                        |  course;  TEACHER+ sees all statuses. | PRINCIPAL/SUB_ADMIN may publish.
  QuizAttempt           | Owner student; TEACHER+ for their     | Owner student (start/answer/submit).
                        |  course's quizzes.                    |
  Answer                | Through QuizAttempt only              | Through QuizAttempt only

MAIN_ADMIN bypasses every check (cross-tenant by definition).

Object-level checks against `school_id` are deliberately redundant with
TenantScopedViewSet — defense in depth is the rule for tenant isolation.
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.common.permissions import Role


_AUTHOR_ROLES = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN}
_REVIEW_ROLES = {Role.PRINCIPAL, Role.SUB_ADMIN}
_STAFF_ROLES  = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN}


def _is_main_admin(user) -> bool:
    return bool(user and user.is_authenticated and user.role == Role.MAIN_ADMIN)


def _same_school(request, obj) -> bool:
    if _is_main_admin(request.user):
        return True
    return getattr(obj, "school_id", None) == request.user.school_id


# ── Authoring (banks + questions + quiz drafts) ─────────────────────────────


class CanAuthorContent(BasePermission):
    """TEACHER / PRINCIPAL / SUB_ADMIN can author. STUDENT cannot."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if _is_main_admin(u):
            return True
        return u.role in _AUTHOR_ROLES and u.school_id is not None

    def has_object_permission(self, request, view, obj):
        return _same_school(request, obj)


# ── Quiz publishing ─────────────────────────────────────────────────────────


class CanPublishQuiz(BasePermission):
    """Only PRINCIPAL / SUB_ADMIN can move REVIEW → PUBLISHED.

    TEACHER can submit-for-review, but cannot self-publish — the review gate
    is the whole point of the workflow.
    """

    def has_permission(self, request, view):
        u = request.user
        if _is_main_admin(u):
            return True
        return bool(
            u and u.is_authenticated
            and u.role in _REVIEW_ROLES
            and u.school_id is not None
        )

    def has_object_permission(self, request, view, obj):
        return _same_school(request, obj)


# ── Quiz read access (combines staff + student-published-only) ─────────────


class CanReadQuiz(BasePermission):
    """STAFF read all statuses in their school; STUDENT reads only PUBLISHED.

    The status filter for STUDENT is applied in the viewset's get_queryset —
    this class only gates "may you touch the surface at all".
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated
            and u.role in (_STAFF_ROLES | {Role.STUDENT, Role.MAIN_ADMIN})
        )

    def has_object_permission(self, request, view, obj):
        if not _same_school(request, obj):
            return False
        if request.user.role == Role.STUDENT:
            return obj.status == "PUBLISHED"
        return True


# ── Quiz-taking (students) ──────────────────────────────────────────────────


class CanTakeQuiz(BasePermission):
    """A STUDENT taking a quiz; or staff viewing attempts in their school."""

    def has_permission(self, request, view):
        u = request.user
        if _is_main_admin(u):
            return True
        return bool(
            u and u.is_authenticated
            and u.role in (_STAFF_ROLES | {Role.STUDENT})
            and u.school_id is not None
        )

    def has_object_permission(self, request, view, obj):
        # `obj` is a QuizAttempt; it belongs to one student in one school.
        if not _same_school(request, obj):
            return False
        u = request.user
        if u.role == Role.STUDENT:
            return obj.student_id == u.id
        # Staff may view (read-only) attempts in their school.
        return True
