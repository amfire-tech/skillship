"""
File:    ai-service/app/agents/tutor_agent.py
Purpose: Tutor agent — answers course / concept questions grounded in school's own content (RAG).
Owner:   Navanish
TODO:    run(student_context, question, course, chat_history):
           - retriever.retrieve(question, course) -> chunks
           - Claude call with chunks in context
           - enforce: "Never give direct answers for graded quizzes; guide instead."
           - return {answer, references}
"""
