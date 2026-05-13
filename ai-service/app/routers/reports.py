"""
File:    ai-service/app/routers/reports.py
Purpose: /reports/weekly — weekly principal report via analyst_agent.
"""

# PLAN 02 ONLY — not in scope for Plan 01. Code commented out.

# from fastapi import APIRouter, Depends
# from pydantic import BaseModel
# from app.agents import analyst_agent
# from app.deps import GeminiClient, verify_internal_key
#
# router = APIRouter(prefix="/reports", dependencies=[Depends(verify_internal_key)])
#
#
# class WeeklyReportRequest(BaseModel):
#     school_snapshot: dict
#
#
# class WeeklyReportResponse(BaseModel):
#     summary_md: str
#     highlights: list[str]
#     concerns: list[str]
#     recommendations: list[str]
#
#
# @router.post("/weekly", response_model=WeeklyReportResponse)
# async def generate_weekly_report(request: WeeklyReportRequest, client: GeminiClient):
#     result = await analyst_agent.weekly(client=client, school_snapshot=request.school_snapshot)
#     return WeeklyReportResponse(**result)
