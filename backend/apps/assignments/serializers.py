"""
File:    backend/apps/assignments/serializers.py
Purpose: Serializer for SkillshipAssignment (MAIN_ADMIN manages these).
Owner:   Navanish
"""

from __future__ import annotations

from rest_framework import serializers

from apps.academics.models import Class
from apps.accounts.models import User
from apps.schools.models import School

from .models import DailyTeachingLog, SkillshipAssignment, SubAdminGrant


class DailyTeachingLogSerializer(serializers.ModelSerializer):
    """One daily teaching log (full — includes the proof photo). `teacher`,
    `school` and the names are read-only — the viewset stamps teacher
    (request.user) and school (acting context) so a teacher can never forge
    another teacher's / school's log. The teacher MAY submit `photo` (a base64
    data-URL) + `latitude`/`longitude` as attendance proof. Used for
    create/retrieve; lists use the lighter serializer below."""

    id = serializers.UUIDField(read_only=True)
    teacher_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    has_photo = serializers.SerializerMethodField()

    class Meta:
        model = DailyTeachingLog
        fields = [
            "id",
            "teacher", "teacher_name",
            "school", "school_name",
            "date", "subject", "description",
            "photo", "has_photo", "latitude", "longitude",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "teacher", "school", "created_at", "updated_at"]

    def get_teacher_name(self, obj) -> str:
        t = obj.teacher
        return (t.get_full_name() or t.username) if t else ""

    def get_school_name(self, obj) -> str:
        return obj.school.name if obj.school_id else ""

    def get_has_photo(self, obj) -> bool:
        return bool(obj.photo)

    def validate_subject(self, value):
        if not value.strip():
            raise serializers.ValidationError("Subject is required.")
        return value.strip()

    def validate_description(self, value):
        if not value.strip():
            raise serializers.ValidationError("Description is required.")
        return value

    def validate_photo(self, value):
        # Keep proof photos sane — a data-URL over ~3 MB is almost certainly an
        # un-resized capture; the client downscales, so reject the outliers.
        if value and len(value) > 4_000_000:
            raise serializers.ValidationError("Photo is too large — please retry (it should auto-compress).")
        return value


class DailyTeachingLogListSerializer(DailyTeachingLogSerializer):
    """List view — everything except the heavy base64 `photo` blob (so a
    super-admin can scroll hundreds of logs cheaply). `has_photo` + the GPS
    coords still come through, and the full photo is on the detail endpoint."""

    class Meta(DailyTeachingLogSerializer.Meta):
        fields = [f for f in DailyTeachingLogSerializer.Meta.fields if f != "photo"]


class SubAdminGrantSerializer(serializers.ModelSerializer):
    """One per-school capability grant for a sub-admin (MAIN_ADMIN manages these)."""

    id = serializers.UUIDField(read_only=True)
    subadmin = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.SUB_ADMIN),
        pk_field=serializers.UUIDField(),
    )
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), pk_field=serializers.UUIDField()
    )
    subadmin_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()

    class Meta:
        model = SubAdminGrant
        fields = [
            "id",
            "subadmin", "subadmin_name",
            "school", "school_name",
            "can_manage_school", "can_onboard_students",
            "can_onboard_teachers", "can_approve_quizzes",
            "is_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        # Drop the auto UniqueTogetherValidator on (subadmin, school): the viewset
        # POST intentionally UPSERTS that pair, so the unique check must not 400.
        validators: list = []

    def get_subadmin_name(self, obj) -> str:
        u = obj.subadmin
        return (u.get_full_name() or u.username) if u else ""

    def get_school_name(self, obj) -> str:
        return obj.school.name if obj.school_id else ""


class SkillshipAssignmentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TEACHER, teacher_type=User.TeacherType.SKILLSHIP),
        pk_field=serializers.UUIDField(),
    )
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), pk_field=serializers.UUIDField()
    )
    klass = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), pk_field=serializers.UUIDField(),
        required=False, allow_null=True,
    )
    teacher_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    klass_label = serializers.SerializerMethodField()

    class Meta:
        model = SkillshipAssignment
        fields = [
            "id",
            "teacher", "teacher_name",
            "school", "school_name",
            "klass", "klass_label",
            "is_active",
            "date_from", "date_to", "weekdays", "specific_dates", "note",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_teacher_name(self, obj) -> str:
        t = obj.teacher
        return (t.get_full_name() or t.username) if t else ""

    def get_school_name(self, obj) -> str:
        return obj.school.name if obj.school_id else ""

    def get_klass_label(self, obj) -> str:
        k = obj.klass
        return f"Grade {k.grade}-{k.section}" if k else ""

    def validate_teacher(self, value):
        if not value.is_skillship_teacher:
            raise serializers.ValidationError("Only Skillship teachers can be assigned to schools.")
        return value

    def validate(self, attrs):
        # A chosen class must belong to the chosen school.
        klass = attrs.get("klass", getattr(self.instance, "klass", None))
        school = attrs.get("school", getattr(self.instance, "school", None))
        if klass is not None and school is not None and klass.school_id != school.id:
            raise serializers.ValidationError(
                {"klass": "Class must belong to the selected school."}
            )
        return attrs
