"""
File:    backend/apps/leads/serializers.py
Purpose: DemoRequest serializers — public create (camelCase IO) + admin read.
Owner:   Navanish

The public form sends camelCase keys (schoolName, principalName, etc.) — see
frontend/src/components/request-demo/FormCard.tsx. We map to snake_case Python
fields via `source=` rather than rewriting the frontend. Same fields are
exposed back in read responses so the Main Admin UI can render the lead as-is.
"""

from __future__ import annotations

from rest_framework import serializers

from .models import DemoRequest


class DemoRequestCreateSerializer(serializers.ModelSerializer):
    """Public POST surface. Anyone can submit; we read nothing privileged off the request."""

    schoolName = serializers.CharField(source="school_name", max_length=200)
    principalName = serializers.CharField(source="principal_name", max_length=200)
    city = serializers.CharField(max_length=100)
    studentRange = serializers.ChoiceField(
        source="student_range", choices=DemoRequest.StudentRange.choices
    )
    phoneNumber = serializers.CharField(source="phone_number", max_length=30)
    emailAddress = serializers.EmailField(source="email_address")
    # school_board is genuinely optional in the form. allow_blank lets the
    # frontend submit an empty string when the user skips the field.
    schoolBoard = serializers.CharField(
        source="school_board", max_length=40, required=False, allow_blank=True
    )

    class Meta:
        model = DemoRequest
        fields = [
            "schoolName",
            "principalName",
            "city",
            "studentRange",
            "phoneNumber",
            "emailAddress",
            "schoolBoard",
        ]


class DemoRequestReadSerializer(serializers.ModelSerializer):
    """Admin-only read surface — includes status + triage metadata."""

    class Meta:
        model = DemoRequest
        fields = [
            "id",
            "school_name",
            "principal_name",
            "city",
            "student_range",
            "phone_number",
            "email_address",
            "school_board",
            "status",
            "triage_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school_name",
            "principal_name",
            "city",
            "student_range",
            "phone_number",
            "email_address",
            "school_board",
            "created_at",
            "updated_at",
        ]
