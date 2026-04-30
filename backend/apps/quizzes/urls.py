"""
File:    backend/apps/quizzes/urls.py
Purpose: URL routing for the quizzes app.
Owner:   Vishal
"""

from rest_framework.routers import DefaultRouter

from .views import QuestionBankViewSet, QuestionViewSet, QuizAttemptViewSet, QuizViewSet

router = DefaultRouter()
router.register(r"banks", QuestionBankViewSet, basename="questionbank")
router.register(r"questions", QuestionViewSet, basename="question")
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"attempts", QuizAttemptViewSet, basename="quizattempt")

urlpatterns = router.urls
