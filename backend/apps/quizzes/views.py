"""
File:    backend/apps/quizzes/views.py
Purpose: ViewSets for Question, Quiz, QuizAttempt — with @action endpoints for publish/start/submit.
Owner:   Vishal
TODO:    - QuestionViewSet (teacher-only write)
         - QuizViewSet with @action publish, @action start
         - AttemptViewSet with @action submit (one answer at a time)
         Use QuestionStudentSerializer when request.user.role == STUDENT.
"""
