"""
File:    ai-service/app/rag/chunker.py
Purpose: Split documents (PDF/article/transcript) into overlapping text chunks for embedding.
Owner:   Navanish
TODO:    chunk(text, size=800, overlap=100) -> list[str].
         Handle PDFs via pypdf; keep section headings with their content.
"""
