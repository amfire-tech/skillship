"""
File:    ai-service/app/agents/risk_agent.py
Purpose: Risk agent — scans student metrics for at-risk patterns (attendance drop, score drop, disengagement).
Owner:   Navanish
TODO:    scan(students) -> list of signals.
         Hybrid: rules (hard thresholds) + LLM verdict for nuance (e.g. "scores steady but engagement low").
         Each signal: {student_id, level, kind, reason, evidence}.
"""
