"""
File:    backend/apps/ai_bridge/urls.py
Purpose: URL routing for the four Plan 01 AI endpoints.
Owner:   Navanish
"""

from django.db import transaction
from django.urls import path

from .views import AdaptiveNextView, CareerAskView, ContentSearchView, GenerateQuestionsView

# Wrap every AI view in non_atomic_requests so Django's ATOMIC_REQUESTS setting
# does not hold a PostgreSQL connection open for the 5–30 s duration of an AI call.
_nr = transaction.non_atomic_requests

urlpatterns = [
    path("career/ask/",          _nr(CareerAskView.as_view()),         name="ai-career-ask"),
    path("quiz/generate/",       _nr(GenerateQuestionsView.as_view()), name="ai-quiz-generate"),
    path("quiz/adaptive-next/",  _nr(AdaptiveNextView.as_view()),      name="ai-adaptive-next"),
    path("content/search/",      _nr(ContentSearchView.as_view()),     name="ai-content-search"),
]
