"""
File:    backend/apps/notifications/serializers.py
Purpose: DRF serializers for Notification (list/mark-as-read) + NotificationTemplate.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import serializers

from .models import Notification, NotificationTemplate


class NotificationSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    recipient = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Notification
        fields = [
            "id", "school", "recipient",
            "channel", "title", "body", "data_json",
            "status", "sent_at", "read_at",
            "created_at", "updated_at",
        ]
        read_only_fields = fields


class NotificationTemplateSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = NotificationTemplate
        fields = [
            "id", "school", "code", "channel",
            "subject", "body_template", "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]
