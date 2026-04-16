"""
File:    ai-service/app/routers/reports.py
Purpose: /reports/weekly endpoint — generates the weekly principal report.
Owner:   Navanish
TODO:    POST /reports/weekly
           body: { school_snapshot: {metrics, top_risks, standout_students} }
           -> agents.analyst_agent.weekly(school_snapshot)
           -> { summary_md, highlights, concerns, recommendations }
"""
