"""
Embed officer rows into Pinecone "officers" namespace for vector fallback
in /find-officer endpoint.

Each officer gets a single vector with metadata containing their details.
"""

import hashlib
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embeddings import embed_batch
from services.pinecone_client import get_index

logger = logging.getLogger(__name__)


def make_officer_vector_id(officer_id: str) -> str:
    """Deterministic vector ID for an officer."""
    return hashlib.sha256(f"officer::{officer_id}".encode()).hexdigest()[:32]


def seed_officers_to_pinecone(officers: list[dict], batch_size: int = 50) -> int:
    """
    Embed and upsert officer records into Pinecone 'officers' namespace.

    Each officer is embedded as: "{name}, {designation}, {department}, PIN {pin}"
    """
    index = get_index()
    if index is None:
        logger.error("Pinecone index not available — skipping officer embedding")
        return 0

    total = 0

    for i in range(0, len(officers), batch_size):
        batch = officers[i : i + batch_size]

        texts = []
        for o in batch:
            text = f"{o['name']}, {o['designation']}, {o['department']}, PIN {o['jurisdictionPin']}"
            texts.append(text)

        try:
            embeddings = embed_batch(texts)
        except Exception as e:
            logger.error("Embedding failed for officer batch %d: %s", i, e)
            continue

        vectors = []
        for o, embedding in zip(batch, embeddings):
            vid = make_officer_vector_id(o["id"])
            vectors.append(
                {
                    "id": vid,
                    "values": embedding,
                    "metadata": {
                        "id": o["id"],
                        "name": o["name"],
                        "designation": o["designation"],
                        "department": o["department"],
                        "jurisdiction_pin": o["jurisdictionPin"],
                        "email": o.get("email", ""),
                    },
                }
            )

        try:
            index.upsert(vectors=vectors, namespace="officers")
            total += len(vectors)
            logger.info(
                "  Officers batch %d-%d → Pinecone (%d vectors)",
                i,
                i + len(batch) - 1,
                len(vectors),
            )
        except Exception as e:
            logger.error("Pinecone upsert failed for officer batch %d: %s", i, e)

    logger.info("Total officer vectors upserted: %d / %d", total, len(officers))
    return total
