"""
File:    backend/apps/ai_bridge/migrations/0002_aijob_pdf_grade_short_kinds.py
Purpose: Extend AiJob.Kind choices with QUESTION_GEN_PDF and GRADE_SHORT.
Owner:   Navanish
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai_bridge", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="aijob",
            name="kind",
            field=models.CharField(
                choices=[
                    ("CAREER", "Career Pilot"),
                    ("QUESTION_GEN", "Question Generator"),
                    ("QUESTION_GEN_PDF", "Question Generator (PDF)"),
                    ("ADAPTIVE_NEXT", "Adaptive Next Question"),
                    ("GRADE_SHORT", "Short-Answer Grading"),
                    ("CONTENT_SEARCH", "Content Search"),
                ],
                db_index=True,
                max_length=30,
            ),
        ),
    ]
