"""
Migration 0003 — add User.profile_completed (first-login profile lock).

Why:
- Bulk credential generation creates STUDENT accounts with NO name yet. The
  student fills in their own name / roll / class once on first login, then the
  profile locks (profile_completed=True) and only MAIN_ADMIN can change it.
- The field defaults to False, but EVERY row that exists when this migration
  runs is an already-populated account (admin-created or roster-onboarded) and
  must NOT be bounced to the first-login screen — so we backfill them all to
  True. Only accounts created AFTER this migration, by the generator, start
  False.
"""

from django.db import migrations, models


def mark_existing_complete(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.all().update(profile_completed=True)


def noop_reverse(apps, schema_editor):
    # Reversing just drops the column (AddField reverse); nothing to undo here.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_email_unique_and_manager"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="profile_completed",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(mark_existing_complete, noop_reverse),
    ]
