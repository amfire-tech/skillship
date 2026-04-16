"""
File:    ai-service/app/routers/risk.py
Purpose: /risk/scan endpoint — runs risk agent on a batch of students, returns signals.
Owner:   Navanish
TODO:    POST /risk/scan
           body: { students: [{id, recent_stats, attendance, quiz_scores}], school_id }
           -> agents.risk_agent.scan(students)
           -> { signals: [{student_id, level, kind, reason, evidence}] }
"""
