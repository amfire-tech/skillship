"""
File:    backend/apps/quizzes/migrations/0007_quiz_soft_delete.py
Purpose: Add deleted_by_teacher + deleted_by_admin two-party soft-delete flags.
Owner:   Navanish
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quizzes", "0006_quiz_published_by_quiz_published_by_role"),
    ]

    operations = [
        migrations.AddField(
            model_name="quiz",
            name="deleted_by_teacher",
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AddField(
            model_name="quiz",
            name="deleted_by_admin",
            field=models.BooleanField(default=False, db_index=True),
        ),
    ]
