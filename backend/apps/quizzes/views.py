"""
File:    backend/apps/quizzes/views.py
Purpose: ViewSets for QuestionBank, Question, Quiz, QuizAttempt.
Owner:   Navanish

Surface map:

  /api/v1/quizzes/banks/                 (CRUD — staff)
  /api/v1/quizzes/questions/             (CRUD — staff)
  /api/v1/quizzes/                       (Quiz CRUD — staff; STUDENT sees PUBLISHED only)
  /api/v1/quizzes/rankings/              (student class/school leaderboard — ?scope=CLASS|SCHOOL)
  /api/v1/quizzes/{id}/submit-for-review/            (TEACHER+)
  /api/v1/quizzes/{id}/return-to-draft/              (REVIEW gate)
  /api/v1/quizzes/{id}/publish/                      (PRINCIPAL/SUB_ADMIN)
  /api/v1/quizzes/{id}/archive/                      (TEACHER+)
  /api/v1/quizzes/{id}/start/                        (STUDENT — start/resume attempt)
  /api/v1/quizzes/{id}/rankings/                     (per-quiz leaderboard)
  /api/v1/quizzes/attempts/              (read — owner student or staff)
  /api/v1/quizzes/attempts/summary/                  (STUDENT — dashboard hero stats)
  /api/v1/quizzes/attempts/{id}/next/                (STUDENT — next question)
  /api/v1/quizzes/attempts/{id}/answer/              (STUDENT — submit one answer)
  /api/v1/quizzes/attempts/{id}/submit/              (STUDENT — finalise)

All views inherit `TenantScopedViewSet` for school filtering on read AND
school-stamping on create. Role gates are applied via permissions.py classes.
"""

from __future__ import annotations

import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Avg, Count, F, Q, QuerySet
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.common.permissions import Role
from apps.common.viewsets import TenantScopedViewSet

