"""
File:    ai-service/app/routers/reports.py
Purpose: /reports/weekly endpoint — generates the weekly principal report.
Owner:   Navanish
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/reports")


class SchoolMetric(BaseModel):
    """School performance metric."""
    name: str
    value: float


class SchoolSnapshot(BaseModel):
    """School-wide snapshot for report generation."""
    metrics: list[SchoolMetric]
    top_risks: list[str]
    standout_students: list[str]


class WeeklyReportRequest(BaseModel):
    """Request schema for weekly report generation."""
    school_snapshot: SchoolSnapshot


class WeeklyReportResponse(BaseModel):
    """Response schema for weekly report."""
    summary_md: str
    highlights: list[str]
    concerns: list[str]
    recommendations: list[str]


@router.post("/weekly", response_model=WeeklyReportResponse)
async def generate_weekly_report(request: WeeklyReportRequest):
    """
    Generate a weekly principal report based on school metrics and student data.
    
    Args:
        request: School snapshot with metrics, risks, and standout students
        
    Returns:
        Weekly report with summary, highlights, concerns, and recommendations
    """
    # TODO: Implement weekly report generation with analyst_agent
    # -> agents.analyst_agent.weekly(school_snapshot)
    return {
        "summary_md": "",
        "highlights": [],
        "concerns": [],
        "recommendations": []
    }

