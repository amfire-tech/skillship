"""
File:    ai-service/app/main.py
Purpose: FastAPI app entrypoint — mounts routers, adds middleware, health check.
Why:     This is the separate Python service that owns all LLM / agent work.
         Django calls THIS service over HTTP — not the other way around.
Owner:   Navanish
TODO:    - app = FastAPI(title="Skillship AI")
         - middleware: verify X-Internal-Key header against AI_SERVICE_INTERNAL_KEY env
         - include_router for: career, tutor, quiz, content, reports, risk
         - GET /healthz -> {"status": "ok", "model": MODEL_NAME}
"""
