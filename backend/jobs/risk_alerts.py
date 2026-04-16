"""
File:    backend/jobs/risk_alerts.py
Purpose: Nightly Celery job — runs risk agent for each school, creates RiskSignal rows + notifications.
Why:     Principals want proactive alerts when a student is falling behind, without staring at dashboards.
Owner:   Vishal
TODO:    @shared_task scan_all_schools():
           for school in active schools:
             call ai_bridge.services.risk_scan(school)
             for each signal returned: create RiskSignal + notifications.send_notification(principal, ...)
"""
