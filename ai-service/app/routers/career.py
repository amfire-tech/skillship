"""
File:    ai-service/app/routers/career.py
Purpose: /career/ask endpoint — CareerPilot agent answers student career questions.
Why:     Feature from proposal Plan 02: personalised career guidance based on quiz history + interests.
Owner:   Navanish
TODO:    POST /career/ask
           body: { student_context, question, history }
           -> calls agents.career_pilot.run(...)
           -> returns { answer, suggested_paths, confidence, citations }
"""
