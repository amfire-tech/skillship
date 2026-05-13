"""
File:    ai-service/app/agents/tutor_agent.py
Purpose: Tutor agent — answers course/concept questions grounded in school's own content (RAG).
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# from __future__ import annotations
# import uuid
# import logging
# from pathlib import Path
# from typing import Optional
#
# import psycopg
# from google import genai
# from google.genai import types
#
# from app.config import settings
# from app.rag import retriever
#
# logger = logging.getLogger(__name__)
#
# SYSTEM_PROMPT = (
#     Path(__file__).parent.parent / "prompts" / "tutor.md"
# ).read_text(encoding="utf-8")
#
#
# async def run(
#     db: psycopg.AsyncConnection,
#     client: genai.Client,
#     student_context: dict,
#     question: str,
#     course: str,
#     chat_history: list[dict],
#     school_id: uuid.UUID,
#     course_id: Optional[uuid.UUID] = None,
# ) -> dict:
#     chunks = await retriever.retrieve(
#         db=db, client=client,
#         question=question, school_id=school_id, course_id=course_id, k=5,
#     )
#
#     if not chunks:
#         return {
#             "answer": "I couldn't find relevant course material. Please check with your instructor.",
#             "references": [],
#         }
#
#     excerpts_block = "\n\n".join(
#         f"[Excerpt {i+1}]\n{c['chunk_text']}" for i, c in enumerate(chunks)
#     )
#     user_message = (
#         f"Course: {course}\n"
#         f"Student level: {student_context.get('grade_level', 'unknown')}\n\n"
#         f"Relevant course excerpts:\n{excerpts_block}\n\n"
#         f"Question: {question}"
#     )
#
#     contents = [
#         {"role": "model" if m["role"] == "assistant" else "user",
#          "parts": [{"text": m["content"]}]}
#         for m in chat_history[-6:]
#     ]
#     contents.append({"role": "user", "parts": [{"text": user_message}]})
#
#     response = await client.aio.models.generate_content(
#         model=settings.MODEL_NAME,
#         contents=contents,
#         config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
#     )
#
#     return {
#         "answer": response.text,
#         "references": [
#             {"content_id": c["content_id"], "excerpt": c["chunk_text"][:200]}
#             for c in chunks
#         ],
#     }
