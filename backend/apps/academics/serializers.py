"""
File:    backend/apps/academics/serializers.py
Purpose: DRF serializers for AcademicYear, Class, Course, Enrollment + bulk CSV.
Owner:   Prashant

Cross-tenant safety in serializers:
    Even though the viewset stamps `school_id` on create, a malicious or
    confused client can still pass FK ids that belong to a *different*
    school (e.g. PRINCIPAL of school A submitting an academic_year_id from
    school B). The serializer must validate that every referenced FK is in
    the same school as the row being created — otherwise we'd quietly
    create cross-tenant rows that look fine but leak data on every join.

    `_validate_same_school(target_school_id, fk_obj, "field_name")` is the
    helper every serializer uses for this.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import User

from .models import AcademicYear, Class, Course, Enrollment


# ── Shared helpers ──────────────────────────────────────────────────────────


def _resolve_target_school_id(serializer):
    """The school_id this row will live under, mirroring the viewset's stamping rule.

    PRINCIPAL → their own school (the body cannot override).
    MAIN_ADMIN → must specify `school` in the body, else error.
    On update → use the existing instance.school_id.
    """
    if serializer.instance is not None:
        return serializer.instance.school_id

    request = serializer.context["request"]
    actor = request.user
    from apps.common.permissions import Role  # local import to avoid cycle

    if actor.role == Role.MAIN_ADMIN:
        target = request.data.get("school")
        if not target:
            raise serializers.ValidationError(
                {"school": "MAIN_ADMIN must specify `school` when creating tenant-scoped rows."}
            )
        return target
    return actor.school_id


def _validate_same_school(target_school_id, fk_obj, field_name: str):
    if fk_obj is None:
        return
    if str(fk_obj.school_id) != str(target_school_id):
        raise serializers.ValidationError(
            {field_name: f"{field_name} belongs to a different school."}
        )


# ── AcademicYear ────────────────────────────────────────────────────────────


class AcademicYearSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = AcademicYear
        fields = [
            "id",
            "school",
            "name",
            "start_date",
            "end_date",
            "is_current",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_date") or (self.instance and self.instance.start_date)
        end = attrs.get("end_date") or (self.instance and self.instance.end_date)
        if start and end and start >= end:
            raise serializers.ValidationError(
                {"end_date": "end_date must be after start_date."}
            )

        # DRF only auto-validates the legacy `unique_together`; modern
        # UniqueConstraints fall through to the DB and raise IntegrityError →
        # 500. Check manually for a clean 400.
        name = attrs.get("name") or (self.instance and self.instance.name)
        if name:
            target_school = _resolve_target_school_id(self)
            qs = AcademicYear.objects.filter(school_id=target_school, name=name)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"name": "An academic year with this name already exists in this school."}
                )
        return attrs


# ── Course ──────────────────────────────────────────────────────────────────


class CourseSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Course
        fields = [
            "id",
            "school",
            "name",
            "code",
            "stream",
            "grade_min",
            "grade_max",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        gmin = attrs.get("grade_min") or (self.instance and self.instance.grade_min)
        gmax = attrs.get("grade_max") or (self.instance and self.instance.grade_max)
        if gmin is not None and gmax is not None and gmin > gmax:
            raise serializers.ValidationError(
                {"grade_max": "grade_max must be >= grade_min."}
            )
        return attrs


# ── Class ───────────────────────────────────────────────────────────────────


class ClassSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    class_teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.TEACHER),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )

    class Meta:
        model = Class
        fields = [
            "id",
            "school",
            "academic_year",
            "grade",
            "section",
            "class_teacher",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("academic_year"), "academic_year")
        teacher = attrs.get("class_teacher")
        _validate_same_school(target_school, teacher, "class_teacher")
        if teacher is not None and teacher.role != User.Role.TEACHER:
            raise serializers.ValidationError(
                {"class_teacher": "class_teacher must be a TEACHER."}
            )

        # Manual uniqueness check on (school, academic_year, grade, section)
        # — DRF doesn't auto-derive a validator from UniqueConstraint, so an
        # untrapped duplicate would 500 with IntegrityError.
        academic_year = attrs.get("academic_year") or (self.instance and self.instance.academic_year)
        grade = attrs.get("grade") or (self.instance and self.instance.grade)
        section = attrs.get("section") or (self.instance and self.instance.section)
        if academic_year and grade and section:
            qs = Class.objects.filter(
                school_id=target_school,
                academic_year=academic_year,
                grade=grade,
                section=section,
            )
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {"section": f"Grade {grade}-{section} already exists in this academic year."}
                )
        return attrs


class ClassReadSerializer(serializers.ModelSerializer):
    """Read-only, display-enriched class row for list/detail.

    Adds the human label, academic-year name, class-teacher name, and a live
    `student_count` (active enrolments, annotated by the viewset) so the teacher
    quiz-assign picker, class analytics, and reports can render without N+1s.
    Writes go through ClassSerializer (which validates cross-school FKs).
    """

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    academic_year = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    academic_year_name = serializers.CharField(source="academic_year.name", read_only=True, default=None)
    class_teacher = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    class_teacher_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = [
            "id", "school", "academic_year", "academic_year_name",
            "grade", "section", "class_name",
            "class_teacher", "class_teacher_name", "student_count",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_class_name(self, obj) -> str:
        return f"Grade {obj.grade}-{obj.section}"

    def get_class_teacher_name(self, obj):
        t = obj.class_teacher
        return (t.get_full_name() or t.username) if t else None

    def get_student_count(self, obj):
        return getattr(obj, "student_count_ann", None)


# ── Enrollment ──────────────────────────────────────────────────────────────


class EnrollmentSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.STUDENT),
        pk_field=serializers.UUIDField(),
    )
    klass = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        required=False,
        allow_null=True,
        pk_field=serializers.UUIDField(),
    )

    class Meta:
        model = Enrollment
        fields = [
            "id",
            "school",
            "student",
            "klass",
            "course",
            "enrolled_on",
            "withdrawn_on",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "enrolled_on", "created_at", "updated_at"]
        # The auto UniqueTogetherValidator that DRF derives from the
        # (student, klass, course) UniqueConstraint marks every named field as
        # `required=True`, which breaks our nullable `course`. Disable it and
        # do the uniqueness check manually in validate(); the DB constraint
        # is still the real guarantee.
        validators: list = []

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        student = attrs.get("student")
        klass = attrs.get("klass")
        course = attrs.get("course")

        _validate_same_school(target_school, student, "student")
        _validate_same_school(target_school, klass, "klass")
        _validate_same_school(target_school, course, "course")

        if student is not None and student.role != User.Role.STUDENT:
            raise serializers.ValidationError({"student": "student must have role=STUDENT."})

        # Manual uniqueness check (mirrors the DB UniqueConstraint).
        if student is not None and klass is not None:
            qs = Enrollment.objects.filter(student=student, klass=klass, course=course)
            if self.instance is not None:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "This student is already enrolled in this class for this course."
                )

        return attrs


# ── Bulk CSV enrollment ─────────────────────────────────────────────────────


class BulkEnrollmentUploadSerializer(serializers.Serializer):
    """Wraps the CSV upload for /enrollments/bulk_csv/.

    Expected columns: student_email, grade, section, course_code (optional).
    Only `file` is on the wire; the rest is computed in the view.
    """

    file = serializers.FileField()

    def validate_file(self, f):
        # Reject obviously-not-CSV uploads early.
        name = (f.name or "").lower()
        if not name.endswith(".csv"):
            raise serializers.ValidationError("file must be a .csv")
        if f.size > 5 * 1024 * 1024:  # 5 MB hard cap for v1
            raise serializers.ValidationError("file is too large (max 5 MB).")
        return f
