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
def purchase_listing(
    listing: MarketplaceListing,
    buyer_school_id,
    buyer_user,
    course_id=None,
) -> ContentItem:
    """Copy a marketplace listing into the buyer's tenant as a ContentItem.

    If `course_id` is provided it must belong to the buyer's school. If omitted,
    the first course in the school is used as a fallback so the UI can still
    work before course-pickers are wired everywhere.
    """
    from apps.academics.models import Course
    from rest_framework.exceptions import ValidationError

    if buyer_school_id is None:
        raise ValidationError(
            "Marketplace purchase requires a school-scoped account. "
            "Platform admins (MAIN_ADMIN) cannot buy content."
        )

    if course_id is not None:
        course = Course.objects.filter(school_id=buyer_school_id, id=course_id).first()
        if course is None:
            raise ValidationError("course_id is not a course in your school.")
    else:
        course = Course.objects.filter(school_id=buyer_school_id).first()
        if course is None:
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
