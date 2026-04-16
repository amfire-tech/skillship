"""
File:    ai-service/app/engines/question_gen.py
Purpose: Generate N MCQ/TF/SHORT questions for a topic + grade + difficulty using the LLM.
Owner:   Navanish
TODO:    generate(topic, grade, count, difficulty, types) -> list[QuestionDict]:
           - Prompt from prompts/question_gen.md
           - LLM returns JSON schema; validate with schemas.py
           - Each question: {text, type, options, correct_option_ids, difficulty, tags}.
"""