from . import services
from .models import Answer, Question, QuestionBank, Quiz, QuizAssignment, QuizAttempt
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
    QuizAssignmentSerializer,
    QuizAttemptDetailSerializer,
    QuizAttemptReadSerializer,
    QuizAuthoringSerializer,
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

    # ── CSV bulk import (Phase 4.4) ─────────────────────────────────────────

    @extend_schema(
        request={"multipart/form-data": {"type": "object", "properties": {"file": {"type": "string", "format": "binary"}}}},
        responses={200: dict, 400: _BAD_REQUEST},
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="import-csv",
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_csv(self, request, id=None):
        """
        POST /api/v1/quizzes/banks/{id}/import-csv/

        Multipart form with a `file` field. Each row becomes a Question.
        Required columns: `text, type, difficulty, points`
        MCQ rows: `option_a, option_b, option_c, option_d, correct` (correct = A/B/C/D)
        TRUE_FALSE rows: `correct` = "True" or "False"
        SHORT_ANSWER rows: `accepted_answers` = pipe-separated accepted texts
        Optional: `tags` (pipe-separated), `explanation`

        Response: {created: N, errors: [{row, message}], total_rows: N}
        """
        from . import services as _qsvc  # late import to avoid cycle

        bank: QuestionBank = self.get_object()
        upload = request.FILES.get("file")
        if upload is None:
            raise ValidationError({"file": "CSV file is required."})
        if upload.size and upload.size > 5 * 1024 * 1024:
            raise ValidationError({"file": "CSV must be 5 MB or smaller."})

        try:
            text = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise ValidationError({"file": "CSV must be UTF-8 encoded."}) from exc

        result = _qsvc.import_questions_csv(bank=bank, created_by=request.user, csv_text=text)
        return Response(result)


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

    queryset = Quiz.objects.select_related("course", "bank", "school", "created_by").all()
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
        # Optional ?status=REVIEW filter — the approval panel relies on this to
        # show only pending quizzes (ignored values are silently skipped).
        status_param = self.request.query_params.get("status")
        if status_param and self.request.user.role != Role.STUDENT:
            wanted = status_param.upper()
            if wanted in Quiz.Status.values:
                qs = qs.filter(status=wanted)
        # Display annotations consumed by staff dashboards + analytics:
        # question count, number of submitted attempts, and average score.
        # distinct=True keeps the question/attempt joins from inflating counts.
        submitted = Q(attempts__status=QuizAttempt.Status.SUBMITTED)
        passed = submitted & Q(attempts__score_percent__gte=F("pass_percentage"))
        qs = qs.annotate(
            question_count_ann=Count("bank__questions", distinct=True),
            attempts_count_ann=Count("attempts", filter=submitted, distinct=True),
            avg_score_ann=Avg("attempts__score_percent", filter=submitted),
            pass_count_ann=Count("attempts", filter=passed, distinct=True),
        )
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

    @extend_schema(request=QuizAuthoringSerializer, responses={201: QuizSerializer, 400: _BAD_REQUEST})
    @action(detail=False, methods=["post"], url_path="authoring",
            permission_classes=[IsAuthenticated, CanAuthorContent])
    def authoring(self, request):
        """One-shot wizard create: provision course + bank + questions + quiz and
        run the DRAFT→REVIEW transition. The wizard sends a self-contained quiz;
        services.author_quiz bridges it to the course/bank data model."""
        self._require_author()
        ser = QuizAuthoringSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        if self._user_is_main_admin():
            school_id = request.data.get("school")
            if not school_id:
                raise ValidationError({"school": "MAIN_ADMIN must specify a target school."})
        else:
            school_id = request.user.school_id

        try:
            quiz = services.author_quiz(
                actor=request.user, school_id=school_id, data=ser.validated_data,
            )
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc
        return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)

    @extend_schema(responses={200: QuestionSerializer(many=True)})
    @action(detail=True, methods=["get"], url_path="questions")
    def questions(self, request, id=None):
        """Questions for this quiz (drawn from its bank).

        - STUDENT: answer-free shape (no correct_option_ids), limited to
          `total_questions`, shuffled when `randomize_questions` is on. Only
          reachable for PUBLISHED quizzes (get_object is status-scoped).
        - Staff: full shape WITH correct answers — used by the approval panel
          to review content before publishing.
        """
        quiz = self.get_object()
        pool = list(quiz.bank.questions.all())
        if request.user.role == Role.STUDENT:
            import random
            if quiz.randomize_questions:
                random.shuffle(pool)
            pool = pool[: quiz.total_questions or len(pool)]
            data = QuestionStudentSerializer(pool, many=True).data
        else:
            data = QuestionSerializer(pool, many=True).data
        return Response(data)

    @extend_schema(request=None, responses={201: OpenApiResponse(description="Scored attempt.")})
    @action(detail=True, methods=["post"], url_path="attempts",
            permission_classes=[IsAuthenticated, CanReadQuiz])
    def attempts(self, request, id=None):
        """Student submits all answers at once ({question_id: option_id}); we
        grade server-side and return the score."""
        quiz = self.get_object()
        if request.user.role != Role.STUDENT:
            raise ValidationError({"detail": "Only students can attempt a quiz."})
        try:
            attempt = services.submit_full_attempt(
                quiz=quiz, student=request.user, answers=request.data.get("answers") or {},
            )
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc
        # If the quiz has descriptive questions, marks aren't final until the
        # teacher grades them — withhold the provisional score from the student.
        awaiting = attempt.answers.filter(
            feedback_status=Answer.FeedbackStatus.PENDING
        ).exists()
        if awaiting:
            return Response(
                {"id": str(attempt.id), "awaiting_review": True},
                status=status.HTTP_201_CREATED,
            )
        return Response({
            "id": str(attempt.id),
            "awaiting_review": False,
            "score_percent": float(attempt.score_percent),
            "points_earned": attempt.points_earned,
            "points_total": attempt.points_total,
            "correct_count": attempt.correct_count,
            "total_questions": len(attempt.question_order),
            "passed": float(attempt.score_percent) >= quiz.pass_percentage,
        }, status=status.HTTP_201_CREATED)

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

    # ── Rankings / leaderboard ──────────────────────────────────────────────

    @extend_schema(
        responses={200: OpenApiResponse(description="Ordered leaderboard of best attempts per student.")},
    )
    @action(detail=True, methods=["get"], url_path="rankings")
    def rankings(self, request, id=None):
        """
        GET /api/v1/quizzes/{id}/rankings/?limit=20

        One row per student — their **best submitted attempt** for this quiz.
        Tie-breaker on equal scores is earlier submission time.
        Scoped to the quiz's school (tenant isolation is enforced by `get_object`).

        STUDENT callers see the same board so they can locate themselves;
        if their best attempt is outside the top-N, a `self` row is appended.
        """
        quiz = self.get_object()

        try:
            limit = int(request.query_params.get("limit", 20))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 200))

        # Postgres-only `distinct('student_id')` pattern — best row per student.
        # The order_by prefix must lead with the distinct column.
        best_per_student = list(
            QuizAttempt.objects
            .filter(
                school_id=quiz.school_id,
                quiz_id=quiz.id,
                status=QuizAttempt.Status.SUBMITTED,
            )
            .select_related("student")
            .order_by("student_id", "-score_percent", "submitted_at")
            .distinct("student_id")
        )

        # Now re-sort across the whole set on score / time-to-submit.
        best_per_student.sort(
            key=lambda a: (
                -(float(a.score_percent) if a.score_percent is not None else -1.0),
                a.submitted_at or a.started_at,
            )
        )

        def row(rank: int, a: QuizAttempt) -> dict:
            duration_s = None
            if a.submitted_at and a.started_at:
                duration_s = int((a.submitted_at - a.started_at).total_seconds())
            return {
                "rank":           rank,
                "attempt_id":     str(a.id),
                "student_id":     str(a.student_id),
                "student_name":   a.student.get_full_name() or a.student.username,
                "score_percent":  float(a.score_percent) if a.score_percent is not None else None,
                "points_earned": a.points_earned,
                "points_total":  a.points_total,
                "correct_count": a.correct_count,
                "duration_seconds": duration_s,
                "submitted_at": a.submitted_at,
            }

        top = [row(i + 1, a) for i, a in enumerate(best_per_student[:limit])]

        body: dict = {
            "quiz_id":  str(quiz.id),
            "count":    len(best_per_student),
            "limit":    limit,
            "results":  top,
        }

        # Locate the requesting student if outside the top-N.
        if request.user.role == Role.STUDENT:
            self_idx = next(
                (i for i, a in enumerate(best_per_student) if a.student_id == request.user.id),
                None,
            )
            if self_idx is not None and self_idx >= limit:
                body["self"] = row(self_idx + 1, best_per_student[self_idx])

        return Response(body)

    # ── Student leaderboard (class / school) ────────────────────────────────

    @extend_schema(responses={200: OpenApiResponse(description="Ranked student leaderboard.")})
    @action(detail=False, methods=["get"], url_path="rankings",
            permission_classes=[IsAuthenticated])
    def student_rankings(self, request):
        """GET /api/v1/quizzes/rankings/?scope=CLASS|SCHOOL

        One ranked row per student (by average score) for the caller's class or
        whole school. Powers the student Rankings page. Tenant-scoped: a caller
        only ever sees their own school; CLASS scope narrows to the student's
        current class. Returns a plain list the frontend's `asArray` consumes.
        """
        from apps.academics.models import Enrollment

        u = request.user
        if u.school_id is None:
            return Response([])  # MAIN_ADMIN has no school / class context.

        scope = (request.query_params.get("scope") or "CLASS").upper()
        klass_id = None
        if scope == "CLASS":
            enr = (
                Enrollment.objects.filter(student=u, withdrawn_on__isnull=True)
                .order_by("-enrolled_on")
                .first()
            )
            # A staff caller (or an unenrolled student) has no class → fall back
            # to a school-wide board rather than an empty one.
            klass_id = enr.klass_id if enr is not None else None

        rows = services.student_leaderboard(school_id=u.school_id, klass_id=klass_id)
        return Response(rows)

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

    def get_serializer_class(self):
        # The detail view adds the per-question review (correct answers + marks).
        if self.action == "retrieve":
            return QuizAttemptDetailSerializer
        return QuizAttemptReadSerializer

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
        # Count short answers still awaiting a teacher's grade — drives
        # `awaiting_review` so a student's marks stay hidden until grading is done.
        qs = qs.annotate(
            pending_feedback_count_ann=Count(
                "answers",
                filter=Q(answers__feedback_status=Answer.FeedbackStatus.PENDING),
                distinct=True,
            )
        )
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

    # ── STUDENT: dashboard summary ──────────────────────────────────────────

    @extend_schema(responses={200: OpenApiResponse(description="Attempt summary for the dashboard hero.")})
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """GET /api/v1/quizzes/attempts/summary/

        Aggregates the requesting user's own quiz activity — completed count,
        average score, and the prior-month figures the dashboard uses for the
        "vs last month" deltas. Drives the student My Learning hero cards.
        """
        return Response(services.attempt_summary(request.user))

    # ── Staff: short-answer feedback queue ──────────────────────────────────

    @extend_schema(responses={200: OpenApiResponse(description="Short-answer responses awaiting / done review.")})
    @action(detail=False, methods=["get"], url_path="pending-feedback")
    def pending_feedback(self, request):
        """
        GET /api/v1/quizzes/attempts/pending-feedback/

        Short-answer responses in submitted attempts that a teacher reviews.
        - TEACHER     → only their assigned students' answers.
        - PRINCIPAL / SUB_ADMIN → every short answer in their school.
        - MAIN_ADMIN  → all schools.
        Returns both PENDING and FINALISED so the UI can tab between them.
        """
        u = request.user
        if u.role == Role.STUDENT:
            raise PermissionDenied("Students cannot view the feedback queue.")

        from django.db.models import Prefetch
        from apps.academics.models import Enrollment

        answers = (
            Answer.objects
            .filter(
                question__type=Question.Type.SHORT_ANSWER,
                attempt__status=QuizAttempt.Status.SUBMITTED,
            )
            .select_related("attempt", "attempt__quiz", "attempt__student", "question")
            .prefetch_related(Prefetch(
                "attempt__student__enrollments",
                queryset=Enrollment.objects.select_related("klass").order_by("-enrolled_on"),
                to_attr="recent_enrollments",
            ))
        )
        if u.role != Role.MAIN_ADMIN:
            answers = answers.filter(school_id=u.school_id)
            if u.role == Role.TEACHER:
                answers = answers.filter(attempt__student__assigned_teacher_id=u.id)
        # PENDING first, then most-recently submitted.
        answers = answers.order_by("feedback_status", "-attempt__submitted_at")
        return Response([_feedback_item(a) for a in answers])

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


