"""
File:    backend/apps/ai_bridge/models.py
Purpose: AiJob — persistence for every AI call (audit trail + retry source of truth).
Why:     AI calls cost money and can fail; we need a record so we can replay / bill / debug.
Owner:   Navanish
TODO:    class AiJob(TenantModel):
           - kind (CAREER / TUTOR / QUESTION_GEN / TAG / REPORT / RISK / ADAPTIVE),
           - status (PENDING / RUNNING / DONE / FAILED),
           - request_json, response_json, error (text),
           - model_used, tokens_in, tokens_out, cost_inr, duration_ms,
           - created_by FK(User, null=True)
"""
