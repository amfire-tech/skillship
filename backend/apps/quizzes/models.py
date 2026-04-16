"""
File:    backend/apps/quizzes/models.py
Purpose: QuestionBank, Question, Quiz, QuizAttempt, Answer — the heart of the learning flow.
Why:     Quizzes are the main learning + assessment surface; adaptive logic lives here too.
Owner:   Vishal
TODO:    All inherit TenantModel.

         class QuestionBank(TenantModel):
           - course FK, name, description

         class Question(TenantModel):
           - bank FK, text, type (MCQ/TF/SHORT), options = JSONField (for MCQ),
           - correct_option_ids = JSONField, difficulty (EASY/MEDIUM/HARD), tags = JSONField,
           - ai_generated = BooleanField(default=False)

         class Quiz(TenantModel):
           - course FK, title, status (DRAFT / REVIEW / PUBLISHED / ARCHIVED),
           - is_adaptive = BooleanField, randomize = BooleanField,
           - duration_minutes, total_questions, created_by FK(User)

         class QuizAttempt(TenantModel):
           - quiz FK, student FK(User), started_at, submitted_at, score (float),
           - last_difficulty (for adaptive), answers_json (snapshot)

         class Answer(TenantModel):
           - attempt FK, question FK, selected_option_ids = JSONField,
           - is_correct, time_spent_seconds
"""