# ── QuizAssignment ──────────────────────────────────────────────────────────


class QuizAssignmentViewSet(TenantScopedViewSet):
    """
    /api/v1/quizzes/assignments/

    Teachers + Principals + SubAdmins can create / list / delete assignments.
    Students see only the assignments addressed to them (directly via
    `student=me` or transitively via a `klass` they're enrolled in).
    """

    queryset = QuizAssignment.objects.select_related(
        "quiz", "student", "klass", "klass__academic_year",
    ).all()
    serializer_class = QuizAssignmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "head", "options", "post", "delete"]
    lookup_field = "id"

    def get_queryset(self) -> QuerySet[QuizAssignment]:
        u = self.request.user
        qs = super().get_queryset()
        if u.role == Role.MAIN_ADMIN:
            pass  # cross-school
        elif u.role == Role.STUDENT:
            # Direct assignments + class assignments where I'm currently enrolled.
            from apps.academics.models import Enrollment
            enrolled_classes = Enrollment.objects.filter(
                school_id=u.school_id, student_id=u.id, withdrawn_on__isnull=True,
            ).values_list("klass_id", flat=True)
            qs = qs.filter(school_id=u.school_id).filter(
                Q(student_id=u.id) | Q(klass_id__in=list(enrolled_classes))
            )
        else:
            # Teachers + principals + sub-admins see everything in their school.
            qs = qs.filter(school_id=u.school_id)

        # Optional filters
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)
        klass_id = self.request.query_params.get("klass")
        if klass_id:
            qs = qs.filter(klass_id=klass_id)
        return qs

    def perform_create(self, serializer):
        u = self.request.user
        if u.role not in {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}:
            raise ValidationError({"detail": "Only staff can assign quizzes."})
        if self._user_is_main_admin():
            school_id = self.request.data.get("school")
        else:
            school_id = u.school_id
        serializer.save(school_id=school_id, assigned_by=u)

    def perform_destroy(self, instance):
        u = self.request.user
        if u.role not in {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}:
            raise ValidationError({"detail": "Only staff can revoke assignments."})
        instance.delete()


