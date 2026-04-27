"""
Batch embed chunks and upsert to Pinecone with deterministic vector IDs.

Vector IDs are sha256(source + section + chunk_index) for idempotency —
re-running never creates duplicates.
"""

import hashlib
import logging
import os
import sys

# Add the parent directory to path so we can import services
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embeddings import embed_batch
from services.pinecone_client import get_index

logger = logging.getLogger(__name__)


def make_vector_id(source: str, section: str, chunk_index: int) -> str:
    """Generate a deterministic vector ID from source + section + chunk_index."""
    raw = f"{source}::{section}::{chunk_index}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def embed_and_upsert_chunks(
    chunks: list[dict],
    *,
    namespace: str = "legal-statutes",
    batch_size: int = 50,
) -> int:
    """
    Embed chunks and upsert to Pinecone.

    Each chunk dict should have: source, section, title, body, chunk_index.
    Returns the number of vectors upserted.
    """
    index = get_index()
    if index is None:
        logger.error("Pinecone index not available — skipping upsert")
        return 0

    total_upserted = 0
    total_chunks = len(chunks)

    for batch_start in range(0, total_chunks, batch_size):
        batch = chunks[batch_start : batch_start + batch_size]

        # Build texts for embedding
        texts = []
        for chunk in batch:
            # Embed the full context: section heading + body
            text = f"{chunk['source']} — {chunk['section']} — {chunk['title']}\n\n{chunk['body']}"
            texts.append(text)

        # Batch embed
        try:
            embeddings = embed_batch(texts)
        except Exception as e:
            logger.error("Embedding failed for batch %d: %s", batch_start, e)
            continue

        # Build Pinecone vectors
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(batch, embeddings)):
            vector_id = make_vector_id(chunk["source"], chunk["section"], chunk["chunk_index"])
            metadata = {
                "source": chunk["source"],
                "section": chunk["section"],
                "title": chunk["title"],
                "text": chunk["body"][:1000],  # Pinecone metadata limit
                "chunk_index": chunk["chunk_index"],
                "total_chunks": chunk.get("total_chunks", 1),
            }
            # Add BNS section if present
            if "bns_section" in chunk:
                metadata["bns_section"] = chunk["bns_section"]

            vectors.append(
                {
                    "id": vector_id,
                    "values": embedding,
                    "metadata": metadata,
                }
            )

        # Upsert to Pinecone
        try:
            index.upsert(vectors=vectors, namespace=namespace)
            total_upserted += len(vectors)
            logger.info(
                "  Upserted batch %d-%d (%d vectors) to namespace '%s'",
                batch_start,
                batch_start + len(batch) - 1,
                len(vectors),
                namespace,
            )
        except Exception as e:
            logger.error("Pinecone upsert failed for batch %d: %s", batch_start, e)

    logger.info("Total upserted: %d / %d chunks to '%s'", total_upserted, total_chunks, namespace)
    return total_upserted
