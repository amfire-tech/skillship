"""
TenantMiddleware — exposes request.school_id on every request.

Why this is a SimpleLazyObject and not a plain attribute:
    Django's AuthenticationMiddleware populates `request.user` (cookie-session
    auth) eagerly. DRF's JWT authentication populates it *lazily*, inside the
    view's dispatch — after every Django middleware has already run. If we
    read request.user during __call__ and stash a plain `request.school_id`,
    we capture an AnonymousUser for every JWT-authed request and bake in
    `school_id = None` forever, even after DRF replaces request.user with
    the real principal/teacher/etc.

    Wrapping in SimpleLazyObject defers the lookup until first access. By
    that time we are inside the view body, DRF has authenticated, and
    request.user is the real user.

Views and managers can therefore use request.school_id with confidence —
it is the *current* request.user's school_id at the moment of access.
"""

from __future__ import annotations

from django.utils.functional import SimpleLazyObject

from .tenancy import resolve_school_id


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Single source of truth (apps.common.tenancy): MAIN_ADMIN → None,
        # Skillship teacher → header-named school IF actively assigned, everyone
        # else → own school. Lazy so it reads the DRF-authenticated user.
        request.school_id = SimpleLazyObject(lambda: resolve_school_id(request))
        return self.get_response(request)
