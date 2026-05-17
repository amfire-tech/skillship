"""
File:    backend/apps/ai_bridge/migrations/0003_aijob_college_finder_kind.py
Purpose: Add COLLEGE_FINDER to AiJob.Kind choices.
Owner:   Navanish
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ai_bridge", "0002_aijob_pdf_grade_short_kinds"),
    ]

    operations = [
        migrations.AlterField(
            model_name="aijob",
            name="kind",
            field=models.CharField(
                choices=[
                    ("CAREER", "Career Pilot"),
                    ("COLLEGE_FINDER", "College Finder"),
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
