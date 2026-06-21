from django.contrib import admin

from .models import SkillshipAssignment, SubAdminGrant


@admin.register(SkillshipAssignment)
class SkillshipAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "school", "klass", "is_active", "date_from", "date_to")
    list_filter = ("is_active", "school")
    search_fields = ("teacher__email", "school__name")
    raw_id_fields = ("teacher", "school", "klass", "created_by")


@admin.register(SubAdminGrant)
class SubAdminGrantAdmin(admin.ModelAdmin):
    list_display = (
        "subadmin", "school", "is_active",
        "can_manage_school", "can_onboard_students",
        "can_onboard_teachers", "can_approve_quizzes",
    )
    list_filter = ("is_active", "school")
    search_fields = ("subadmin__email", "school__name")
    raw_id_fields = ("subadmin", "school", "created_by")
