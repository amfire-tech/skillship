"""
File:    ai-service/app/agents/career_pilot.py
Purpose: CareerPilot agent — reasons over a student's history + interests to suggest career paths.
Why:     Proposal Plan 02 flagship feature.
Owner:   Navanish
TODO:    run(student_context, question, history) -> dict:
           - Use Claude Agent SDK with tools: search_marketplace_courses, fetch_student_scores,
             fetch_interest_tags.
           - System prompt from prompts/career_pilot.md.
           - Return answer + suggested_paths + confidence + citations.
"""
