"""
File:    backend/apps/quizzes/models.py
Purpose: QuestionBank, Question, Quiz, QuizAttempt, Answer — the assessment core.
Owner:   Navanish

Design notes (read before changing anything):

  * Every tenant-scoped table inherits TenantModel → UUID pk + school FK +
    .for_school() manager + (school, created_at) composite index.

  * State machine on Quiz: DRAFT → REVIEW → PUBLISHED → ARCHIVED.
    Transitions are gated in services.py / views.py — never on the model
    directly — so that role-based authorisation can be enforced consistently.

  * Question.options shape: list of {"id": "<short str>", "text": "<str>"}.
    correct_option_ids points into that list by id. For TRUE_FALSE we store
    options as [{"id": "true", "text": "True"}, {"id": "false", "text": "False"}].
    For SHORT_ANSWER we leave options=[] and correct_option_ids=[]; the
    accepted answers live in `accepted_answers` (a normalised list of strings).

  * QuizAttempt stamps `question_order` server-side at start. Refresh /
    re-render uses the same order. For adaptive quizzes the order grows one
    question at a time as the student answers (the adaptive engine picks
    the next id and we append it).

  * QuizAttempt.expires_at is computed at start (started_at + duration). The
    submit endpoint refuses to grade an attempt past expires_at + grace.
    A nightly Celery task (added in jobs/) auto-expires stale IN_PROGRESS rows.

  * Answer carries a denormalised `is_correct` so we can paginate over a
    student's history without re-grading. Grading is server-authoritative —
    we never trust an `is_correct` value from the client payload.
"""

from __future__ import annotations

from django.db import models

from apps.common.models import TenantModel


# ── QuestionBank ────────────────────────────────────────────────────────────


class QuestionBank(TenantModel):
    """A named pool of questions for a course (e.g. 'Algebra basics — Grade 9').

    A bank belongs to one course in one school. Questions live inside a bank;
    a Quiz draws from the bank when its student starts an attempt.
    """

    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.PROTECT,
        related_name="question_banks",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="question_banks_authored",
    )

    class Meta(TenantModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["school", "course", "name"],
                name="qbank_unique_name_per_course",
            ),
        ]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "course"], name="qbank_school_course_idx"),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.course.code})"


# ── Question ────────────────────────────────────────────────────────────────


class Question(TenantModel):
    """One question inside a bank. The shape of `options` varies by `type`."""

    class Type(models.TextChoices):
        MCQ          = "MCQ",          "Multiple Choice"
        TRUE_FALSE   = "TRUE_FALSE",   "True / False"
        SHORT_ANSWER = "SHORT_ANSWER", "Short Answer"

    class Difficulty(models.TextChoices):
        EASY   = "EASY",   "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD   = "HARD",   "Hard"

    bank = models.ForeignKey(
        QuestionBank, on_delete=models.CASCADE, related_name="questions"
    )
    text = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices)
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM, db_index=True
    )

    # MCQ / TF: list of {"id": str, "text": str}. SHORT_ANSWER: [].
    options = models.JSONField(default=list, blank=True)
    # MCQ / TF: list of option ids. SHORT_ANSWER: [].
    correct_option_ids = models.JSONField(default=list, blank=True)
    # SHORT_ANSWER only: normalised acceptable answers (lower-cased, stripped).
    accepted_answers = models.JSONField(default=list, blank=True)

    explanation = models.TextField(blank=True, help_text="Shown to student after submit.")
    tags = models.JSONField(default=list, blank=True)
    points = models.PositiveSmallIntegerField(
        default=1, help_text="Marks awarded for a correct answer."
    )
    ai_generated = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="questions_authored",
    )

    class Meta(TenantModel.Meta):
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "bank", "difficulty"], name="q_school_bank_diff_idx"),
            models.Index(fields=["school", "ai_generated"], name="q_school_ai_idx"),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"[{self.type}/{self.difficulty}] {self.text[:60]}"


# ── Quiz ────────────────────────────────────────────────────────────────────


