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
                        |  course;  TEACHER+ sees all statuses. | MAIN_ADMIN/SUB_ADMIN may publish.
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
_REVIEW_ROLES = {Role.SUB_ADMIN}   # Only MAIN_ADMIN and (grant-gated) SUB_ADMIN can publish.
_STAFF_ROLES  = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN}


def _is_main_admin(user) -> bool:
    return bool(user and user.is_authenticated and user.role == Role.MAIN_ADMIN)


def _same_school(request, obj) -> bool:
    if _is_main_admin(request.user):
        return True
    # The actor's *acting* school: own school for normal staff/students, or the
    # validated X-School-Context school for a roaming actor (Skillship teacher /
    # sub-admin). Using the resolver keeps every roaming role honest in one place.
    # Compare as strings — the resolver yields a str (header value) while
    # obj.school_id is a UUID, and `UUID == str` is always False.
    from apps.common.tenancy import resolve_school_id

    acting = resolve_school_id(request)
    return acting is not None and str(getattr(obj, "school_id", None)) == str(acting)


def _surface_ok(user) -> bool:
    """Staff surface check that tolerates a roaming actor with no home school.

    A SUB_ADMIN is school-less (school_id is None) and reaches a school only via
    an active grant resolved per request — so we let them past the surface and
    enforce the concrete grant downstream (resolver on writes, _same_school +
    capability on objects).

    A Skillship TEACHER also has school_id=None; they declare their acting school
    via X-School-Context. The _same_school object check (which calls
    resolve_school_id) enforces the concrete school — so letting them past the
    surface here is safe.
    """
    if user.role in {Role.SUB_ADMIN, Role.TEACHER}:
        return True
    return user.school_id is not None


# ── Authoring (banks + questions + quiz drafts) ─────────────────────────────


class CanAuthorContent(BasePermission):
    """TEACHER / PRINCIPAL / SUB_ADMIN can author. STUDENT cannot."""

    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        if _is_main_admin(u):
            return True
        return u.role in _AUTHOR_ROLES and _surface_ok(u)

    def has_object_permission(self, request, view, obj):
        return _same_school(request, obj)


# ── Quiz publishing ─────────────────────────────────────────────────────────


class CanPublishQuiz(BasePermission):
    """Only MAIN_ADMIN / SUB_ADMIN (with can_approve_quizzes grant) can move REVIEW → PUBLISHED.

    TEACHER and PRINCIPAL can submit-for-review but cannot publish — only the
    super-admin or a delegated sub-admin may approve a quiz.
    """

    def has_permission(self, request, view):
        u = request.user
        if _is_main_admin(u):
            return True
        return bool(
            u and u.is_authenticated
            and u.role in _REVIEW_ROLES
            and _surface_ok(u)
        )

    def has_object_permission(self, request, view, obj):
        if not _same_school(request, obj):
            return False
        # A sub-admin may approve/return a quiz only in a school where the
        # super-admin switched on can_approve_quizzes. PRINCIPAL/MAIN_ADMIN are
        # unrestricted here — both they and the sub-admin can act ("both can
        # approve"), and the resulting status stays visible to the super-admin.
        if request.user.role == Role.SUB_ADMIN:
            from apps.assignments.access import subadmin_can

            return subadmin_can(request.user, obj.school_id, "can_approve_quizzes")
        return True


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
            and _surface_ok(u)
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
