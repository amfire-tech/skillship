"""
File:    backend/apps/notifications/urls.py
Purpose: URL routing for the notifications app.
Owner:   Vishal
"""

from rest_framework.routers import DefaultRouter

from .views import NotificationTemplateViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")
router.register(r"templates", NotificationTemplateViewSet, basename="notificationtemplate")

urlpatterns = router.urls
