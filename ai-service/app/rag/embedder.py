"""
File:    ai-service/app/rag/embedder.py
Purpose: Embed text chunks via Gemini and upsert into the content_chunks pgvector table.
"""

from __future__ import annotations

import logging
import uuid

import psycopg
from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768  # matches vector(768) in 001_pgvector.sql


async def embed(
    client: genai.Client,
    texts: list[str],
    task_type: str = "RETRIEVAL_DOCUMENT",
) -> list[list[float]]:
    """Generate Gemini embeddings for a list of texts."""
    if not texts:
        return []

    result = await client.aio.models.embed_content(
        model=settings.EMBEDDING_MODEL,
        contents=texts,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    return [e.values for e in result.embeddings]


async def upsert(
    db: psycopg.AsyncConnection,
    client: genai.Client,
    school_id: uuid.UUID,
    content_id: uuid.UUID,
    chunks: list[str],
    course_id: uuid.UUID | None = None,
) -> int:
    """Embed chunks and upsert into content_chunks. Idempotent — deletes old chunks first."""
    if not chunks:
        return 0

    vectors = await embed(client, chunks, task_type="RETRIEVAL_DOCUMENT")

    async with db.cursor() as cur:
        await cur.execute(
            "DELETE FROM content_chunks WHERE school_id = %s AND content_id = %s",
            (school_id, content_id),
        )
        rows = [
            (uuid.uuid4(), school_id, course_id, content_id, idx, text, vec)
            for idx, (text, vec) in enumerate(zip(chunks, vectors))
        ]
        await cur.executemany(
            """
            INSERT INTO content_chunks
                (id, school_id, course_id, content_id, chunk_index, chunk_text, embedding)
            VALUES (%s, %s, %s, %s, %s, %s, %s::vector)
            """,
            rows,
        )

    await db.commit()
    logger.info("Upserted %d chunks for content_id=%s", len(chunks), content_id)
    return len(chunks)
