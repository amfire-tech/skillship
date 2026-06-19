"""
File:    backend/apps/career/views.py
Purpose: The career-roadmap flow — interest → roadmap (cache-first) → objective →
         30-day checklist with completion tracking.
Owner:   Navanish

Cost controls live here:
  - Roadmap generation is CACHE-FIRST: a RoadmapTemplate hit on
    (career, grade, board) returns instantly with NO Gemini call. Only the first
    student in each combo triggers a generation, which is then stored for everyone.
  - Quotas (counted from rows created this calendar month, no counter columns):
      * 3 roadmaps / student / month
      * 1 thirty-day checklist / student / month
  - The checklist is the one per-student Gemini call; once made it is read from the
    DB for the rest of the month.
"""

from __future__ import annotations

import datetime as dt
import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai_bridge import services
from apps.ai_bridge.client import AiServiceError, AiServiceUnavailable
from apps.ai_bridge.permissions import CanUseAI
from apps.common.permissions import IsStudent

from . import catalog, interest_quiz
from .context import student_learning_context
from .models import (
    CareerChecklist,
    ChecklistTask,
    RoadmapTemplate,
    StudentCareerProfile,
    StudentRoadmap,
)
from .serializers import (
    CareerChecklistSerializer,
    CareerProfileSerializer,
    ChecklistTaskSerializer,
    InterestQuizScoreSerializer,
    ObjectiveSerializer,
    RoadmapRequestSerializer,
    StudentRoadmapSerializer,
)

logger = logging.getLogger(__name__)

ROADMAP_MONTHLY_LIMIT = 3
CHECKLIST_MONTHLY_LIMIT = 1
CHECKLIST_DAYS = 30

_AI_DOWN = {"detail": "AI service is temporarily unavailable. Please try again shortly."}


def _month_start():
    now = timezone.now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _roadmaps_used(user) -> int:
    return StudentRoadmap.objects.filter(
        student=user, created_at__gte=_month_start()
    ).count()


def _checklists_used(user) -> int:
    return CareerChecklist.objects.filter(
        student=user, created_at__gte=_month_start()
    ).count()


def _get_profile(user) -> StudentCareerProfile:
    profile, _ = StudentCareerProfile.objects.get_or_create(
        student=user, defaults={"school": user.school}
    )
    return profile


# ── Interest detection (ZERO AI) ───────────────────────────────────────────────


class CareerSuggestionsView(APIView):
    """GET /career/suggestions/ — infer interests from quiz strengths (no AI)."""

    permission_classes = [IsStudent]

    def get(self, request: Request) -> Response:
        ctx = student_learning_context(request.user)
        recs = catalog.from_subject_strengths(ctx.get("strengths") or [])
        return Response({
            "source": "quiz",
            "context": {
                "grade": ctx.get("grade"),
                "board": ctx.get("board"),
                "strengths": ctx.get("strengths"),
                "quizzes_taken": ctx.get("quizzes_taken"),
            },
            "recommendations": recs,
            "all_careers": catalog.all_careers(),
        })


class InterestQuizView(APIView):
    """GET /career/interest-quiz/ — the static 20-question fallback (no AI)."""

    permission_classes = [IsStudent]

    def get(self, request: Request) -> Response:
        return Response({"questions": interest_quiz.questions()})


class InterestQuizScoreView(APIView):
    """POST /career/interest-quiz/score/ — rule-based RIASEC scoring (no AI)."""

    permission_classes = [IsStudent]

    def post(self, request: Request) -> Response:
        ser = InterestQuizScoreSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        result = interest_quiz.score(ser.validated_data["answers"])
        return Response(result)


# ── Roadmap (cache-first, AI on miss) ──────────────────────────────────────────


