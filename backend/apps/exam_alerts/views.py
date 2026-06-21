"""
File:    backend/apps/exam_alerts/views.py
Purpose: ViewSet for ExamAlert — staff create/manage, students read their class's.
Owner:   Navanish

Surface:
  GET    /api/v1/exam-alerts/            list (role-scoped — see get_queryset)
  POST   /api/v1/exam-alerts/            create (TEACHER / PRINCIPAL / SUB_ADMIN / MAIN_ADMIN)
  GET    /api/v1/exam-alerts/{id}/       retrieve
  PATCH  /api/v1/exam-alerts/{id}/       update (staff)
  DELETE /api/v1/exam-alerts/{id}/       delete (staff)
"""

from __future__ import annotations

from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import Role
from apps.common.viewsets import TenantScopedViewSet

from .models import ExamAlert
from .serializers import ExamAlertSerializer

_STAFF_ROLES = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}


class ExamAlertViewSet(TenantScopedViewSet):
    """Tenant-scoped exam alerts.

    - STUDENT  → alerts for classes they are currently enrolled in (read-only).
    - TEACHER  → alerts they created OR for classes they are the class teacher of.
    - PRINCIPAL / SUB_ADMIN → every alert in their school.
    - MAIN_ADMIN → all schools (TenantScopedViewSet bypasses the scope filter).

    Writes are staff-only; the role gate lives in perform_create/update/destroy
    so a student POST returns a clean 403 rather than silently creating a row.
    """

    queryset = ExamAlert.objects.select_related(
        "klass", "klass__academic_year", "created_by"
    ).all()
    serializer_class = ExamAlertSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "head", "options", "post", "patch", "delete"]
    lookup_field = "id"

    def get_queryset(self):
        u = self.request.user
        qs = super().get_queryset()  # school-scoped (all for MAIN_ADMIN)

        if u.role == Role.STUDENT:
            from apps.academics.models import Enrollment

            klass_ids = list(
                Enrollment.objects.filter(
                    school_id=u.school_id, student_id=u.id, withdrawn_on__isnull=True
                ).values_list("klass_id", flat=True)
            )
            return qs.filter(klass_id__in=klass_ids)

        if u.role == Role.TEACHER:
            return qs.filter(Q(created_by_id=u.id) | Q(klass__class_teacher_id=u.id))

        return qs

    # ── Writes (staff only) ──────────────────────────────────────────────────

    def _assert_staff(self):
        if self.request.user.role not in _STAFF_ROLES:
            raise PermissionDenied("Only staff can manage exam alerts.")

    def _target_school_id(self):
        if self._user_is_main_admin():
            return self.request.data.get("school")
        # Acting school — own school, or a Skillship teacher's selected,
        # actively-assigned X-School-Context school. Refuse if none is set.
        from apps.common.tenancy import require_school_id

        return require_school_id(self.request)

    def perform_create(self, serializer):
        self._assert_staff()
        target_school_id = self._target_school_id()
        klass = serializer.validated_data.get("klass")
        if klass is not None and str(klass.school_id) != str(target_school_id):
            raise ValidationError({"klass": "Class must belong to your school."})
        serializer.save(school_id=target_school_id, created_by=self.request.user)

    def perform_update(self, serializer):
        self._assert_staff()
        klass = serializer.validated_data.get("klass")
        if klass is not None and str(klass.school_id) != str(serializer.instance.school_id):
            raise ValidationError({"klass": "Class must belong to your school."})
        serializer.save()

    def perform_destroy(self, instance):
        self._assert_staff()
        instance.delete()
