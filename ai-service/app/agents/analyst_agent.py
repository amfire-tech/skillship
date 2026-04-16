"""
File:    ai-service/app/agents/analyst_agent.py
Purpose: Analyst agent — turns raw school metrics into a narrative weekly report.
Owner:   Navanish
TODO:    weekly(school_snapshot) -> {summary_md, highlights, concerns, recommendations}.
         Uses prompts/analyst.md; model = claude-opus-4-6 for quality.
"""
