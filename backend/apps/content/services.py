"""
File:    backend/apps/content/services.py
Purpose: ContentItem creation + marketplace purchase flow.
Owner:   Vishal
"""

from __future__ import annotations

from django.db import transaction

from .models import ContentItem, MarketplaceListing


def create_content_item(
    school_id,
    course,
    uploaded_by,
    title: str,
    kind: str,
    file_url: str,
    description: str = "",
    klass=None,
    duration_seconds: int = 0,
) -> ContentItem:
    """Create a ContentItem record after the file has been uploaded to object storage."""
    return ContentItem.objects.create(
        school_id=school_id,
        course=course,
        klass=klass,
        uploaded_by=uploaded_by,
        title=title,
        description=description,
        kind=kind,
        file_url=file_url,
        duration_seconds=duration_seconds,
    )


@transaction.atomic
def purchase_listing(listing: MarketplaceListing, buyer_school_id, buyer_user) -> ContentItem:
    """Copy a marketplace listing into the buyer's tenant as a ContentItem.

    The buyer's school must have an active course to attach the item to.
    For now we attach it to any course in the buyer's school — caller should
    pass a specific course via a future `course_id` arg once the UI supports it.
    """
    from apps.academics.models import Course

    course = Course.objects.filter(school_id=buyer_school_id).first()
    if course is None:
        from rest_framework.exceptions import ValidationError
        raise ValidationError(
            "No courses exist in this school yet. Create a course before purchasing content."
        )

    return ContentItem.objects.create(
        school_id=buyer_school_id,
        course=course,
        uploaded_by=buyer_user,
        title=listing.title,
        description=listing.description,
        kind=listing.kind,
        file_url=listing.file_url,
    )
