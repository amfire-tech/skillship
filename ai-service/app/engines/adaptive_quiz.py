"""
File:    ai-service/app/engines/adaptive_quiz.py
Purpose: Adaptive difficulty engine — picks next question difficulty given attempt history.
Why:     Core Plan 02 feature — quizzes adapt to each student.
Owner:   Navanish
TODO:    next(attempt_history, last_difficulty, last_correct) -> {question, difficulty}:
           - IRT-lite: streak of correct -> harder; streak of wrong -> easier.
           - Start at MEDIUM; never jump more than one level in one step.
           - Pool questions from bank filtered by (course, target_difficulty).
"""
