"""
Convert legacy single-school sub-admins to the new roaming/grant model.

Before: a SUB_ADMIN had one home `school` FK (forced by the old constraint).
After:  a SUB_ADMIN is school-less and reaches schools via SubAdminGrant rows
        (apps.assignments). For every existing sub-admin that still has a home
        school we mint one full-capability active grant for it, then null the FK
        so the new resolver (X-School-Context) governs their access uniformly.

Runs after the constraint was relaxed (0007) so nulling the school is legal.
"""

from __future__ import annotations

from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    SubAdminGrant = apps.get_model("assignments", "SubAdminGrant")

    for user in User.objects.filter(role="SUB_ADMIN", school__isnull=False):
        SubAdminGrant.objects.get_or_create(
            subadmin_id=user.id,
            school_id=user.school_id,
            defaults={
                "can_manage_school": True,
                "can_onboard_students": True,
                "can_onboard_teachers": True,
                "can_approve_quizzes": True,
                "is_active": True,
            },
        )
        user.school = None
        user.save(update_fields=["school"])


def backwards(apps, schema_editor):
    """Best-effort restore: give the sub-admin back a home school from one of
    their grants (so the stricter old constraint is satisfiable), then drop
    grants. If a sub-admin has multiple grants we keep the first deterministically."""
    User = apps.get_model("accounts", "User")
    SubAdminGrant = apps.get_model("assignments", "SubAdminGrant")

    for user in User.objects.filter(role="SUB_ADMIN", school__isnull=True):
        grant = (
            SubAdminGrant.objects.filter(subadmin_id=user.id)
            .order_by("created_at")
            .first()
        )
        if grant is not None:
            user.school_id = grant.school_id
            user.save(update_fields=["school"])
    SubAdminGrant.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_remove_user_non_admin_has_school_and_more"),
        ("assignments", "0002_subadmingrant"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
