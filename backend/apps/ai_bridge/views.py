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
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import (
    IsMainAdmin,
    IsPrincipal,
    IsStudent,
    IsSubAdmin,
    IsTeacher,
    Role,
)
from apps.schools.models import School

from . import services
from .client import AiServiceError, AiServiceUnavailable
from .permissions import CanUseAI
from .serializers import (
    AdaptiveNextSerializer,
    CareerAskSerializer,
    CollegeFinderSerializer,
    ContentSearchSerializer,
    GenerateFromPdfSerializer,
    GenerateQuestionsSerializer,
    GradeShortSerializer,
)

logger = logging.getLogger(__name__)

_503 = OpenApiResponse(description="AI service temporarily unavailable.")
_403 = OpenApiResponse(description="Insufficient role or missing school context.")


def _resolve_ai_school(request: Request) -> School:
    """The School an AI job is billed/audited under.

    School-scoped staff use their own school (from the JWT). MAIN_ADMIN has no
    school of their own, so when they generate for a specific school (e.g. the
    super-admin quiz wizard) they must name it via `school` in the request body.
    """
    user = request.user
    if user.role == Role.MAIN_ADMIN:
        school_id = request.data.get("school")
        if not school_id:
            raise ValidationError({"school": "Select a school for this AI request."})
        school = School.objects.filter(id=school_id).first()
        if school is None:
            raise ValidationError({"school": "School not found."})
        return school
    return user.school


def _student_career_context(user) -> dict:
    """Build the real profile the roadmap / recommendations agents reason over —
    grade (from current enrolment) + per-subject quiz performance + strengths.
    All from live data so the AI output is personalised, never generic."""
    from django.db.models import Avg, Count

    from apps.academics.models import Enrollment
    from apps.quizzes.models import QuizAttempt

    enr = (
        Enrollment.objects.filter(student=user, withdrawn_on__isnull=True)
        .select_related("klass").order_by("-enrolled_on").first()
    )
    grade = enr.klass.grade if enr and enr.klass_id else None

    submitted = QuizAttempt.objects.filter(student=user, status=QuizAttempt.Status.SUBMITTED)
    rows = (
        submitted.values("quiz__course__name")
        .annotate(avg=Avg("score_percent"), n=Count("id"))
    )
    subjects = [
        {
            "subject": r["quiz__course__name"] or "General",
            "avg_score": round(float(r["avg"]), 1),
            "attempts": r["n"],
        }
        for r in rows if r["avg"] is not None
    ]
    subjects.sort(key=lambda s: -s["avg_score"])
    overall = submitted.aggregate(a=Avg("score_percent"))["a"]

    return {
        "student_id": str(user.id),
        "school_name": user.school.name if user.school_id else "",
        "grade": grade,
        "overall_avg_score": round(float(overall), 1) if overall is not None else None,
        "quizzes_taken": submitted.count(),
        "subject_performance": subjects,
        "strengths": [s["subject"] for s in subjects[:2]],
        "needs_work": [s["subject"] for s in subjects[-2:]] if len(subjects) > 2 else [],
    }


class CareerRoadmapView(APIView):
    """
    POST /api/v1/ai/career/roadmap/

    Generates a personalised, chronological career roadmap for the requesting
    student, grounded in their real grade + quiz performance.
    """

    permission_classes = [IsStudent, CanUseAI]

    @extend_schema(request=None, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        user = request.user
        payload = {"student_context": _student_career_context(user)}
        try:
            result = services.career_roadmap(school=user.school, user=user, payload=payload)
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("career_roadmap failed — user=%s err=%s", user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(result)


class CareerRecommendationsView(APIView):
    """
    POST /api/v1/ai/career/recommendations/

    Recommends best-fit careers + skill-building workshops for the requesting
    student, grounded in their real quiz strengths.
    """

    permission_classes = [IsStudent, CanUseAI]

    @extend_schema(request=None, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        user = request.user
        payload = {"student_context": _student_career_context(user)}
        try:
            result = services.career_recommendations(school=user.school, user=user, payload=payload)
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("career_recommendations failed — user=%s err=%s", user.id, exc)
            return Response(
                {"detail": "AI service is temporarily unavailable. Please try again shortly."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response(result)


class CareerAskView(APIView):
    """
    POST /api/v1/ai/career/ask/

    Student asks the AI Career Pilot for personalised career guidance.
    Student context (school, admission number) is stamped server-side from the JWT.
    Grade and quiz history will be enriched here once Vishal ships Enrollment/QuizAttempt.
    """

    permission_classes = [IsStudent, CanUseAI]

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


class CollegeFinderView(APIView):
    """
    POST /api/v1/ai/career/college-finder/

    Student picks state + city + specialization. Returns up to 8 NIRF-ranked
    Indian colleges that fit the criteria, generated by Gemini.
    """

    permission_classes = [IsStudent, CanUseAI]

    @extend_schema(request=CollegeFinderSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = CollegeFinderSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            result = services.college_finder(
                school=request.user.school,
                user=request.user,
                payload=ser.validated_data,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("college_finder failed — user=%s err=%s", request.user.id, exc)
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

    permission_classes = [IsTeacher | IsPrincipal | IsSubAdmin | IsMainAdmin, CanUseAI]

    @extend_schema(request=GenerateQuestionsSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = GenerateQuestionsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        school = _resolve_ai_school(request)

        try:
            result = services.generate_questions(
                school=school,
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


class GenerateQuestionsFromPdfView(APIView):
    """
    POST /api/v1/ai/quiz/generate-from-pdf/   (multipart/form-data)

    Teacher uploads a PDF and the AI service generates questions grounded in its text.
    Same role gate as the JSON variant: TEACHER | PRINCIPAL | SUB_ADMIN.
    """

    permission_classes = [IsTeacher | IsPrincipal | IsSubAdmin | IsMainAdmin, CanUseAI]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(request=GenerateFromPdfSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = GenerateFromPdfSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        school = _resolve_ai_school(request)

        uploaded = data["file"]
        pdf_bytes = uploaded.read()
        form_fields = {
            "topic":      data["topic"],
            "grade":      data["grade"],
            "count":      data["count"],
            "difficulty": data["difficulty"],
            "types":      data["types"],
        }

        try:
            result = services.generate_from_pdf(
                school=school,
                user=request.user,
                pdf_bytes=pdf_bytes,
                filename=uploaded.name,
                form_fields=form_fields,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("generate_from_pdf failed — user=%s err=%s", request.user.id, exc)
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

    permission_classes = [IsStudent, CanUseAI]

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


class GradeShortView(APIView):
    """
    POST /api/v1/ai/quiz/grade-short/

    Grades a single short-answer response with the AI rubric. Returns
    `{score: 0.0-1.0, feedback: str}`. Callers map the score into points.
    Used by quiz auto-grading for SHORT_ANSWER questions whose accepted_answers
    list does not match the student's text.
    """

    permission_classes = [IsTeacher | IsPrincipal | IsSubAdmin, CanUseAI]

    @extend_schema(request=GradeShortSerializer, responses={200: dict, 503: _503})
    def post(self, request: Request) -> Response:
        ser = GradeShortSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            result = services.grade_short(
                school=request.user.school,
                user=request.user,
                payload=ser.validated_data,
            )
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("grade_short failed — user=%s err=%s", request.user.id, exc)
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

    permission_classes = [IsAuthenticated, CanUseAI]

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
