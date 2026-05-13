"""
File:    backend/apps/quizzes/views.py
Purpose: ViewSets for QuestionBank, Question, Quiz, QuizAttempt.
Owner:   Navanish

Surface map:

  /api/v1/quizzes/banks/                 (CRUD — staff)
  /api/v1/quizzes/questions/             (CRUD — staff)
  /api/v1/quizzes/quizzes/               (CRUD — staff; STUDENT sees PUBLISHED only)
  /api/v1/quizzes/quizzes/{id}/submit-for-review/    (TEACHER+)
  /api/v1/quizzes/quizzes/{id}/return-to-draft/      (REVIEW gate)
  /api/v1/quizzes/quizzes/{id}/publish/              (PRINCIPAL/SUB_ADMIN)
  /api/v1/quizzes/quizzes/{id}/archive/              (TEACHER+)
  /api/v1/quizzes/quizzes/{id}/start/                (STUDENT — start/resume attempt)
  /api/v1/quizzes/attempts/              (read — owner student or staff)
  /api/v1/quizzes/attempts/{id}/next/                (STUDENT — next question)
  /api/v1/quizzes/attempts/{id}/answer/              (STUDENT — submit one answer)
  /api/v1/quizzes/attempts/{id}/submit/              (STUDENT — finalise)

All views inherit `TenantScopedViewSet` for school filtering on read AND
school-stamping on create. Role gates are applied via permissions.py classes.
"""

from __future__ import annotations

import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.common.permissions import Role
from apps.common.viewsets import TenantScopedViewSet

from . import services
from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt
from .permissions import (
    CanAuthorContent,
    CanPublishQuiz,
    CanReadQuiz,
    CanTakeQuiz,
)
from .serializers import (
    AnswerSubmitSerializer,
    QuestionSerializer,
    QuestionStudentSerializer,
    QuestionBankSerializer,
    QuizAttemptReadSerializer,
    QuizSerializer,
    QuizStudentSerializer,
)

logger = logging.getLogger(__name__)

_BAD_REQUEST = OpenApiResponse(description="Validation error.")
_NOT_FOUND = OpenApiResponse(description="Resource not found in your school.")


# ── QuestionBank ────────────────────────────────────────────────────────────


class QuestionBankViewSet(TenantScopedViewSet):
    queryset = QuestionBank.objects.select_related("course").all()
    serializer_class = QuestionBankSerializer
    permission_classes = [IsAuthenticated, CanAuthorContent]
    lookup_field = "id"

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)


# ── Question ────────────────────────────────────────────────────────────────


class QuestionViewSet(TenantScopedViewSet):
    queryset = Question.objects.select_related("bank").all()
    permission_classes = [IsAuthenticated, CanAuthorContent]
    lookup_field = "id"

    def get_serializer_class(self):
        # Students never write questions; staff always need the full shape.
        return QuestionSerializer

    def get_queryset(self) -> QuerySet[Question]:
        qs = super().get_queryset()
        bank_id = self.request.query_params.get("bank")
        if bank_id:
            qs = qs.filter(bank_id=bank_id)
        return qs

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)


# ── Quiz ────────────────────────────────────────────────────────────────────


class QuizViewSet(TenantScopedViewSet):
    """CRUD + state-transition actions.

    Read access is broader than write (`CanReadQuiz` lets a STUDENT see a
    PUBLISHED quiz). Write actions check role inline.
    """

    queryset = Quiz.objects.select_related("course", "bank").all()
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated, CanReadQuiz]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.user.is_authenticated and self.request.user.role == Role.STUDENT:
            return QuizStudentSerializer
        return QuizSerializer

    def get_queryset(self) -> QuerySet[Quiz]:
        qs = super().get_queryset()
        if self.request.user.role == Role.STUDENT:
            qs = qs.filter(status=Quiz.Status.PUBLISHED)
        # Optional ?course=<uuid> filter (used by both staff and student lists).
        course_id = self.request.query_params.get("course")
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs

    # Writes (create / update / delete) are staff-only.
    def _require_author(self):
        u = self.request.user
        if u.role not in {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}:
            raise ValidationError({"detail": "Only staff can author quizzes."})

    def perform_create(self, serializer):
        self._require_author()
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)

    def perform_update(self, serializer):
        self._require_author()
        # Edits to a PUBLISHED quiz are blocked once any attempt exists.
        instance: Quiz = self.get_object()
        if (
            instance.status == Quiz.Status.PUBLISHED
            and QuizAttempt.objects.filter(quiz=instance).exists()
        ):
            raise ValidationError(
                {"detail": "This quiz has attempts and is locked. Archive and recreate."}
            )
        serializer.save()

    def perform_destroy(self, instance):
        self._require_author()
        if QuizAttempt.objects.filter(quiz=instance).exists():
            raise ValidationError(
                {"detail": "Cannot delete a quiz with attempts. Archive instead."}
            )
        instance.delete()

    # ── State transitions ───────────────────────────────────────────────────

    @extend_schema(request=None, responses={200: QuizSerializer, 400: _BAD_REQUEST})
    @action(detail=True, methods=["post"], url_path="submit-for-review",
            permission_classes=[IsAuthenticated, CanAuthorContent])
    def submit_for_review(self, request, id=None):
        quiz = self.get_object()
        return self._transition(quiz, Quiz.Status.REVIEW)

    @extend_schema(request=None, responses={200: QuizSerializer, 400: _BAD_REQUEST})
    @action(detail=True, methods=["post"], url_path="return-to-draft",
            permission_classes=[IsAuthenticated, CanPublishQuiz])
    def return_to_draft(self, request, id=None):
        quiz = self.get_object()
        return self._transition(quiz, Quiz.Status.DRAFT)

    @extend_schema(request=None, responses={200: QuizSerializer, 400: _BAD_REQUEST})
    @action(detail=True, methods=["post"], url_path="publish",
            permission_classes=[IsAuthenticated, CanPublishQuiz])
    def publish(self, request, id=None):
        quiz = self.get_object()
        return self._transition(quiz, Quiz.Status.PUBLISHED)

    @extend_schema(request=None, responses={200: QuizSerializer, 400: _BAD_REQUEST})
    @action(detail=True, methods=["post"], url_path="archive",
            permission_classes=[IsAuthenticated, CanAuthorContent])
    def archive(self, request, id=None):
        quiz = self.get_object()
        return self._transition(quiz, Quiz.Status.ARCHIVED)

    def _transition(self, quiz: Quiz, target: str) -> Response:
        try:
            quiz = services.transition_quiz_status(quiz, target=target, actor=self.request.user)
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc
        return Response(QuizSerializer(quiz).data)

    # ── Student: start an attempt ───────────────────────────────────────────

    @extend_schema(
        request=None,
        responses={200: QuizAttemptReadSerializer, 400: _BAD_REQUEST, 404: _NOT_FOUND},
    )
    @action(detail=True, methods=["post"], url_path="start",
            permission_classes=[IsAuthenticated, CanTakeQuiz])
    def start(self, request, id=None):
        quiz = self.get_object()
        if request.user.role != Role.STUDENT:
            raise ValidationError({"detail": "Only students can start an attempt."})
        try:
            result = services.start_attempt(quiz, student=request.user)
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc

        body = QuizAttemptReadSerializer(result.attempt).data
        body["resumed"] = result.is_resume
        return Response(body, status=status.HTTP_200_OK if result.is_resume else status.HTTP_201_CREATED)


