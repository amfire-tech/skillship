"""
File:    backend/apps/content/views.py
Purpose: ViewSets for ContentItem (tenant-scoped) and MarketplaceListing (public catalog).
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.common.permissions import IsSchoolStaff, IsTeacher
from apps.common.viewsets import TenantScopedViewSet

from .models import ContentItem, MarketplaceListing
from .serializers import ContentItemSerializer, MarketplaceListingSerializer


class ContentItemViewSet(TenantScopedViewSet):
    serializer_class = ContentItemSerializer
    queryset = ContentItem.objects.select_related("course", "klass", "uploaded_by")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsSchoolStaff()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, uploaded_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, uploaded_by=self.request.user)


class MarketplaceListingViewSet(ReadOnlyModelViewSet):
    """Public catalog — visible to anyone authenticated, not tenant-scoped."""

    serializer_class = MarketplaceListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MarketplaceListing.objects.filter(is_active=True).select_related("author_school")

    @action(detail=True, methods=["post"], url_path="purchase", permission_classes=[IsAuthenticated])
    def purchase(self, request, pk=None):
        from .services import purchase_listing
        from .serializers import ContentItemSerializer as CISerializer

        listing = self.get_object()
        content_item = purchase_listing(
            listing=listing,
            buyer_school_id=request.user.school_id,
            buyer_user=request.user,
        )
        return Response(CISerializer(content_item).data, status=status.HTTP_201_CREATED)
