"""
File:    backend/apps/ai_bridge/services.py
Purpose: Wraps AiClient calls with AiJob persistence + error translation.
Why:     Every AI call creates an AiJob row (for audit), then calls ai-service, then saves result.
Owner:   Navanish
TODO:    For each AI feature (career, tutor, generate_questions, tag, report, risk, adaptive):
           - create AiJob(kind, request_json, status=PENDING)
           - try: response = AiClient().xxx(); job.status=DONE; job.response_json=response
           - except: job.status=FAILED; job.error=str(e); raise DomainError
         Return a dict the caller (views.py) can serialize.
"""
