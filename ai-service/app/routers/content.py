"""
File:    ai-service/app/routers/content.py
Purpose: /content/tag endpoint — tags uploaded content (video/PDF/article) with AI-inferred topics.
Owner:   Navanish
TODO:    POST /content/tag
           body: { title, description, kind, file_url }
           -> agents.content_agent.tag(...) -> { tags: [...], summary, grade_level }
"""