# ── Short-answer feedback (teacher grades one Answer) ───────────────────────


_STAFF_FEEDBACK_ROLES = {Role.TEACHER, Role.PRINCIPAL, Role.SUB_ADMIN, Role.MAIN_ADMIN}


def _student_class_label(student) -> str | None:
    """'Grade 9-A' from the student's latest enrolment, or None.

    Uses the view's prefetch (`recent_enrollments`) when present so the queue
    stays N+1-free; falls back to a single query for the one-off PATCH path.
    """
    from apps.academics.models import Enrollment

    enr = getattr(student, "recent_enrollments", None)
    if enr is None:
        enr = list(
            Enrollment.objects.filter(student=student)
            .select_related("klass").order_by("-enrolled_on")
        )
    klass = next((e.klass for e in enr if e.klass_id), None)
    return f"Grade {klass.grade}-{klass.section}" if klass else None


def _feedback_item(a: Answer) -> dict:
    """Flatten one short-answer Answer into the shape the Feedback UI expects."""
    q = a.question
    student = a.attempt.student
    return {
        "id":              str(a.id),
        "quiz_id":         str(a.attempt.quiz_id),
        "quiz_title":      a.attempt.quiz.title,
        "student_id":      str(a.attempt.student_id),
        "student_name":    student.get_full_name() or student.username,
        "student_class":   _student_class_label(student),
        "student_roll":    student.admission_number or None,
        "question_text":   q.text,
        "answer_text":     a.text_response,
        "expected_answer": "; ".join(str(x) for x in (q.accepted_answers or [])),
        "max_marks":       q.points,            # the question is worth this many marks
        "score":           a.teacher_score,     # marks the teacher awarded (null until graded)
        "feedback":        a.teacher_feedback,
        "status":          a.feedback_status,
        "submitted_at":    a.attempt.submitted_at,
    }


