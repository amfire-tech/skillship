<!--
File:    ai-service/README.md
Purpose: Quick-start for the AI service (FastAPI).
Owner:   Navanish
-->

# Skillship — AI Service (FastAPI)

This is the **separate** Python service that owns every LLM + agent call.
Django never imports anthropic/langgraph — it only calls this service via HTTP.

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill ANTHROPIC_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --port 8001
# Swagger: http://localhost:8001/docs
```

## Tests

```bash
pytest
```

## Talking to it from Django

All traffic goes through `backend/apps/ai_bridge/client.py` which sets `X-Internal-Key`.
Do not call this service from the frontend directly.
