"""
File:    ai-service/app/routers/tutor.py
Purpose: /tutor/ask — RAG-grounded tutor using Gemini.
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# import uuid
# from typing import Optional
# from fastapi import APIRouter, Depends
# from pydantic import BaseModel
# from app.agents import tutor_agent
# from app.deps import DB, GeminiClient, verify_internal_key
#
# router = APIRouter(prefix="/tutor", dependencies=[Depends(verify_internal_key)])
#
#
# class TutorAskRequest(BaseModel):
#     student_context: dict
#     question: str
#     course: str
#     chat_history: list = []
#     school_id: uuid.UUID
#     course_id: Optional[uuid.UUID] = None
#
#
# class Reference(BaseModel):
#     content_id: str
#     excerpt: str
#
#
# class TutorAskResponse(BaseModel):
#     answer: str
#     references: list[Reference]
#
#
# @router.post("/ask", response_model=TutorAskResponse)
# async def ask_tutor(request: TutorAskRequest, db: DB, client: GeminiClient):
#     return await tutor_agent.run(
#         db=db, client=client,
#         student_context=request.student_context,
#         question=request.question,
#         course=request.course,
#         chat_history=request.chat_history,
#         school_id=request.school_id,
#         course_id=request.course_id,
#     )
