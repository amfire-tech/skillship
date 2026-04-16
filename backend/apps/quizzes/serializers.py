"""
File:    backend/apps/quizzes/serializers.py
Purpose: DRF serializers for quiz entities — with variants that hide correct answers from students.
Why:     A student calling GET /questions/ must NEVER see correct_option_ids.
Owner:   Vishal
TODO:    - QuestionSerializer (teacher view, full data)
         - QuestionStudentSerializer (hides correct_option_ids)
         - QuizSerializer, QuizAttemptSerializer, AnswerSerializer
"""
