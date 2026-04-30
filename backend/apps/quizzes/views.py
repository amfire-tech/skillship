"""
File:    backend/apps/quizzes/views.py
Purpose: ViewSets for Question, Quiz, QuizAttempt — with @action endpoints for publish/start/submit.
Owner:   Vishal
"""

from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import IsSchoolStaff, IsStudent, IsTeacher
from apps.common.viewsets import TenantScopedViewSet

from .models import Answer, Question, QuestionBank, Quiz, QuizAttempt
from .serializers import (
    AnswerSerializer,
    AnswerSubmitSerializer,
    QuestionBankSerializer,
    QuestionSerializer,
    QuestionStudentSerializer,
    QuizAttemptSerializer,
    QuizSerializer,
)
from . import services


# ── QuestionBank ──────────────────────────────────────────────────────────────


class QuestionBankViewSet(TenantScopedViewSet):
    serializer_class = QuestionBankSerializer
    queryset = QuestionBank.objects.select_related("course", "created_by")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsSchoolStaff()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)


# ── Question ──────────────────────────────────────────────────────────────────


class QuestionViewSet(TenantScopedViewSet):
    queryset = Question.objects.select_related("bank", "created_by")

    def get_serializer_class(self):
        if self.request.user.role == "STUDENT":
            return QuestionStudentSerializer
        return QuestionSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsSchoolStaff()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)


# ── Quiz ──────────────────────────────────────────────────────────────────────


class QuizViewSet(TenantScopedViewSet):
    serializer_class = QuizSerializer
    queryset = Quiz.objects.select_related("bank", "course", "created_by")

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [IsSchoolStaff()]
        if self.action == "start":
            return [IsStudent()]
        return [IsTeacher()]

    def perform_create(self, serializer):
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
            serializer.save(school_id=school_id, created_by=self.request.user)
        else:
            serializer.save(school_id=self.request.user.school_id, created_by=self.request.user)

    @action(detail=True, methods=["post"], url_path="publish")
    def publish(self, request, pk=None):
        quiz = self.get_object()
        updated = services.publish_quiz(quiz, actor=request.user)
        return Response(QuizSerializer(updated).data)

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        quiz = self.get_object()
        updated = services.archive_quiz(quiz)
        return Response(QuizSerializer(updated).data)

    @action(detail=True, methods=["post"], url_path="start", permission_classes=[IsStudent])
    def start(self, request, pk=None):
        quiz = self.get_object()
        attempt = services.start_attempt(student=request.user, quiz=quiz)
        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


# ── QuizAttempt ───────────────────────────────────────────────────────────────


class QuizAttemptViewSet(TenantScopedViewSet):
    serializer_class = QuizAttemptSerializer
    http_method_names = ["get", "head", "options", "post"]
    queryset = QuizAttempt.objects.none()

    def get_queryset(self):
        qs = QuizAttempt.objects.select_related("quiz", "student")
        # Students only see their own attempts
        if self.request.user.role == "STUDENT":
            qs = qs.filter(student=self.request.user)
        return qs

    def get_permissions(self):
        if self.action in ("answer", "finalize", "adaptive_next"):
            return [IsStudent()]
        return [IsSchoolStaff()]

    @action(detail=True, methods=["post"], url_path="answer")
    def answer(self, request, pk=None):
        attempt = self.get_object()
        serializer = AnswerSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        question = Question.objects.filter(
            school=attempt.school,
            id=data["question_id"],
        ).first()
        if question is None:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

        ans = services.submit_answer(
            attempt=attempt,
            question=question,
            selected_option_ids=data["selected_option_ids"],
            text_response=data["text_response"],
            time_spent_seconds=data["time_spent_seconds"],
        )
        return Response(AnswerSerializer(ans).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="finalize")
    def finalize(self, request, pk=None):
        attempt = self.get_object()
        updated = services.finalize_attempt(attempt)
        return Response(QuizAttemptSerializer(updated).data)

    @action(detail=True, methods=["get"], url_path="adaptive-next")
    def adaptive_next(self, request, pk=None):
        attempt = self.get_object()
        result = services.next_adaptive_question(attempt)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="answers")
    def answers(self, request, pk=None):
        attempt = self.get_object()
        answers = Answer.objects.filter(attempt=attempt).select_related("question")
        return Response(AnswerSerializer(answers, many=True).data)
