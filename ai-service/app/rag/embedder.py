"""
File:    ai-service/app/rag/embedder.py
Purpose: Embeds chunks into vectors and upserts into pgvector table.
Owner:   Navanish
TODO:    - embed(texts) -> list[vector]  (Voyage / OpenAI / Anthropic embedding model)
         - upsert(school_id, content_id, chunks, vectors) into content_chunks table.
         Table schema is created by data/migrations_raw/001_pgvector.sql.
"""
