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
cp .env.example .env   # fill GEMINI_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --port 8001
# Swagger: http://localhost:8001/docs
```

## Plan 01 AI endpoints

- `POST /api/career/ask` - Career Pilot guidance from student context.
- `POST /api/quiz/generate` - generate MCQ/TF/SHORT questions from topic/context.
- `POST /api/quiz/generate-from-pdf` - generate questions from an uploaded PDF.
- `POST /api/quiz/adaptive-next` - compute next difficulty and generate one question.
- `POST /api/quiz/grade-short` - grade a short answer with feedback.
- `POST /api/content/ingest` - chunk/embed a PDF into pgvector.
- `POST /api/content/search` - school/course-scoped natural-language content search.

## Tests

```bash
pytest
```

## Talking to it from Django

All traffic goes through `backend/apps/ai_bridge/client.py` which sets `X-Internal-Key`.
Do not call this service from the frontend directly.
