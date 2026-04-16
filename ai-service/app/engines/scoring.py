"""
File:    ai-service/app/engines/scoring.py
Purpose: LLM-assisted grading for SHORT-answer questions (MCQ/TF are graded in Django).
Owner:   Navanish
TODO:    grade_short(question_text, rubric, student_answer) -> {score, feedback}:
           - Prompt with rubric; LLM returns score 0..1 + one-line feedback.
"""