class CareerRoadmapView(APIView):
    """
    POST /career/roadmap/  {career_slug}
    GET  /career/roadmap/?career_slug=...   (preview without spending quota)

    POST: cache-check (career, grade, board); reuse a RoadmapTemplate if present
    (no AI), else generate once + store. Records a StudentRoadmap (3/month cap).
    """

    permission_classes = [IsStudent, CanUseAI]

    def post(self, request: Request) -> Response:
        user = request.user
        ser = RoadmapRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        career = catalog.get_career(ser.validated_data["career_slug"])
        if career is None:
            return Response({"detail": "Unknown career."}, status=status.HTTP_400_BAD_REQUEST)

        ctx = student_learning_context(user)
        grade, board = ctx.get("grade"), ctx.get("board")
        if not grade or not board:
            return Response(
                {"detail": "Add your class to your profile first so we can tailor the roadmap."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        used = _roadmaps_used(user)
        if used >= ROADMAP_MONTHLY_LIMIT:
            return Response(
                {"detail": f"You've used all {ROADMAP_MONTHLY_LIMIT} roadmaps for this month."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        # ── Cache check — the cost moat ──
        template = RoadmapTemplate.objects.filter(
            career_slug=career["slug"], grade=grade, board=board
        ).first()
        cached = template is not None

        if template is None:
            payload = {
                "career_title": career["title"],
                "grade": grade,
                "board": board,
                "strengths": ctx.get("strengths") or [],
            }
            try:
                result = services.career_roadmap_detail(school=user.school, user=user, payload=payload)
            except (AiServiceUnavailable, AiServiceError) as exc:
                logger.warning("roadmap gen failed — user=%s err=%s", user.id, exc)
                return Response(_AI_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            template = RoadmapTemplate.objects.create(
                career_slug=career["slug"],
                career_title=career["title"],
                grade=grade,
                board=board,
                detail_json=result,
            )

        sr = StudentRoadmap.objects.create(
            school=user.school,
            student=user,
            template=template,
            career_slug=career["slug"],
            career_title=career["title"],
            grade=grade,
            board=board,
        )

        return Response({
            "roadmap_id": str(sr.id),
            "career_slug": career["slug"],
            "career_title": career["title"],
            "cached": cached,
            "roadmap": template.detail_json,
            "quota": {"used": used + 1, "limit": ROADMAP_MONTHLY_LIMIT},
        })


class StudentRoadmapListView(APIView):
    """GET /career/roadmaps/        — saved roadmaps (default).
       GET /career/roadmaps/?all=1  — full generation history."""

    permission_classes = [IsStudent]

    def get(self, request: Request) -> Response:
        qs = (
            StudentRoadmap.objects.filter(student=request.user)
            .select_related("template")
            .order_by("-created_at")
        )
        if request.query_params.get("all") not in ("1", "true", "yes"):
            qs = qs.filter(is_saved=True)
        return Response({
            "results": StudentRoadmapSerializer(qs, many=True).data,
            "quota": {"used": _roadmaps_used(request.user), "limit": ROADMAP_MONTHLY_LIMIT},
        })


class SaveRoadmapView(APIView):
    """POST /career/roadmaps/<id>/save/ — keep this roadmap in Saved Roadmaps."""

    permission_classes = [IsStudent]

    def post(self, request: Request, pk) -> Response:
        sr = StudentRoadmap.objects.filter(student=request.user, id=pk).first()
        if sr is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not sr.is_saved:
            sr.is_saved = True
            sr.save(update_fields=["is_saved", "updated_at"])
        return Response(StudentRoadmapSerializer(sr).data)


class StudentRoadmapDetailView(APIView):
    """GET /career/roadmaps/<id>/ — one saved roadmap (view-only)."""

    permission_classes = [IsStudent]

    def get(self, request: Request, pk) -> Response:
        sr = (
            StudentRoadmap.objects.filter(student=request.user, id=pk)
            .select_related("template")
            .first()
        )
        if sr is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(StudentRoadmapSerializer(sr).data)


# ── Objective (commit to profile) ──────────────────────────────────────────────


class CareerProfileView(APIView):
    """GET /career/profile/ — chosen objective + quota status."""

    permission_classes = [IsStudent]

    def get(self, request: Request) -> Response:
        profile = _get_profile(request.user)
        return Response({
            "profile": CareerProfileSerializer(profile).data,
            "quota": {
                "roadmaps": {"used": _roadmaps_used(request.user), "limit": ROADMAP_MONTHLY_LIMIT},
                "checklists": {"used": _checklists_used(request.user), "limit": CHECKLIST_MONTHLY_LIMIT},
            },
        })


class SetObjectiveView(APIView):
    """POST /career/objective/  {roadmap_id} — save a roadmap as the career goal."""

    permission_classes = [IsStudent]

    def post(self, request: Request) -> Response:
        ser = ObjectiveSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = request.user

        sr = StudentRoadmap.objects.filter(
            student=user, id=ser.validated_data["roadmap_id"]
        ).first()
        if sr is None:
            return Response({"detail": "Roadmap not found."}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            StudentRoadmap.objects.filter(student=user, is_objective=True).update(is_objective=False)
            sr.is_objective = True
            sr.is_saved = True  # committing implies saving
            sr.save(update_fields=["is_objective", "is_saved", "updated_at"])

            profile = _get_profile(user)
            profile.career_slug = sr.career_slug
            profile.career_title = sr.career_title
            profile.objective_set_at = timezone.now()
            profile.active_roadmap = sr
            profile.save(update_fields=[
                "career_slug", "career_title", "objective_set_at", "active_roadmap", "updated_at",
            ])

        return Response({"profile": CareerProfileSerializer(profile).data})


# ── 30-day checklist (per-student AI, 1/month) ─────────────────────────────────


class CareerChecklistView(APIView):
    """
    GET  /career/checklist/  — latest checklist + tasks (no AI).
    POST /career/checklist/  — generate the 30-day plan for the chosen objective.
    """

    permission_classes = [IsStudent, CanUseAI]

    def get(self, request: Request) -> Response:
        checklist = (
            CareerChecklist.objects.filter(student=request.user)
            .prefetch_related("tasks")
            .order_by("-created_at")
            .first()
        )
        if checklist is None:
            return Response({"checklist": None})
        return Response({"checklist": CareerChecklistSerializer(checklist).data})

    def post(self, request: Request) -> Response:
        user = request.user
        profile = _get_profile(user)
        if not profile.career_slug or profile.active_roadmap_id is None:
            return Response(
                {"detail": "Choose a career objective before generating a checklist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        used = _checklists_used(user)
        if used >= CHECKLIST_MONTHLY_LIMIT:
            return Response(
                {"detail": "You can generate one 30-day checklist per month. Try again next month."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        ctx = student_learning_context(user)
        grade, board = ctx.get("grade"), ctx.get("board")
        if not grade or not board:
            return Response(
                {"detail": "Add your class to your profile first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payload = {
            "career_title": profile.career_title,
            "grade": grade,
            "board": board,
            "strengths": ctx.get("strengths") or [],
            "needs_work": ctx.get("needs_work") or [],
            "days": CHECKLIST_DAYS,
        }
        try:
            result = services.career_checklist(school=user.school, user=user, payload=payload)
        except (AiServiceUnavailable, AiServiceError) as exc:
            logger.warning("checklist gen failed — user=%s err=%s", user.id, exc)
            return Response(_AI_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        tasks = result.get("tasks") or []
        if not tasks:
            return Response(_AI_DOWN, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        start = timezone.localdate()
        end = start + dt.timedelta(days=CHECKLIST_DAYS - 1)

        with transaction.atomic():
            checklist = CareerChecklist.objects.create(
                school=user.school,
                student=user,
                roadmap=profile.active_roadmap,
                career_title=profile.career_title,
                headline=result.get("headline", "")[:240],
                period_start=start,
                period_end=end,
            )
            ChecklistTask.objects.bulk_create([
                ChecklistTask(
                    school=user.school,
                    checklist=checklist,
                    day_index=t["day_index"],
                    due_date=start + dt.timedelta(days=t["day_index"] - 1),
                    title=str(t.get("title", ""))[:200],
                    detail=str(t.get("detail", "")),
                    category=str(t.get("category", "study"))[:40],
                )
                for t in tasks
            ])

        checklist = CareerChecklist.objects.prefetch_related("tasks").get(id=checklist.id)
        return Response(
            {"checklist": CareerChecklistSerializer(checklist).data},
            status=status.HTTP_201_CREATED,
        )


class ChecklistTaskToggleView(APIView):
    """PATCH /career/tasks/<id>/  {is_done} — tick a day off (no AI)."""

    permission_classes = [IsStudent]

    def patch(self, request: Request, pk) -> Response:
        task = ChecklistTask.objects.filter(
            checklist__student=request.user, id=pk
        ).first()
        if task is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        is_done = request.data.get("is_done")
        task.is_done = bool(is_done) if is_done is not None else not task.is_done
        task.done_at = timezone.now() if task.is_done else None
        task.save(update_fields=["is_done", "done_at", "updated_at"])
        return Response(ChecklistTaskSerializer(task).data)
