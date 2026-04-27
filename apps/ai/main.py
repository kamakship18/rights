"""
Actionable Justice OS — AI / RAG Service

FastAPI application for triage, statute mapping, and officer discovery.
All legal answers are grounded in real Indian law via RAG — never via LLM memory.
"""

import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import officer, statute, triage

# ─── Structured Logging ─────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ─── App ─────────────────────────────────────────────────

app = FastAPI(
    title="Justice OS AI Service",
    description=(
        "AI/RAG service for legal triage, statute mapping, and officer discovery. "
        "All answers are grounded in real Indian law — never via LLM memory."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────

app.include_router(triage.router)
app.include_router(statute.router)
app.include_router(officer.router)

# ─── Health Check ────────────────────────────────────────


@app.get("/healthz")
async def healthz():
    """Liveness probe."""
    return {"ok": True, "service": "ai"}


# ─── Startup ─────────────────────────────────────────────


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("Justice OS AI Service starting")
    logger.info("  Groq API:    %s", "configured" if settings.groq_api_key else "NOT SET")
    logger.info("  Pinecone:    %s", "configured" if settings.pinecone_api_key else "NOT SET")
    logger.info("  Kanoon API:  %s", "configured" if settings.kanoon_api_key else "NOT SET (using fallback)")
    logger.info("  Database:    %s", settings.database_url.split("@")[-1] if settings.database_url else "NOT SET")
    logger.info("  Embeddings:  %s", settings.embedding_model)
    logger.info("=" * 60)
