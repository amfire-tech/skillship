"""
File:    ai-service/app/deps.py
Purpose: FastAPI dependency-injection helpers (auth header verify, LLM client, embedder).
Owner:   Navanish
TODO:    - verify_internal_key(x_internal_key: str = Header(...))
         - get_anthropic_client() -> anthropic.Anthropic (cached)
         - get_embedder() -> Embedder instance
"""
