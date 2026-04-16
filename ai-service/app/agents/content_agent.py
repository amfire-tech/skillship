"""
File:    ai-service/app/agents/content_agent.py
Purpose: Content agent — auto-tags uploaded content (topic, grade, difficulty, prerequisites).
Owner:   Navanish
TODO:    tag(title, description, kind, file_url) -> {tags, summary, grade_level, prerequisites}.
         For PDFs: call rag.chunker.chunk() + run LLM on first few chunks.
"""
