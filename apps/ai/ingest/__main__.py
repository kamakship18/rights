"""
Actionable Justice OS — Data Ingestion CLI

Usage:
    python -m ingest statutes   # Ingest IPC/BNS + Noise + Electricity rules into Pinecone
    python -m ingest officers   # Ingest CPGRAMS officers into Postgres + Pinecone
    python -m ingest all        # Run everything

Run from apps/ai/:
    cd apps/ai && uv run python -m ingest all
"""

import logging
import os
import sys
import time

# Ensure the parent directory is on the path for config/services imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings  # noqa: E402

# ─── Structured Logging ─────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ingest")


def ingest_statutes():
    """Ingest all statute sources into Pinecone 'legal-statutes' namespace."""
    from ingest.chunker import chunk_all_sections
    from ingest.embed_and_upsert import embed_and_upsert_chunks
    from ingest.sources.electricity_rules import SECTIONS as electricity_sections
    from ingest.sources.ipc_bns import SECTIONS as ipc_sections
    from ingest.sources.noise_rules import SECTIONS as noise_sections

    logger.info("=" * 60)
    logger.info("STATUTE INGESTION — Starting")
    logger.info("=" * 60)

    all_sections = ipc_sections + noise_sections + electricity_sections
    logger.info(
        "Source sections: IPC/BNS=%d, Noise=%d, Electricity=%d, Total=%d",
        len(ipc_sections),
        len(noise_sections),
        len(electricity_sections),
        len(all_sections),
    )

    # Chunk
    logger.info("\n📦 Chunking sections...")
    chunks = chunk_all_sections(all_sections, max_tokens=400)
    logger.info("Total chunks: %d", len(chunks))

    # Embed + upsert
    logger.info("\n🔗 Embedding + upserting to Pinecone '%s' namespace...", "legal-statutes")
    t0 = time.time()
    upserted = embed_and_upsert_chunks(chunks, namespace="legal-statutes")
    elapsed = time.time() - t0

    logger.info("\n✅ Statute ingestion complete:")
    logger.info("   Vectors upserted: %d", upserted)
    logger.info("   Time: %.1fs", elapsed)
    return upserted


def ingest_officers():
    """Ingest officers into Postgres + embed into Pinecone 'officers' namespace."""
    from ingest.officers import (
        generate_synthetic_officers,
        read_csv_officers,
        upsert_officers_to_postgres,
    )
    from ingest.seed_officers_pinecone import seed_officers_to_pinecone

    logger.info("=" * 60)
    logger.info("OFFICER INGESTION — Starting")
    logger.info("=" * 60)

    # Determine data source
    csv_path = os.environ.get("INGEST_OFFICERS_CSV", "")

    if csv_path and os.path.exists(csv_path):
        logger.info("Reading officers from CSV: %s", csv_path)
        officers = read_csv_officers(csv_path)
    else:
        if csv_path:
            logger.warning("CSV not found at '%s' — using synthetic data", csv_path)
        else:
            logger.info("No INGEST_OFFICERS_CSV set — generating synthetic CPGRAMS data")
        officers = generate_synthetic_officers()

    logger.info("Officers to ingest: %d", len(officers))

    # Upsert to Postgres
    logger.info("\n🗄️  Upserting officers to Postgres...")
    t0 = time.time()
    pg_count = upsert_officers_to_postgres(officers)
    pg_time = time.time() - t0
    logger.info("   Postgres: %d officers in %.1fs", pg_count, pg_time)

    # Embed + upsert to Pinecone
    logger.info("\n🔗 Embedding officers into Pinecone 'officers' namespace...")
    t0 = time.time()
    pc_count = seed_officers_to_pinecone(officers)
    pc_time = time.time() - t0
    logger.info("   Pinecone: %d vectors in %.1fs", pc_count, pc_time)

    logger.info("\n✅ Officer ingestion complete:")
    logger.info("   Postgres officers: %d", pg_count)
    logger.info("   Pinecone vectors:  %d", pc_count)
    return pg_count, pc_count


def main():
    """CLI entry point."""
    args = sys.argv[1:] if len(sys.argv) > 1 else ["all"]
    command = args[0].lower() if args else "all"

    logger.info("🚀 Justice OS Ingestion Pipeline")
    logger.info("   Command:   %s", command)
    logger.info("   Pinecone:  %s", "configured" if settings.pinecone_api_key else "NOT SET")
    logger.info(
        "   Database:  %s",
        settings.database_url.split("@")[-1] if settings.database_url else "NOT SET",
    )
    logger.info("")

    t_start = time.time()

    if command in ("statutes", "all"):
        ingest_statutes()
        logger.info("")

    if command in ("officers", "all"):
        ingest_officers()
        logger.info("")

    if command not in ("statutes", "officers", "all"):
        logger.error("Unknown command: %s", command)
        logger.error("Usage: python -m ingest [statutes|officers|all]")
        sys.exit(1)

    total_time = time.time() - t_start
    logger.info("=" * 60)
    logger.info("🎉 Ingestion complete in %.1fs", total_time)
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
