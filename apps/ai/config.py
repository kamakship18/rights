"""
Actionable Justice OS — AI Service Configuration.

Loads settings from environment variables with sensible defaults for local dev.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Service ─────────────────────────────────────────
    app_name: str = "justice-os-ai"
    debug: bool = True

    # ── CORS ────────────────────────────────────────────
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:4000",
    ]

    # ── Groq (LLM) ─────────────────────────────────────
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Pinecone (Vector DB) ────────────────────────────
    pinecone_api_key: str = ""
    pinecone_index: str = "legal-statutes"

    # ── Database (same Postgres as NestJS apps) ─────────
    database_url: str = "postgresql://postgres:postgres@localhost:5432/justice_os"

    # ── Indian Kanoon API ───────────────────────────────
    kanoon_api_key: str = ""
    kanoon_base_url: str = "https://api.indiankanoon.org"

    # ── Embeddings ──────────────────────────────────────
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    model_config = {"env_file": "../../.env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
