"""
File:    backend/apps/analytics/models.py
Purpose: Pre-aggregated tables + risk signals — powers dashboards fast.
Why:     Running aggregate queries on live data slows dashboards; we store daily/weekly rollups instead.
         Risk signals are rows produced by risk_agent (AI service) and consumed by principals/parents.
Owner:   Vishal
TODO:    class StudentDailyStats(TenantModel):
           - student FK(User), date, quizzes_taken, avg_score, time_spent_seconds
           - Meta.unique_together = (student, date)

         class ClassWeeklyStats(TenantModel):
           - klass FK, week_start_date, avg_score, at_risk_count

         class RiskSignal(TenantModel):
           - student FK(User), level (LOW/MED/HIGH), kind (ATTENDANCE/ACADEMIC/BEHAVIOR),
           - reason (text), evidence_json, acknowledged_by FK(User, null=True)
"""
