"""
File:    backend/apps/academics/views.py
Purpose: ViewSets for AcademicYear, Class, Course, Enrollment — all tenant-scoped.
Why:     Defines the `_TenantScopedViewSet` base pattern that other apps copy.
Owner:   Prashant
TODO:    class _TenantScopedViewSet(ModelViewSet):
           model = None
           def get_queryset(self): return self.model.objects.for_school(self.request.school_id)
           def perform_create(self, serializer): serializer.save(school_id=self.request.school_id)

         Then one ViewSet per model, setting model = AcademicYear / Class / Course / Enrollment.
"""
