"""
File:    backend/apps/ai_bridge/permissions.py
Purpose: CanUseAI — the platform owner's AI kill-switch, enforced on every AI
         endpoint so a switched-off school / teacher / student can no longer
         reach any AI feature (career pilot, quiz generation, adaptive engine,
         content search).
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework.permissions import BasePermission

from apps.common.permissions import Role


class CanUseAI(BasePermission):
    """Deny AI when the MAIN_ADMIN has switched it off for the user or their school.

    Effective rule:
        allowed  ==  user.ai_enabled  AND  school.settings.ai_enabled

    - MAIN_ADMIN (the platform owner) is never gated.
    - A missing SchoolSettings row counts as enabled (the model default is True);
      only an explicit ai_enabled=False blocks.
    - Combine with the role permission, e.g. ``[IsStudent, CanUseAI]`` — both must
      pass, so this never widens access, it only narrows it.
    """

    message = "AI access has been disabled for this account by the administrator."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        # The owner is never locked out of their own platform's AI.
        if user.role == Role.MAIN_ADMIN:
            return True
        # Per-user switch (teacher / student).
        if not getattr(user, "ai_enabled", True):
            return False
        # School-wide switch (SchoolSettings.ai_enabled).
        if user.school_id:
            from apps.schools.models import SchoolSettings

            enabled = (
                SchoolSettings.objects
                .filter(school_id=user.school_id)
                .values_list("ai_enabled", flat=True)
                .first()
            )
            if enabled is False:
                return False
        return True
