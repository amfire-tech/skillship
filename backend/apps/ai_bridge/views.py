"""
File:    backend/apps/ai_bridge/views.py
Purpose: The four Plan 01 AI proxy endpoints.
Owner:   Navanish

Every view:
  1. Checks role-based permissions.
  2. Validates the request body with the matching serializer.
  3. Assembles the full AI-service payload (server-stamped fields + client data).
  4. Delegates to services.py which handles AiJob persistence + the actual call.
  5. Maps AiServiceUnavailable → 503 so the frontend gets a clean error.

All four views are wrapped in @transaction.non_atomic_requests in urls.py so
Django's ATOMIC_REQUESTS does not hold a DB connection open during the AI call.
"""

from __future__ import annotations

import logging

from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsPrincipal, IsStudent, IsSubAdmin, IsTeacher

from . import services
from .client import AiServiceError, AiServiceUnavailable
from .serializers import (
    AdaptiveNextSerializer,
    CareerAskSerializer,
    ContentSearchSerializer,
    GenerateQuestionsSerializer,
)

logger = logging.getLogger(__name__)

_503 = OpenApiResponse(description="AI service temporarily unavailable.")
_403 = OpenApiResponse(description="Insufficient role or missing school context.")


class CareerAskView(APIView):
    """
    POST /api/v1/ai/career/ask/

    Student asks the AI Career Pilot for personalised career guidance.
    Student context (school, admission number) is stamped server-side from the JWT.
    Grade and quiz history will be enriched here once Vishal ships Enrollment/QuizAttempt.
    """

    permission_classes = [IsStudent]

    @extend_schema(request=CareerAskSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = CareerAskSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        user = request.user
        payload = {
            "student_context": {
                "student_id":       str(user.id),
                "school_name":      user.school.name,
                "admission_number": user.admission_number or "",
                # TODO (week 9): add grade from Enrollment, quiz_scores from QuizAttempt.
            },
            "question": data["question"],
            "history":  data["history"],
        }

        try:
            result = services.career_ask(school=user.school, user=user, payload=payload)
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("career_ask failed — user=%s err=%s", user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result)


class GenerateQuestionsView(APIView):
    """
    POST /api/v1/ai/quiz/generate/

    Generates AI questions for a topic. Questions are returned for teacher review —
    they are NOT auto-saved. Saving to the question bank is the teacher's next action
    via the quiz API (Vishal's, week 5–6).
    """

    permission_classes = [IsTeacher | IsPrincipal | IsSubAdmin]

    @extend_schema(request=GenerateQuestionsSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = GenerateQuestionsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            result = services.generate_questions(
                school=request.user.school,
                user=request.user,
                payload=ser.validated_data,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("generate_questions failed — user=%s err=%s", request.user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result)


class AdaptiveNextView(APIView):
    """
    POST /api/v1/ai/quiz/adaptive-next/

    Returns the next question difficulty calibrated to the student's performance
    in the current attempt. Called by the quiz-taking flow after each answer.
    """

    permission_classes = [IsStudent]

    @extend_schema(request=AdaptiveNextSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = AdaptiveNextSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            result = services.adaptive_next(
                school=request.user.school,
                user=request.user,
                payload=ser.validated_data,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("adaptive_next failed — user=%s err=%s", request.user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result)


class ContentSearchView(APIView):
    """
    POST /api/v1/ai/content/search/

    Natural-language semantic search over this school's uploaded content.
    Available to all authenticated users who belong to a school.
    MAIN_ADMIN (school=NULL) is explicitly blocked — they have no school content.
    """

    @extend_schema(request=ContentSearchSerializer, responses={200: dict, 403: _403, 503: _503})
    def post(self, request: Request) -> Response:
        if not request.user.school_id:
            return Response(
                {"detail": "Content search requires a school-scoped account."},
                status=status.HTTP_403_FORBIDDEN,
            )

        ser = ContentSearchSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        payload = {
            "query":     data["query"],
            "school_id": str(request.user.school_id),
            "course_id": str(data["course_id"]) if data.get("course_id") else None,
            "k":         data["k"],
        }

        try:
            result = services.content_search(
                school=request.user.school,
                user=request.user,
                payload=payload,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("content_search failed — user=%s err=%s", request.user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result)
