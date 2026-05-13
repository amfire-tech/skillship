"""
File:    ai-service/app/rag/chunker.py
Purpose: Split documents into overlapping text chunks for embedding.
"""

from __future__ import annotations

import io

import pypdf


def chunk(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    """
    Split text into overlapping word-boundary chunks.

    Args:
        text:    Raw text to split.
        size:    Target chunk size in characters.
        overlap: Characters of overlap between consecutive chunks.

    Returns:
        List of non-empty chunk strings.
    """
    text = text.strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + size
        chunk_text = text[start:end]

        # Walk back to the last whitespace so we don't cut mid-word.
        if end < len(text) and not text[end].isspace():
            last_space = chunk_text.rfind(" ")
            if last_space != -1:
                end = start + last_space + 1
                chunk_text = text[start:end].strip()

        if chunk_text:
            chunks.append(chunk_text)

        start = end - overlap
        if start >= len(text):
            break

    return chunks


def chunk_pdf(file_bytes: bytes, size: int = 800, overlap: int = 100) -> list[str]:
    """
    Extract text from a PDF and chunk it.

    Keeps page headings with their content by joining page text with a
    newline separator before chunking.
    """
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            pages.append(text.strip())

    full_text = "\n\n".join(pages)
    return chunk(full_text, size=size, overlap=overlap)
