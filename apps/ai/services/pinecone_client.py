"""
Pinecone vector database client with retries and exponential backoff.

Manages two namespaces:
  - "legal-statutes": IPC/BNS sections, rules (populated by ingestion in Prompt 4)
  - "officers": Officer embeddings for vector fallback search
"""

import logging

from pinecone import Pinecone, ServerlessSpec
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from services.embeddings import embed_text

logger = logging.getLogger(__name__)

_client: Pinecone | None = None
_index = None


def get_pinecone_client() -> Pinecone | None:
    """Get or create the Pinecone client singleton."""
    global _client
    if _client is None and settings.pinecone_api_key:
        _client = Pinecone(api_key=settings.pinecone_api_key)
    return _client


def get_index():
    """Get or create the Pinecone index."""
    global _index
    if _index is not None:
        return _index

    client = get_pinecone_client()
    if client is None:
        logger.warning("Pinecone API key not configured")
        return None

    try:
        existing = [idx.name for idx in client.list_indexes()]
        if settings.pinecone_index not in existing:
            logger.info("Creating Pinecone index: %s", settings.pinecone_index)
            client.create_index(
                name=settings.pinecone_index,
                dimension=settings.embedding_dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

        _index = client.Index(settings.pinecone_index)
        logger.info("Connected to Pinecone index: %s", settings.pinecone_index)
        return _index
    except Exception as e:
        logger.error("Failed to connect to Pinecone: %s", e)
        return None


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)
def query_vectors(
    query_text: str,
    *,
    namespace: str = "legal-statutes",
    top_k: int = 5,
    filter_dict: dict | None = None,
) -> list[dict]:
    """
    Query Pinecone for similar vectors.

    Returns a list of matches with id, score, and metadata.
    Returns empty list if Pinecone is unavailable.
    """
    index = get_index()
    if index is None:
        logger.warning("Pinecone index unavailable, returning empty results")
        return []

    embedding = embed_text(query_text)

    query_params: dict = {
        "vector": embedding,
        "top_k": top_k,
        "namespace": namespace,
        "include_metadata": True,
    }
    if filter_dict:
        query_params["filter"] = filter_dict

    try:
        result = index.query(**query_params)
        matches = []
        for match in result.get("matches", []):
            matches.append({
                "id": match["id"],
                "score": match["score"],
                "metadata": match.get("metadata", {}),
            })
        return matches
    except Exception as e:
        logger.error("Pinecone query failed: %s", e)
        return []


def upsert_vectors(
    vectors: list[dict],
    *,
    namespace: str = "legal-statutes",
    batch_size: int = 100,
) -> int:
    """
    Upsert vectors into Pinecone.

    Each vector dict should have: id, values, metadata.
    Returns the number of vectors upserted.
    """
    index = get_index()
    if index is None:
        logger.warning("Pinecone index unavailable, skipping upsert")
        return 0

    total = 0
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i : i + batch_size]
        try:
            index.upsert(vectors=batch, namespace=namespace)
            total += len(batch)
        except Exception as e:
            logger.error("Pinecone upsert failed for batch %d: %s", i, e)

    return total
