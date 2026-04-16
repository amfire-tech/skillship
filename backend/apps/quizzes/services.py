"""
File:    backend/apps/quizzes/services.py
Purpose: Quiz workflow logic — publish, start attempt, submit answer, finalize, adaptive next-question.
Why:     These are state transitions with rules (can't submit to archived quiz, can't re-attempt, etc.)
         — they MUST be in one place, not scattered across views.
Owner:   Vishal
TODO:    - publish_quiz(quiz, actor): DRAFT/REVIEW → PUBLISHED, validates question count > 0
         - start_attempt(student, quiz) -> QuizAttempt (prevents double attempts if policy says so)
         - submit_answer(attempt, question, selected_option_ids) — auto-grades MCQ/TF, updates difficulty
         - finalize_attempt(attempt) — computes final score + timestamps
         - next_adaptive_question(attempt) — calls ai_bridge.adaptive_next() to pick next difficulty
"""
