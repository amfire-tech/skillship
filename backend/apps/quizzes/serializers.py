"""
File:    backend/apps/quizzes/serializers.py
Purpose: DRF serializers for QuestionBank, Question, Quiz, QuizAttempt, Answer.
Owner:   Navanish

Two design rules:

  1. The student-facing question shape is *different* from the staff-facing
     one — `correct_option_ids`, `accepted_answers`, and `explanation` are
     stripped. We never let a serializer choose a shape based on a flag at
     read time; instead we expose two distinct classes (`QuestionSerializer`
     for staff, `QuestionStudentSerializer` for students). Easy to audit.

  2. Cross-FK same-school validation is mandatory. A PRINCIPAL of school A
     could otherwise smuggle a course UUID from school B into a payload —
     `_validate_same_school` is the helper that catches it. (Same approach
     as apps/academics/serializers.py.)
"""

from __future__ import annotations

from rest_framework import serializers

from apps.academics.models import Class, Course
from apps.accounts.models import User
from apps.common.permissions import Role

from .models import Answer, Question, QuestionBank, Quiz, QuizAssignment, QuizAttempt


# ── Shared helpers (mirrors academics/serializers.py) ──────────────────────


def _resolve_target_school_id(serializer):
    """The school_id this row will live under — same rule as TenantScopedViewSet."""
    if serializer.instance is not None:
        return serializer.instance.school_id

    request = serializer.context["request"]
    actor = request.user
    if actor.role == Role.MAIN_ADMIN:
        target = request.data.get("school")
        if not target:
            raise serializers.ValidationError(
                {"school": "MAIN_ADMIN must specify `school` when creating tenant-scoped rows."}
            )
        return target
    return actor.school_id


def _validate_same_school(target_school_id, fk_obj, field_name: str):
    if fk_obj is None:
        return
    if str(fk_obj.school_id) != str(target_school_id):
        raise serializers.ValidationError(
            {field_name: f"{field_name} belongs to a different school."}
        )


# ── QuestionBank ────────────────────────────────────────────────────────────


class QuestionBankSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    question_count = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = [
            "id", "school", "course", "name", "description",
            "created_by", "question_count",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "question_count", "created_at", "updated_at"]

    def get_question_count(self, obj) -> int:
        return obj.questions.count()

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("course"), "course")
        return attrs


# ── Question (staff view: full data) ────────────────────────────────────────


class _OptionSerializer(serializers.Serializer):
    """Shape of one option inside Question.options."""
    id = serializers.CharField(max_length=10)
    text = serializers.CharField(max_length=500)


