"""
File:    backend/apps/career/urls.py
Purpose: Routing for the career-roadmap engine.
Owner:   Navanish

Roadmap + checklist POSTs make an AI call on a cache MISS, so they are wrapped in
non_atomic_requests (same as ai_bridge) — Django's ATOMIC_REQUESTS must not hold a
DB connection open for the duration of a Gemini call.
"""

from django.db import transaction
from django.urls import path

from .views import (
    CareerChecklistView,
    CareerProfileView,
    CareerRoadmapView,
    CareerSuggestionsView,
    ChecklistTaskToggleView,
    InterestQuizScoreView,
    InterestQuizView,
    SaveRoadmapView,
    SetObjectiveView,
    StudentRoadmapDetailView,
    StudentRoadmapListView,
)

_nr = transaction.non_atomic_requests

urlpatterns = [
    path("suggestions/",          CareerSuggestionsView.as_view(),       name="career-suggestions"),
    path("interest-quiz/",        InterestQuizView.as_view(),            name="career-interest-quiz"),
    path("interest-quiz/score/",  InterestQuizScoreView.as_view(),       name="career-interest-quiz-score"),
    path("roadmap/",              _nr(CareerRoadmapView.as_view()),      name="career-roadmap"),
    path("roadmaps/",             StudentRoadmapListView.as_view(),      name="career-roadmaps"),
    path("roadmaps/<uuid:pk>/",   StudentRoadmapDetailView.as_view(),    name="career-roadmap-detail"),
    path("roadmaps/<uuid:pk>/save/", SaveRoadmapView.as_view(),          name="career-roadmap-save"),
    path("profile/",              CareerProfileView.as_view(),           name="career-profile"),
    path("objective/",            SetObjectiveView.as_view(),            name="career-objective"),
    path("checklist/",            _nr(CareerChecklistView.as_view()),    name="career-checklist"),
    path("tasks/<uuid:pk>/",      ChecklistTaskToggleView.as_view(),     name="career-task-toggle"),
]
