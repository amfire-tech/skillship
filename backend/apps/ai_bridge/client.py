"""
File:    backend/apps/ai_bridge/client.py
Purpose: HTTP client that talks to the FastAPI ai-service (httpx) — the ONLY place Django calls AI.
Why:     Centralises base URL, auth header, timeout, retry policy. If we swap AI providers later,
         the blast radius stays inside this one file.
Owner:   Navanish
TODO:    class AiClient:
           - __init__ reads settings.AI_SERVICE_URL + AI_SERVICE_INTERNAL_KEY
           - post_json(path, body, timeout=30) with header X-Internal-Key
           - retry 3x with exponential backoff on 5xx / timeout
           - methods: career_roadmap(...), tutor_ask(...), generate_questions(...),
                      tag_content(...), weekly_report(...), risk_scan(...), adaptive_next(...)
"""