class QuestionSerializer(serializers.ModelSerializer):
    """Staff view — includes `correct_option_ids`, `accepted_answers`, `explanation`."""

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Question
        fields = [
            "id", "school", "bank", "text", "type", "difficulty",
            "options", "correct_option_ids", "accepted_answers",
            "explanation", "tags", "points", "ai_generated",
            "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("bank"), "bank")

        q_type = attrs.get("type") or (self.instance and self.instance.type)
        options = attrs.get("options")
        if options is None and self.instance is not None:
            options = self.instance.options
        correct = attrs.get("correct_option_ids")
        if correct is None and self.instance is not None:
            correct = self.instance.correct_option_ids
        accepted = attrs.get("accepted_answers")
        if accepted is None and self.instance is not None:
            accepted = self.instance.accepted_answers

        self._validate_shape(q_type, options or [], correct or [], accepted or [])
        return attrs

    @staticmethod
    def _validate_shape(q_type: str, options, correct, accepted):
        if q_type == Question.Type.SHORT_ANSWER:
            if options:
                raise serializers.ValidationError(
                    {"options": "SHORT_ANSWER questions must not carry options."}
                )
            if correct:
                raise serializers.ValidationError(
                    {"correct_option_ids": "SHORT_ANSWER must use accepted_answers, not correct_option_ids."}
                )
            if not accepted:
                raise serializers.ValidationError(
                    {"accepted_answers": "SHORT_ANSWER requires at least one accepted answer."}
                )
            return

        # MCQ + TRUE_FALSE share the same option-list shape.
        if not isinstance(options, list) or not options:
            raise serializers.ValidationError({"options": "options must be a non-empty list."})

        seen_ids: set[str] = set()
        for opt in options:
            if not isinstance(opt, dict) or "id" not in opt or "text" not in opt:
                raise serializers.ValidationError(
                    {"options": "each option must be {id, text}."}
                )
            if opt["id"] in seen_ids:
                raise serializers.ValidationError({"options": f"duplicate option id {opt['id']!r}."})
            seen_ids.add(opt["id"])

        if not correct or not all(c in seen_ids for c in correct):
            raise serializers.ValidationError(
                {"correct_option_ids": "every correct id must be present in options."}
            )
        if q_type == Question.Type.TRUE_FALSE and len(correct) != 1:
            raise serializers.ValidationError(
                {"correct_option_ids": "TRUE_FALSE expects exactly one correct id."}
            )


# ── Question (student view: no answers, no explanation) ─────────────────────


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Student-safe shape: never reveals correct answers or accepted_answers.

    Used at attempt time — students never call /questions/ directly.
    """

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    bank = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Question
        fields = ["id", "school", "bank", "text", "type", "difficulty", "options", "points"]
        read_only_fields = fields


# ── Quiz ────────────────────────────────────────────────────────────────────


class QuizSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    bank = serializers.PrimaryKeyRelatedField(
        queryset=QuestionBank.objects.all(),
        pk_field=serializers.UUIDField(),
    )
    created_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    # Denormalised display fields for staff dashboards + approval panel + analytics.
    subject = serializers.CharField(source="course.name", read_only=True)
    school_name = serializers.CharField(source="school.name", read_only=True, default=None)
    created_by_name = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()
    total_attempts = serializers.SerializerMethodField()
    avg_score = serializers.SerializerMethodField()
    pass_rate = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "school", "school_name", "course", "subject", "bank",
            "title", "description", "grade", "section", "status",
            "is_adaptive", "randomize_questions", "randomize_options",
            "duration_minutes", "total_questions", "pass_percentage", "attempts_allowed",
            "certificate_enabled",
            "published_at", "archived_at",
            "created_by", "created_by_name", "question_count",
            "total_attempts", "avg_score", "pass_rate",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "school_name", "subject", "status", "published_at", "archived_at",
            "created_by", "created_by_name", "question_count", "total_attempts", "avg_score",
            "pass_rate", "created_at", "updated_at",
        ]

    def get_created_by_name(self, obj) -> str | None:
        u = obj.created_by
        if not u:
            return None
        return u.get_full_name() or u.username

    def get_question_count(self, obj) -> int:
        # Prefer an annotation set by the viewset; fall back to a count.
        ann = getattr(obj, "question_count_ann", None)
        return ann if ann is not None else obj.bank.questions.count()

    def get_total_attempts(self, obj):
        # Annotated by QuizViewSet.get_queryset; None on un-annotated instances.
        return getattr(obj, "attempts_count_ann", None)

    def get_avg_score(self, obj):
        v = getattr(obj, "avg_score_ann", None)
        return round(float(v), 1) if v is not None else None

    def get_pass_rate(self, obj):
        # Share of submitted attempts that met the quiz's pass_percentage.
        total = getattr(obj, "attempts_count_ann", None)
        passed = getattr(obj, "pass_count_ann", None)
        if not total:
            return None
        return round(passed / total * 100, 1)

    def validate(self, attrs):
        target_school = _resolve_target_school_id(self)
        _validate_same_school(target_school, attrs.get("course"), "course")
        _validate_same_school(target_school, attrs.get("bank"), "bank")

        # bank must serve the same course as the quiz.
        bank = attrs.get("bank") or (self.instance and self.instance.bank)
        course = attrs.get("course") or (self.instance and self.instance.course)
        if bank and course and bank.course_id != course.id:
            raise serializers.ValidationError(
                {"bank": "bank must belong to the same course as the quiz."}
            )
        return attrs


class _AuthoringQuestionSerializer(serializers.Serializer):
    """One inline question as the wizard sends it (options are plain strings)."""

    text = serializers.CharField()
    options = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list,
    )
    correct_answer_index = serializers.IntegerField(required=False, default=0)
    # Short-answer questions send no options; accepted_answers (if any) seed a
    # provisional auto-score before the teacher grades in the Feedback queue.
    accepted_answers = serializers.ListField(
        child=serializers.CharField(allow_blank=True), required=False, default=list,
    )
    difficulty = serializers.CharField(required=False, allow_blank=True, default="")
    explanation = serializers.CharField(required=False, allow_blank=True, default="")
    points = serializers.IntegerField(required=False, default=1, min_value=1)


class QuizAuthoringSerializer(serializers.Serializer):
    """Accepts the teacher/sub-admin wizard payload. The view hands the validated
    data to services.author_quiz, which provisions course + bank + questions +
    quiz and runs the DRAFT→REVIEW transition. Write-only — reads use QuizSerializer."""

    title = serializers.CharField(max_length=200)
    subject = serializers.CharField(max_length=120, required=False, allow_blank=True, default="General")
    grade = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    section = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")
    instructions = serializers.CharField(required=False, allow_blank=True, default="")
    difficulty = serializers.CharField(max_length=10, required=False, allow_blank=True, default="MEDIUM")
    duration_minutes = serializers.IntegerField(required=False, default=30, min_value=1, max_value=600)
    passing_score = serializers.IntegerField(required=False, default=50, min_value=0, max_value=100)
    attempts_allowed = serializers.IntegerField(required=False, default=1, min_value=1, max_value=20)
    shuffle_questions = serializers.BooleanField(required=False, default=True)
    # Teacher opt-in: issue a certificate to students who PASS this quiz.
    certificate_enabled = serializers.BooleanField(required=False, default=False)
    status = serializers.ChoiceField(choices=["DRAFT", "REVIEW"], required=False, default="DRAFT")
    questions = _AuthoringQuestionSerializer(many=True)

    def validate_questions(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one question.")
        return value


class QuizStudentSerializer(serializers.ModelSerializer):
    """Lightweight, read-only quiz shape for STUDENT listings."""

    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    course = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Quiz
        fields = [
            "id", "school", "course", "title", "description",
            "is_adaptive", "duration_minutes", "total_questions",
            "pass_percentage", "attempts_allowed", "certificate_enabled", "published_at",
        ]
        read_only_fields = fields


# ── QuizAttempt + Answer ────────────────────────────────────────────────────


class AnswerReadSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    class Meta:
        model = Answer
        fields = [
            "id", "school", "attempt", "question",
            "selected_option_ids", "text_response",
            "is_correct", "points_awarded", "time_spent_seconds",
            "answered_at",
        ]
        read_only_fields = fields


class AnswerSubmitSerializer(serializers.Serializer):
    """Wire shape for POST /attempts/<id>/answer/."""

    question = serializers.UUIDField()
    selected_option_ids = serializers.ListField(
        child=serializers.CharField(max_length=20),
        required=False,
        default=list,
    )
    text_response = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=2000,
    )
    time_spent_seconds = serializers.IntegerField(required=False, min_value=0, default=0)


class QuizAttemptReadSerializer(serializers.ModelSerializer):
    school = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    quiz = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    student = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())

    # Denormalised display fields for dashboards.
    quiz_title  = serializers.CharField(source="quiz.title", read_only=True)
    quiz_subject = serializers.CharField(source="quiz.course.code", read_only=True)
    quiz_total_questions = serializers.IntegerField(source="quiz.total_questions", read_only=True)
    # score_percent is a model DecimalField — DRF would render it as a STRING
    # ("60.00"), which breaks `typeof score === "number"` checks on the frontend.
    # Expose it (and a `score` alias some dashboards read) as real numbers.
    score_percent = serializers.FloatField(read_only=True)
    score = serializers.SerializerMethodField()
    wrong_count = serializers.SerializerMethodField()
    passed = serializers.SerializerMethodField()
    awaiting_review = serializers.SerializerMethodField()
    # True only when the quiz opted into certificates AND this attempt passed.
    certificate_available = serializers.SerializerMethodField()
    quiz_certificate_enabled = serializers.BooleanField(source="quiz.certificate_enabled", read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            "id", "school", "quiz", "student",
            "quiz_title", "quiz_subject", "quiz_total_questions",
            "status", "attempt_number",
            "started_at", "expires_at", "submitted_at",
            "score_percent", "score", "points_earned", "points_total",
            "correct_count", "wrong_count", "passed", "awaiting_review",
            "certificate_available", "quiz_certificate_enabled",
            "question_order", "last_difficulty",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    # Marks for a quiz with descriptive questions aren't final until the teacher
    # has graded every short answer. While any remain PENDING this attempt is
    # "awaiting review" — and a STUDENT must not see provisional marks yet.
    _GATED_FIELDS = (
        "score_percent", "score", "points_earned", "points_total",
        "correct_count", "wrong_count", "passed", "certificate_available",
    )

    def get_awaiting_review(self, obj: QuizAttempt) -> bool:
        cnt = getattr(obj, "pending_feedback_count_ann", None)
        if cnt is not None:
            return cnt > 0
        return obj.answers.filter(feedback_status=Answer.FeedbackStatus.PENDING).exists()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        req = self.context.get("request")
        is_student = bool(req and getattr(req.user, "role", None) == Role.STUDENT)
        if data.get("awaiting_review") and is_student:
            for key in self._GATED_FIELDS:
                data[key] = None
        return data

    def get_score(self, obj: QuizAttempt):
        return float(obj.score_percent) if obj.score_percent is not None else None

    def get_wrong_count(self, obj: QuizAttempt) -> int:
        # Only meaningful for submitted attempts; answered ≠ correct → wrong.
        if obj.status != QuizAttempt.Status.SUBMITTED:
            return 0
        # `question_order` is the canonical sequence the student saw.
        served = len(obj.question_order or [])
        return max(served - (obj.correct_count or 0), 0)

    def get_passed(self, obj: QuizAttempt) -> bool | None:
        if obj.score_percent is None:
            return None
        pass_pct = getattr(obj.quiz, "pass_percentage", 50)
        return float(obj.score_percent) >= float(pass_pct)

    def get_certificate_available(self, obj: QuizAttempt) -> bool:
        # A certificate exists only when the teacher enabled it for the quiz,
        # the attempt is finalised, and the student passed. Marks gated behind a
        # pending short-answer review don't count yet (handled in to_representation).
        if not getattr(obj.quiz, "certificate_enabled", False):
            return False
        if obj.status != QuizAttempt.Status.SUBMITTED or obj.score_percent is None:
            return False
        pass_pct = getattr(obj.quiz, "pass_percentage", 50)
        return float(obj.score_percent) >= float(pass_pct)


class QuizAttemptDetailSerializer(QuizAttemptReadSerializer):
    """Attempt + a per-question review for the result screen.

    The review reveals the correct option (MCQ/TF) / expected answer (descriptive)
    plus the marks earned per question — appropriate POST-submission so students
    can learn from mistakes. Withheld while `awaiting_review` (teacher still
    grading) and for non-submitted attempts. Parent `to_representation` still
    gates the aggregate score for students until grading is done.
    """

    questions = serializers.SerializerMethodField()

    class Meta(QuizAttemptReadSerializer.Meta):
        fields = QuizAttemptReadSerializer.Meta.fields + ["questions"]
        read_only_fields = fields

    def get_questions(self, obj: QuizAttempt):
        if obj.status != QuizAttempt.Status.SUBMITTED or self.get_awaiting_review(obj):
            return []
        answers = {str(a.question_id): a for a in obj.answers.select_related("question").all()}
        order = [str(x) for x in (obj.question_order or [])] or list(answers.keys())
        review = []
        for qid in order:
            a = answers.get(qid)
            q = a.question if a else None
            if q is None:
                continue
            item = {
                "id": str(q.id),
                "text": q.text,
                "type": q.type,
                "points": q.points,
                "points_awarded": a.points_awarded if a else 0,
                "is_correct": bool(a.is_correct) if a else False,
                "answered": a is not None and bool((a.selected_option_ids or []) or (a.text_response or "").strip()),
            }
            if q.type == Question.Type.SHORT_ANSWER:
                item["student_answer_text"] = (a.text_response if a else "") or ""
                item["expected_answer"] = "; ".join(str(x) for x in (q.accepted_answers or []))
            else:
                sel = (a.selected_option_ids if a else []) or []
                item["options"] = [
                    {
                        "id": o.get("id"),
                        "text": o.get("text"),
                        "is_correct": o.get("id") in (q.correct_option_ids or []),
                        "selected": o.get("id") in sel,
                    }
                    for o in (q.options or [])
                ]
            review.append(item)
        return review


# ── QuizAssignment ──────────────────────────────────────────────────────────


class QuizAssignmentSerializer(serializers.ModelSerializer):
    """Teacher assigns a published quiz to a student OR a class.

    Cross-FK same-school enforcement: the quiz, the target student, and the
    target class must all belong to the same school as the caller.
    """

    school      = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    assigned_by = serializers.PrimaryKeyRelatedField(read_only=True, pk_field=serializers.UUIDField())
    quiz        = serializers.PrimaryKeyRelatedField(queryset=Quiz.objects.all(), pk_field=serializers.UUIDField())
    student     = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.STUDENT),
        required=False, allow_null=True, pk_field=serializers.UUIDField(),
    )
    klass       = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False, allow_null=True, pk_field=serializers.UUIDField(),
    )

    # Denormalised display fields for staff dashboards.
    quiz_title  = serializers.CharField(source="quiz.title", read_only=True)
    student_name = serializers.SerializerMethodField()
    class_label = serializers.SerializerMethodField()

    class Meta:
        model = QuizAssignment
        fields = [
            "id", "school",
            "quiz", "quiz_title",
            "student", "student_name",
            "klass", "class_label",
            "assigned_by",
            "due_at", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "school", "assigned_by", "created_at", "updated_at"]
        # The model's conditional UniqueConstraints (quiz+student / quiz+klass)
        # cannot be expressed as DRF UniqueTogetherValidator because those
        # validators require BOTH fields to be present — which conflicts with
        # the "exactly one target" rule. Trust the DB-level constraints to
        # surface IntegrityError, which the view translates to 400.
        validators = []

    def get_student_name(self, obj):
        return obj.student.get_full_name() if obj.student_id else None

    def get_class_label(self, obj):
        return f"Grade {obj.klass.grade}-{obj.klass.section}" if obj.klass_id else None

    def validate(self, attrs):
        student = attrs.get("student")
        klass = attrs.get("klass")
        if (student is None) == (klass is None):
            raise serializers.ValidationError(
                "Provide exactly one of `student` or `klass` (not both, not neither)."
            )

        quiz: Quiz = attrs["quiz"]
        target_school_id = _resolve_target_school_id(self)

        # Quiz must belong to the same school as the caller (or to the school
        # MAIN_ADMIN explicitly chose).
        _validate_same_school(target_school_id, quiz, "quiz")
        if student:
            _validate_same_school(target_school_id, student, "student")
        if klass:
            _validate_same_school(target_school_id, klass, "klass")

        # Only PUBLISHED quizzes can be assigned — assigning a draft is nonsense.
        if quiz.status != Quiz.Status.PUBLISHED:
            raise serializers.ValidationError({"quiz": "Only PUBLISHED quizzes can be assigned."})

        return attrs
