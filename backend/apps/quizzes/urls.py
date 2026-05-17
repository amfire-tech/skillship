"""
File:    backend/apps/quizzes/urls.py
Purpose: Routes for the quiz surface.
Owner:   Navanish

  /api/v1/quizzes/banks/                    → QuestionBank CRUD
  /api/v1/quizzes/banks/{id}/import-csv/    → POST CSV bulk question import (Phase 4)
  /api/v1/quizzes/questions/                → Question CRUD
  /api/v1/quizzes/quizzes/                  → Quiz CRUD + state actions + /start/ + /rankings/
  /api/v1/quizzes/attempts/                 → QuizAttempt read + /next/, /answer/, /submit/
  /api/v1/quizzes/assignments/              → QuizAssignment CRUD (Phase 4)
"""

from __future__ import annotations

from rest_framework.routers import DefaultRouter

from .views import (
    QuestionBankViewSet,
    QuestionViewSet,
    QuizAssignmentViewSet,
    QuizAttemptViewSet,
    QuizViewSet,
)

app_name = "quizzes"

router = DefaultRouter()
router.register(r"banks", QuestionBankViewSet, basename="question-bank")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"attempts", QuizAttemptViewSet, basename="quiz-attempt")
router.register(r"assignments", QuizAssignmentViewSet, basename="quiz-assignment")

urlpatterns = router.urls
