"""
File:    backend/apps/exam_alerts/urls.py
Purpose: URL routing for exam alerts. Mounted at /api/v1/exam-alerts/.
Owner:   Navanish
"""

from rest_framework.routers import DefaultRouter

from .views import ExamAlertViewSet

router = DefaultRouter()
router.register(r"", ExamAlertViewSet, basename="exam-alert")

urlpatterns = router.urls
