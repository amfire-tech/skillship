"""
File:    backend/apps/quizzes/migrations/0008_quiz_grade_multi_class.py
Purpose: Widen Quiz.grade so one quiz can target several classes ("Class 6, Class 7").
Owner:   Navanish
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quizzes", "0007_quiz_soft_delete"),
    ]

    operations = [
        migrations.AlterField(
            model_name="quiz",
            name="grade",
            field=models.CharField(blank=True, max_length=120),
        ),
    ]
