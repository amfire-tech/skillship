"""
File:    backend/apps/common/viewsets.py
Purpose: Reusable DRF viewset bases that bake tenant scoping into every CRUD.
Owner:   Navanish

Why this lives in `common`:
    Every tenant-scoped resource (users, classes, courses, enrollments,
    quizzes, content, …) needs the same two guarantees:

      1. The queryset is filtered by the actor's school_id BEFORE the
         view ever sees it. Forgetting this is the bug that ends the
         contract.
      2. On create, `school_id` is stamped from request.user — never
         from request data. Otherwise a teacher could POST
         `{"school_id": "<other school>"}` and forge cross-tenant rows.

    MAIN_ADMIN bypasses the scope filter (they operate across all
    schools by definition).

Why we read `request.user.school_id` and NOT `request.school_id`:
    `request.school_id` is set by TenantMiddleware via SimpleLazyObject
    so it correctly reflects DRF's lazy JWT auth — but a SimpleLazyObject
    isn't auto-resolved when handed straight to the ORM as a kwarg
    (psycopg can't adapt it). Reading the user attribute returns the raw
    UUID, which the ORM and Django filter machinery handle natively.
    request.school_id stays useful for permission classes / templates
    where attribute access does the resolution for us.
"""

from __future__ import annotations

from rest_framework.viewsets import ModelViewSet

from .permissions import Role


class TenantScopedViewSet(ModelViewSet):
    """ModelViewSet that scopes by the actor's school and stamps it on create.

    Subclasses MUST set:
        queryset         — base queryset against the model
        serializer_class — the (de)serializer

    Subclasses MAY override:
        get_queryset()   — to add ordering, select_related, etc. — but must
                           still call super().get_queryset() so the tenant
                           filter stays applied.
        perform_create() — to add side-effects, again calling super().
    """

    def get_queryset(self):
        qs = super().get_queryset()
        if self._user_is_main_admin():
            return qs
        return qs.filter(school_id=self.request.user.school_id)

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            # `school` is read_only in every serializer so it never lands in
            # validated_data. For MAIN_ADMIN we must stamp it explicitly from
            # the request body (validation already confirmed it exists).
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id)
        else:
            # Everyone else has their school stamped from the JWT user —
            # never from request data. This is non-negotiable.
            serializer.save(school_id=self.request.user.school_id)

    # ── Internals ───────────────────────────────────────────────────────────

    def _user_is_main_admin(self) -> bool:
        user = self.request.user
        return bool(user and user.is_authenticated and user.role == Role.MAIN_ADMIN)
