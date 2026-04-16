"""
File:    ai-service/app/routers/quiz.py
Purpose: /quiz/generate + /quiz/adaptive-next endpoints.
Owner:   Navanish
TODO:    POST /quiz/generate
           body: { topic, grade, count, difficulty, types }
           -> engines.question_gen.generate(...) -> list of Question dicts

         POST /quiz/adaptive-next
           body: { attempt_history, last_difficulty, last_correct }
           -> engines.adaptive_quiz.next(...) -> { question, difficulty }
"""
