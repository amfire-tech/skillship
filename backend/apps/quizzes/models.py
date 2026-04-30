"""
File:    backend/apps/quizzes/models.py
Purpose: QuestionBank, Question, Quiz, QuizAttempt, Answer — the heart of the learning flow.
Owner:   Vishal
"""

from __future__ import annotations

from django.db import models

from apps.common.models import TenantModel


class QuestionBank(TenantModel):
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.CASCADE,
        related_name="question_banks",
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_banks",
    )

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="quizzes_que_school__bacf20_idx"),
            models.Index(fields=["school", "course"], name="qbank_school_course_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "course", "name"],
                name="qbank_unique_name_per_course",
            ),
        ]

    def __str__(self):
        return self.name


class Question(TenantModel):
    class Type(models.TextChoices):
        MCQ = "MCQ", "Multiple Choice"
        TF = "TF", "True / False"
        SHORT = "SHORT", "Short Answer"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    bank = models.ForeignKey(
        QuestionBank,
        on_delete=models.CASCADE,
        related_name="questions",
    )
    text = models.TextField()
    type = models.CharField(max_length=10, choices=Type.choices)
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM
    )
    options = models.JSONField(default=list)
    correct_option_ids = models.JSONField(default=list)
    accepted_answers = models.JSONField(default=list)
    explanation = models.TextField(blank=True)
    tags = models.JSONField(default=list)
    points = models.PositiveSmallIntegerField(default=1)
    ai_generated = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_questions",
    )

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="quizzes_que_school__29e5f6_idx"),
            models.Index(fields=["school", "bank", "difficulty"], name="q_school_bank_diff_idx"),
            models.Index(fields=["school", "ai_generated"], name="q_school_ai_idx"),
        ]

    def __str__(self):
        return f"{self.type} — {self.text[:60]}"


class Quiz(TenantModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        REVIEW = "REVIEW", "Under Review"
        PUBLISHED = "PUBLISHED", "Published"
        ARCHIVED = "ARCHIVED", "Archived"

    bank = models.ForeignKey(
        QuestionBank,
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    course = models.ForeignKey(
        "academics.Course",
        on_delete=models.CASCADE,
        related_name="quizzes",
    )
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_quizzes",
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    is_adaptive = models.BooleanField(default=False)
    randomize_questions = models.BooleanField(default=True)
    randomize_options = models.BooleanField(default=True)
    duration_minutes = models.PositiveSmallIntegerField(default=30)
    total_questions = models.PositiveSmallIntegerField(default=10)
    pass_percentage = models.PositiveSmallIntegerField(default=40)
    attempts_allowed = models.PositiveSmallIntegerField(default=1)
    published_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta(TenantModel.Meta):
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="quizzes_qui_school__4d2bd1_idx"),
            models.Index(fields=["school", "course", "status"], name="quiz_school_course_status_idx"),
            models.Index(fields=["school", "status", "published_at"], name="quiz_school_status_pub_idx"),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class QuizAttempt(TenantModel):
    class Status(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        SUBMITTED = "SUBMITTED", "Submitted"
        TIMED_OUT = "TIMED_OUT", "Timed Out"
        ABANDONED = "ABANDONED", "Abandoned"

    class Difficulty(models.TextChoices):
        EASY = "EASY", "Easy"
        MEDIUM = "MEDIUM", "Medium"
        HARD = "HARD", "Hard"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.IN_PROGRESS
    )
    attempt_number = models.PositiveSmallIntegerField(default=1)
    started_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    submitted_at = models.DateTimeField(null=True, blank=True)
    score_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    points_earned = models.PositiveIntegerField(default=0)
    points_total = models.PositiveIntegerField(default=0)
    correct_count = models.PositiveSmallIntegerField(default=0)
    question_order = models.JSONField(default=list)
    last_difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM
    )

    class Meta(TenantModel.Meta):
        ordering = ["-started_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="quizzes_qui_school__b7f09d_idx"),
            models.Index(fields=["school", "quiz", "status"], name="att_school_quiz_status_idx"),
            models.Index(fields=["school", "student", "status"], name="att_school_stud_status_idx"),
            models.Index(fields=["school", "submitted_at"], name="att_school_submitted_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "quiz", "attempt_number"],
                name="attempt_unique_per_student_quiz_n",
            ),
        ]

    def __str__(self):
        return f"{self.student} → {self.quiz.title} (attempt {self.attempt_number})"


class Answer(TenantModel):
    attempt = models.ForeignKey(
        QuizAttempt, on_delete=models.CASCADE, related_name="answers"
    )
    question = models.ForeignKey(
        Question, on_delete=models.CASCADE, related_name="answers"
    )
    selected_option_ids = models.JSONField(default=list)
    text_response = models.TextField(blank=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.PositiveSmallIntegerField(default=0)
    time_spent_seconds = models.PositiveIntegerField(default=0)
    answered_at = models.DateTimeField()

    class Meta(TenantModel.Meta):
        ordering = ["answered_at"]
        indexes = [
            models.Index(fields=["school", "created_at"], name="quizzes_ans_school__55d2a9_idx"),
            models.Index(fields=["attempt", "answered_at"], name="ans_attempt_at_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["attempt", "question"],
                name="answer_unique_per_attempt_question",
            ),
        ]

    def __str__(self):
        return f"Answer to {self.question_id} in attempt {self.attempt_id}"
