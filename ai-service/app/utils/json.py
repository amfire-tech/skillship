"""
File:    ai-service/app/utils/json.py
Purpose: Robust JSON parsing helpers for LLM responses.
Owner:   Prashant
"""

from __future__ import annotations

import json
from typing import Any, Literal


def parse_llm_json(raw: str, expected: Literal["object", "array"]) -> Any:
    """Parse JSON from a model response, tolerating common markdown fences."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    if expected == "array":
        start, end = text.find("["), text.rfind("]")
    else:
        start, end = text.find("{"), text.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError(f"Expected JSON {expected} in model response.")

    parsed = json.loads(text[start : end + 1])
    if expected == "array" and not isinstance(parsed, list):
        raise ValueError("Expected model response to be a JSON array.")
    if expected == "object" and not isinstance(parsed, dict):
        raise ValueError("Expected model response to be a JSON object.")
    return parsed
