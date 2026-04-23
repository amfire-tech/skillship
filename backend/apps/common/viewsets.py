"""
File:    backend/apps/common/viewsets.py
Purpose: Reusable DRF viewset bases that bake tenant scoping into every CRUD.
Owner:   Navanish

Why this lives in `common`:
    Every tenant-scoped resource (users, classes, courses, enrollments,
    quizzes, content, …) needs the same two guarantees:

      1. The queryset is filtered by request.school_id BEFORE the view
         ever sees it. Forgetting this is the bug that ends the contract.
      2. On create, `school_id` is stamped from request.user — never
         from request data. Otherwise a teacher could POST
         `{"school_id": "<other school>"}` and forge cross-tenant rows.

    Putting both rules in a single base class makes them impossible to
    forget. Subclasses set `queryset` + `serializer_class` and inherit
    correctness.

    MAIN_ADMIN bypasses the scope filter (they operate across all
    schools by definition).
"""

from __future__ import annotations

from rest_framework.viewsets import ModelViewSet

from .permissions import Role


class TenantScopedViewSet(ModelViewSet):
    """ModelViewSet that scopes by request.school_id and stamps school on create.

    Subclasses MUST set:
        queryset         — base queryset against the model
        serializer_class — the (de)serializer

    Subclasses MAY override:
        get_queryset()      — to add ordering, select_related, etc. — but
                              must still call super().get_queryset() so the
                              tenant filter stays applied.
        perform_create()    — to add side-effects, again calling super().
    """

    def get_queryset(self):
        qs = super().get_queryset()
        if self._user_is_main_admin():
            return qs
        # request.school_id is None for anonymous and MAIN_ADMIN; the
        # IsAuthenticated permission guards the former.
        return qs.filter(school_id=self.request.school_id)

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            # MAIN_ADMIN may explicitly target a school via the request body.
            # If they don't, the serializer's own validation will complain.
            serializer.save()
        else:
            # Everyone else has their school stamped from the JWT user —
            # never from request data. This is non-negotiable.
            serializer.save(school_id=self.request.school_id)

    # ── Internals ───────────────────────────────────────────────────────────

    def _user_is_main_admin(self) -> bool:
        user = self.request.user
        return bool(user and user.is_authenticated and user.role == Role.MAIN_ADMIN)