class AnswerFeedbackView(APIView):
    """PATCH /api/v1/quizzes/answers/{id}/feedback/

    A teacher (or principal / sub-admin / main-admin) records a score + written
    feedback for one short-answer response. The parent attempt's aggregate
    score is recomputed so the student's result reflects the human grade.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, id=None):
        u = request.user
        if u.role not in _STAFF_FEEDBACK_ROLES:
            raise PermissionDenied("Only staff can grade short answers.")

        qs = Answer.objects.select_related("question", "attempt", "attempt__student", "attempt__quiz")
        if u.role != Role.MAIN_ADMIN:
            qs = qs.filter(school_id=u.school_id)
            if u.role == Role.TEACHER:
                qs = qs.filter(attempt__student__assigned_teacher_id=u.id)
        answer = qs.filter(id=id).first()
        if answer is None:
            raise NotFound("Short-answer response not found in your scope.")

        try:
            answer = services.finalise_short_answer_feedback(
                answer=answer,
                actor=u,
                marks=request.data.get("marks", request.data.get("score", 0)),
                feedback=request.data.get("feedback", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError({"detail": _err(exc)}) from exc
        return Response(_feedback_item(answer))


# ── Helpers ─────────────────────────────────────────────────────────────────


def _err(exc: DjangoValidationError) -> str:
    """Normalise Django ValidationError → flat string for DRF response."""
    if hasattr(exc, "messages") and exc.messages:
        return " ".join(str(m) for m in exc.messages)
    return str(exc)
