"""
File:    ai-service/app/routers/tutor.py
Purpose: /tutor/ask endpoint — student-facing tutor that answers homework/concept questions.
Owner:   Navanish
TODO:    POST /tutor/ask
           body: { student_context, question, course, chat_history }
           -> agents.tutor_agent.run(...) with RAG over course content
           -> { answer, references: [{content_id, excerpt}] }
"""
