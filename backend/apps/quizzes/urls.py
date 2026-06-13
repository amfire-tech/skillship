"""
File:    backend/apps/quizzes/urls.py
Purpose: Routes for the quiz surface.
Owner:   Navanish

  /api/v1/quizzes/banks/                    → QuestionBank CRUD
  /api/v1/quizzes/banks/{id}/import-csv/    → POST CSV bulk question import (Phase 4)
  /api/v1/quizzes/questions/                → Question CRUD
  /api/v1/quizzes/                          → Quiz CRUD + state actions + /{id}/start/ + /{id}/rankings/
  /api/v1/quizzes/rankings/                 → student class/school leaderboard (?scope=CLASS|SCHOOL)
  /api/v1/quizzes/attempts/                 → QuizAttempt read + /next/, /answer/, /submit/
  /api/v1/quizzes/attempts/summary/         → student dashboard hero stats
  /api/v1/quizzes/attempts/pending-feedback/→ short-answer feedback queue (staff)
  /api/v1/quizzes/answers/{id}/feedback/    → PATCH teacher grade for one short answer
  /api/v1/quizzes/assignments/              → QuizAssignment CRUD (Phase 4)
"""

from __future__ import annotations

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AnswerFeedbackView,
    QuestionBankViewSet,
    QuestionViewSet,
    QuizAssignmentViewSet,
    QuizAttemptViewSet,
    QuizViewSet,
)

app_name = "quizzes"

router = DefaultRouter()
# Sub-resources first. QuizViewSet is registered LAST at the app root (r"") so
# the Quiz resource lives at /api/v1/quizzes/ (matching the documented API and
# the users app convention) rather than the doubly-nested /quizzes/quizzes/.
# Order matters: the explicit prefixes below must resolve before the root
# viewset's bare detail route (^(?P<pk>)/$), so they are registered first.
router.register(r"banks", QuestionBankViewSet, basename="question-bank")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"attempts", QuizAttemptViewSet, basename="quiz-attempt")
router.register(r"assignments", QuizAssignmentViewSet, basename="quiz-assignment")
router.register(r"", QuizViewSet, basename="quiz")

# Explicit path BEFORE the router so the root QuizViewSet's bare detail route
# (^(?P<id>)/$) can never shadow it.
urlpatterns = [
    path("answers/<uuid:id>/feedback/", AnswerFeedbackView.as_view(), name="answer-feedback"),
] + router.urls
