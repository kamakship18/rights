"""
Embedding service with SHA-256 caching.

Uses sentence-transformers (local, free, no API key needed).
Falls back to a zero-vector if the model fails to load.
"""

import hashlib
import logging
from functools import lru_cache

from config import settings

logger = logging.getLogger(__name__)

# In-memory cache: sha256(text) -> embedding vector
_cache: dict[str, list[float]] = {}

# Lazy-loaded model
_model = None
_model_load_attempted = False


def _get_model():
    """Lazy-load the sentence-transformers model."""
    global _model, _model_load_attempted
    if _model is not None:
        return _model
    if _model_load_attempted:
        return None

    _model_load_attempted = True
    try:
        from sentence_transformers import SentenceTransformer

        logger.info("Loading embedding model: %s", settings.embedding_model)
        _model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded successfully")
        return _model
    except Exception as e:
        logger.error("Failed to load embedding model: %s", e)
        return None


def _cache_key(text: str) -> str:
    """Generate a SHA-256 cache key for the input text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def embed_text(text: str) -> list[float]:
    """
    Embed a single text string. Results are cached by SHA-256 of input.

    Returns a zero vector if the model is unavailable.
    """
    key = _cache_key(text)
    if key in _cache:
        return _cache[key]

    model = _get_model()
    if model is None:
        logger.warning("Embedding model unavailable, returning zero vector")
        zero = [0.0] * settings.embedding_dimension
        _cache[key] = zero
        return zero

    embedding = model.encode(text, normalize_embeddings=True)
    result = embedding.tolist()
    _cache[key] = result
    return result


def embed_batch(texts: list[str]) -> list[list[float]]:
    """
    Embed a batch of texts. Each result is cached individually.
    """
    # Check cache first
    uncached_indices = []
    uncached_texts = []
    results: list[list[float] | None] = [None] * len(texts)

    for i, text in enumerate(texts):
        key = _cache_key(text)
        if key in _cache:
            results[i] = _cache[key]
        else:
            uncached_indices.append(i)
            uncached_texts.append(text)

    if uncached_texts:
        model = _get_model()
        if model is None:
            for i in uncached_indices:
                zero = [0.0] * settings.embedding_dimension
                results[i] = zero
                _cache[_cache_key(texts[i])] = zero
        else:
            embeddings = model.encode(uncached_texts, normalize_embeddings=True)
            for idx, i in enumerate(uncached_indices):
                vec = embeddings[idx].tolist()
                results[i] = vec
                _cache[_cache_key(texts[i])] = vec

    return [r for r in results if r is not None]


@lru_cache(maxsize=1)
def get_embedding_dimension() -> int:
    """Return the dimension of the embedding model."""
    model = _get_model()
    if model is None:
        return settings.embedding_dimension
    dim = model.get_sentence_embedding_dimension()
    return dim if dim else settings.embedding_dimension