# ── QuizAttempt ─────────────────────────────────────────────────────────────


class QuizAttemptViewSet(ReadOnlyModelViewSet):
    """Read-only over the attempt collection plus three action endpoints.

    A STUDENT only sees their own attempts; staff see attempts in their school.
    Multi-tenancy: object lookup respects school_id even for STUDENTS who
    happen to share a UUID prefix across schools (impossible with UUID4 in
    practice, but defense in depth).
    """

    queryset = QuizAttempt.objects.select_related("quiz", "student").all()
    serializer_class = QuizAttemptReadSerializer
    permission_classes = [IsAuthenticated, CanTakeQuiz]
    lookup_field = "id"

    def get_queryset(self) -> QuerySet[QuizAttempt]:
        u = self.request.user
        qs = super().get_queryset()
        if u.role == Role.MAIN_ADMIN:
            pass  # cross-school
        else:
            qs = qs.filter(school_id=u.school_id)
            if u.role == Role.STUDENT:
                qs = qs.filter(student_id=u.id)
        # Optional filters
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    # ── Self-healing read ───────────────────────────────────────────────────

    def retrieve(self, request, *args, **kwargs):
        attempt = self.get_object()
        services.expire_attempt_if_due(attempt)
        attempt.refresh_from_db()
        return Response(self.get_serializer(attempt).data)

    # ── STUDENT: get next question ──────────────────────────────────────────

    @extend_schema(responses={200: QuestionStudentSerializer, 204: OpenApiResponse(description="No more questions.")})
    @action(detail=True, methods=["get"], url_path="next")
    def next_question(self, request, id=None):
        attempt = self._owned_in_progress_attempt()
        question = services.request_next_question(attempt)
        if question is None:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(QuestionStudentSerializer(question).data)

    # ── STUDENT: submit one answer ──────────────────────────────────────────

    @extend_schema(
        request=AnswerSubmitSerializer,
        responses={200: dict, 400: _BAD_REQUEST, 404: _NOT_FOUND},
    )
    @action(detail=True, methods=["post"], url_path="answer")
    def answer(self, request, id=None):
        attempt = self._owned_in_progress_attempt()
        ser = AnswerSubmitSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        question = (
            Question.objects
            .filter(school_id=attempt.school_id, id=data["question"])
            .first()
        )
        if question is None:
            raise NotFound("Question not found in your school.")

        try:
            answer_obj: Answer = services.record_answer(
                attempt, question=question, payload=data
            )
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc

        return Response({
            "id": str(answer_obj.id),
            "question": str(answer_obj.question_id),
            "is_correct": answer_obj.is_correct,
            "points_awarded": answer_obj.points_awarded,
        })

    # ── STUDENT: finalise the attempt ───────────────────────────────────────

    @extend_schema(request=None, responses={200: QuizAttemptReadSerializer, 400: _BAD_REQUEST})
    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, id=None):
        attempt = self._owned_attempt()
        try:
            attempt = services.submit_attempt(attempt)
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc
        return Response(self.get_serializer(attempt).data)

    # ── Internals ───────────────────────────────────────────────────────────

    def _owned_in_progress_attempt(self) -> QuizAttempt:
        attempt = self._owned_attempt()
        services.expire_attempt_if_due(attempt)
        attempt.refresh_from_db()
        if attempt.status != QuizAttempt.Status.IN_PROGRESS:
            raise ValidationError({"detail": f"Attempt is {attempt.status}."})
        return attempt

    def _owned_attempt(self) -> QuizAttempt:
        attempt = self.get_object()
        u = self.request.user
        if u.role == Role.STUDENT and attempt.student_id != u.id:
            raise NotFound()  # don't reveal existence
        return attempt


# ── Helpers ─────────────────────────────────────────────────────────────────


def _err(exc: DjangoValidationError) -> str:
    """Normalise Django ValidationError → flat string for DRF response."""
    if hasattr(exc, "messages") and exc.messages:
        return " ".join(str(m) for m in exc.messages)
    return str(exc)
