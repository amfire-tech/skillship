"""
File:    ai-service/app/rag/retriever.py
Purpose: Top-k semantic search over pgvector, scoped to a school_id.
"""

from __future__ import annotations

import logging
import uuid

import psycopg
from google import genai

from app.rag.embedder import embed

logger = logging.getLogger(__name__)


async def retrieve(
    db: psycopg.AsyncConnection,
    client: genai.Client,
    question: str,
    school_id: uuid.UUID,
    course_id: uuid.UUID | None = None,
    k: int = 5,
) -> list[dict]:
    """Cosine similarity search over content_chunks scoped to school_id."""
    vectors = await embed(client, [question], task_type="RETRIEVAL_QUERY")
    query_vec = vectors[0]

    if course_id:
        sql = """
            SELECT chunk_text, content_id, chunk_index, 1 - (embedding <=> %s::vector) AS score
            FROM content_chunks
            WHERE school_id = %s AND course_id = %s
            ORDER BY embedding <=> %s::vector LIMIT %s
        """
        params = (query_vec, school_id, course_id, query_vec, k)
    else:
        sql = """
            SELECT chunk_text, content_id, chunk_index, 1 - (embedding <=> %s::vector) AS score
            FROM content_chunks
            WHERE school_id = %s
            ORDER BY embedding <=> %s::vector LIMIT %s
        """
        params = (query_vec, school_id, query_vec, k)

    async with db.cursor() as cur:
        await cur.execute(sql, params)
        rows = await cur.fetchall()

    return [
        {
            "chunk_text": row[0],
            "content_id": str(row[1]),
            "chunk_index": int(row[2]),
            "score": float(row[3]),
        }
        for row in rows
    ]
