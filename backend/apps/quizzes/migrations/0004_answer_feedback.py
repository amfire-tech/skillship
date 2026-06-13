# Generated for the teacher short-answer Feedback System.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0003_quiz_grade_quiz_section'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='answer',
            name='feedback_status',
            field=models.CharField(
                choices=[
                    ('NOT_REQUIRED', 'Not required'),
                    ('PENDING', 'Pending review'),
                    ('FINALISED', 'Finalised'),
                ],
                db_index=True,
                default='NOT_REQUIRED',
                help_text='PENDING for short answers awaiting a teacher; FINALISED once graded.',
                max_length=12,
            ),
        ),
        migrations.AddField(
            model_name='answer',
            name='teacher_score',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='answer',
            name='teacher_feedback',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='answer',
            name='feedback_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='+',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='answer',
            name='feedback_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
