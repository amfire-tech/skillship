"""
File:    backend/apps/notifications/urls.py
Purpose: URL routing for the notifications app.
Owner:   Vishal
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminAlertView,
    NotificationTemplateViewSet,
    NotificationViewSet,
    PushPublicKeyView,
    PushSubscribeView,
    PushUnsubscribeView,
)

router = DefaultRouter()
router.register(r"templates", NotificationTemplateViewSet, basename="notificationtemplate")
# Register the catch-all "" viewset LAST so its /{pk}/ detail route doesn't
# shadow the explicit admin/ and push/ paths below.
router.register(r"", NotificationViewSet, basename="notification")

urlpatterns = [
    path("admin/send/", AdminAlertView.as_view(), name="admin-alert-send"),
    path("push/public-key/", PushPublicKeyView.as_view(), name="push-public-key"),
    path("push/subscribe/", PushSubscribeView.as_view(), name="push-subscribe"),
    path("push/unsubscribe/", PushUnsubscribeView.as_view(), name="push-unsubscribe"),
    path("", include(router.urls)),
]
