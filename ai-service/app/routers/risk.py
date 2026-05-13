"""
File:    ai-service/app/routers/risk.py
Purpose: /risk/scan — risk_agent scans students for at-risk signals.
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# from fastapi import APIRouter, Depends
# from pydantic import BaseModel
# from app.agents import risk_agent
# from app.deps import GeminiClient, verify_internal_key
#
# router = APIRouter(prefix="/risk", dependencies=[Depends(verify_internal_key)])
#
#
# class StudentStats(BaseModel):
#     id: str
#     attendance: float
#     quiz_scores: list[float]
#     recent_stats: dict = {}
#
#
# class RiskScanRequest(BaseModel):
#     students: list[StudentStats]
#
#
# class RiskSignal(BaseModel):
#     student_id: str
#     level: str
#     kind: str
#     reason: str
#     evidence: list[str]
#
#
# class RiskScanResponse(BaseModel):
#     signals: list[RiskSignal]
#
#
# @router.post("/scan", response_model=RiskScanResponse)
# async def scan_risk(request: RiskScanRequest, client: GeminiClient):
#     signals = await risk_agent.scan(client=client, students=[s.model_dump() for s in request.students])
#     return RiskScanResponse(signals=signals)
