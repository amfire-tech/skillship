"""
File:    backend/apps/content/views.py
Purpose: ViewSets for ContentItem (tenant-scoped) and MarketplaceListing (public, read-only for students).
Owner:   Vishal
TODO:    - ContentItemViewSet uses _TenantScopedViewSet pattern
         - MarketplaceListingViewSet: ReadOnlyModelViewSet, AllowAny, filter is_active=True
         - @action purchase on marketplace → calls services.purchase_listing
"""
