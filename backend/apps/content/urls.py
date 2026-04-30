"""
File:    backend/apps/content/urls.py
Purpose: URL routing for the content app.
Owner:   Vishal
"""

from rest_framework.routers import DefaultRouter

from .views import ContentItemViewSet, MarketplaceListingViewSet

router = DefaultRouter()
router.register(r"items", ContentItemViewSet, basename="contentitem")
router.register(r"marketplace", MarketplaceListingViewSet, basename="marketplacelisting")

urlpatterns = router.urls
