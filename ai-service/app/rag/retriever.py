"""
File:    ai-service/app/rag/retriever.py
Purpose: Top-k semantic search over pgvector, scoped to a school_id.
Why:     Tenant isolation applies to RAG too — school A must never retrieve school B's chunks.
Owner:   Navanish
TODO:    retrieve(question, school_id, course_id=None, k=5) -> list[{chunk, content_id, score}]:
           - embed(question) -> vector
           - SELECT ... FROM content_chunks WHERE school_id = %s ORDER BY vector <-> %s LIMIT k.
"""