class Quiz(TenantModel):
    """An assessment a teacher publishes for students.

    Lifecycle (enforced in services.transition_status):
        DRAFT → REVIEW → PUBLISHED → ARCHIVED
        DRAFT → ARCHIVED              (abandon a draft)
        PUBLISHED → ARCHIVED          (retire a live quiz)

    Once any QuizAttempt exists, edits to question selection are blocked —
    `is_locked_for_edits` returns True. Use ARCHIVED + new Quiz to revise.
    """

    class Status(models.TextChoices):
        DRAFT     = "DRAFT",     "Draft"
        REVIEW    = "REVIEW",    "In Review"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED  = "ARCHIVED",  "Archived"

    course = models.ForeignKey(
        "academics.Course", on_delete=models.PROTECT, related_name="quizzes"
    )
    bank = models.ForeignKey(
        QuestionBank,
        on_delete=models.PROTECT,
        related_name="quizzes",
        help_text="The pool of questions an attempt is drawn from.",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT, db_index=True
    )

    is_adaptive = models.BooleanField(default=False)
    randomize_questions = models.BooleanField(default=True)
    randomize_options = models.BooleanField(default=True)

    duration_minutes = models.PositiveSmallIntegerField(default=30)
    total_questions = models.PositiveSmallIntegerField(default=10)
    pass_percentage = models.PositiveSmallIntegerField(default=50)
    attempts_allowed = models.PositiveSmallIntegerField(
        default=1, help_text="0 = unlimited."
    )

    published_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes_authored",
    )

    class Meta(TenantModel.Meta):
        constraints = [
            models.CheckConstraint(
                name="quiz_pass_percentage_valid",
                condition=models.Q(pass_percentage__gte=0) & models.Q(pass_percentage__lte=100),
            ),
            models.CheckConstraint(
                name="quiz_total_questions_positive",
                condition=models.Q(total_questions__gt=0),
            ),
        ]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "course", "status"], name="quiz_school_course_status_idx"),
            models.Index(fields=["school", "status", "published_at"], name="quiz_school_status_pub_idx"),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.status})"


# ── QuizAttempt ─────────────────────────────────────────────────────────────


class QuizAttempt(TenantModel):
    """One student's run of a quiz.

    `question_order` is the canonical sequence of question UUIDs the student
    will see. For non-adaptive quizzes it is filled at start time. For
    adaptive quizzes it is appended to one id at a time as questions are
    served. Either way, the *student never picks the order*.
    """

    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        SUBMITTED   = "SUBMITTED",   "Submitted"
        EXPIRED     = "EXPIRED",     "Expired"

    quiz = models.ForeignKey(Quiz, on_delete=models.PROTECT, related_name="attempts")
    student = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="quiz_attempts"
    )

    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.IN_PROGRESS, db_index=True
    )
    attempt_number = models.PositiveSmallIntegerField(default=1)

    started_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)

    score_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        help_text="0.00–100.00; null until submitted.",
    )
    points_earned = models.PositiveIntegerField(default=0)
    points_total = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveSmallIntegerField(default=0)

    question_order = models.JSONField(
        default=list, blank=True,
        help_text="Ordered list of question UUIDs as strings.",
    )
    last_difficulty = models.CharField(
        max_length=10, blank=True,
        help_text="For adaptive quizzes — passed to /ai/quiz/adaptive-next.",
    )

    class Meta(TenantModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["student", "quiz", "attempt_number"],
                name="attempt_unique_per_student_quiz_n",
            ),
        ]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["school", "student", "status"], name="att_school_stud_status_idx"),
            models.Index(fields=["school", "quiz", "status"], name="att_school_quiz_status_idx"),
            models.Index(fields=["school", "submitted_at"], name="att_school_submitted_idx"),
        ]
        ordering = ["-started_at"]

    def __str__(self) -> str:
        return f"{self.student} → {self.quiz} #{self.attempt_number} ({self.status})"


# ── Answer ──────────────────────────────────────────────────────────────────


class Answer(TenantModel):
    """One answer to one question within an attempt.

    `is_correct` is denormalised and graded server-side by services.grade_answer.
    For SHORT_ANSWER, a Plan 02 path will hit the AI service for fuzzy grading;
    for now we do a normalised string-match against `Question.accepted_answers`.
    """

    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.PROTECT, related_name="+"
    )

    # MCQ / TF: list of selected option ids. SHORT_ANSWER: [].
    selected_option_ids = models.JSONField(default=list, blank=True)
    # SHORT_ANSWER only.
    text_response = models.TextField(blank=True)

    is_correct = models.BooleanField(default=False)
    points_awarded = models.PositiveSmallIntegerField(default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta(TenantModel.Meta):
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="answer_unique_per_attempt_question",
            ),
        ]
        indexes = TenantModel.Meta.indexes + [
            models.Index(fields=["attempt", "answered_at"], name="ans_attempt_at_idx"),
        ]
        ordering = ["answered_at"]

    def __str__(self) -> str:
        return f"{self.attempt_id} → q={self.question_id} correct={self.is_correct}"
