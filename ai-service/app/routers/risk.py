"""
File:    ai-service/app/routers/risk.py
Purpose: /risk/scan endpoint — runs risk agent on a batch of students, returns signals.
Owner:   Navanish
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/risk")


class StudentStats(BaseModel):
    """Student statistics for risk assessment."""
    id: str
    recent_stats: dict
    attendance: float
    quiz_scores: list[float]


class RiskScanRequest(BaseModel):
    """Request schema for risk scanning."""
    students: list[StudentStats]
    school_id: str


class RiskSignal(BaseModel):
    """Risk signal for a student."""
    student_id: str
    level: str  # "low", "medium", "high", "critical"
    kind: str  # "dropout", "failing", "disengagement", etc.
    reason: str
    evidence: list[str]


class RiskScanResponse(BaseModel):
    """Response schema for risk scanning."""
    signals: list[RiskSignal]


@router.post("/scan", response_model=RiskScanResponse)
async def scan_risk(request: RiskScanRequest):
    """
    Scan batch of students for risk signals using risk agent.
    
    Args:
        request: Batch of students with stats and school context
        
    Returns:
        List of risk signals with severity levels and evidence
    """
    # TODO: Implement risk scanning with risk_agent
    # -> agents.risk_agent.scan(students)
    return {
        "signals": []
    }

