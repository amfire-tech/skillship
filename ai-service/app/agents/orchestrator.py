"""
File:    ai-service/app/agents/orchestrator.py
Purpose: Top-level LangGraph that picks + chains sub-agents (tutor, content, analyst, risk).
Why:     Plan 02 (Agentic AI) — a single entrypoint that decides which specialist to invoke.
Owner:   Navanish
TODO:    Define a LangGraph StateGraph:
           nodes: route, career_pilot, tutor_agent, content_agent, analyst_agent, risk_agent
           router decides based on request.intent which node to call next.
         Expose run(intent, payload) -> dict used by routers when a call is multi-step.
"""
