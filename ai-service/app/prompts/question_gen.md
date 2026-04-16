<!--
File:    ai-service/app/prompts/question_gen.md
Purpose: System prompt for the question generation engine.
Owner:   Navanish
-->

# TODO: Write the question-generation prompt

- Input: topic, grade, count, difficulty, types (MCQ/TF/SHORT).
- Output: strict JSON array matching schemas/question.py.
- For MCQ: exactly one correct option unless specified; 3 distractors that are plausible, not silly.
- Tag each question with topic keywords so banks stay searchable.
