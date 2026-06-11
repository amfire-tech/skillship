"""
Migration 0004 — add User.assigned_teacher (student → teacher link).

The teacher who manages a student, set by MAIN_ADMIN. Nullable self-FK
(SET_NULL so deleting a teacher just unassigns their students). Same-school +
role=TEACHER validity is enforced in the serializer/endpoint, not the DB.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_user_profile_completed"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="assigned_teacher",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_students",
                limit_choices_to={"role": "TEACHER"},
                to="accounts.user",
            ),
        ),
    ]
