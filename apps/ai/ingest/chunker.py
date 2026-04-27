"""
Text chunker for statute sections.

Splits long section bodies into ~400-token chunks while preserving
the section heading in each chunk's metadata for attribution.
"""

import logging
import re

logger = logging.getLogger(__name__)


def estimate_tokens(text: str) -> int:
    """Rough token estimate: ~4 chars per token for English legal text."""
    return len(text) // 4


def chunk_section(section: dict, max_tokens: int = 400) -> list[dict]:
    """
    Split a statute section into chunks of ~max_tokens.

    Each chunk preserves the section metadata (source, section number, title)
    so attribution is never lost.

    Returns a list of dicts with keys:
        source, section, title, body, chunk_index, total_chunks
    """
    body = section.get("body", "")
    source = section.get("source", "")
    sec_num = section.get("section", "")
    title = section.get("title", "")

    if not body.strip():
        return []

    # If the body fits in one chunk, return as-is
    if estimate_tokens(body) <= max_tokens:
        return [
            {
                "source": source,
                "section": sec_num,
                "title": title,
                "body": body,
                "chunk_index": 0,
                "total_chunks": 1,
                **{
                    k: v
                    for k, v in section.items()
                    if k not in ("source", "section", "title", "body")
                },
            }
        ]

    # Split on sentence boundaries
    sentences = re.split(r"(?<=[.;:])\s+", body)
    chunks = []
    current_chunk: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = estimate_tokens(sentence)

        if current_tokens + sentence_tokens > max_tokens and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [sentence]
            current_tokens = sentence_tokens
        else:
            current_chunk.append(sentence)
            current_tokens += sentence_tokens

    # Flush remaining
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    result = []
    for i, chunk_body in enumerate(chunks):
        result.append(
            {
                "source": source,
                "section": sec_num,
                "title": title,
                "body": chunk_body,
                "chunk_index": i,
                "total_chunks": len(chunks),
                **{
                    k: v
                    for k, v in section.items()
                    if k not in ("source", "section", "title", "body")
                },
            }
        )

    return result


def chunk_all_sections(sections: list[dict], max_tokens: int = 400) -> list[dict]:
    """Chunk a list of statute sections. Returns flat list of all chunks."""
    all_chunks = []
    for section in sections:
        chunks = chunk_section(section, max_tokens)
        all_chunks.extend(chunks)

    logger.info("Chunked %d sections into %d chunks", len(sections), len(all_chunks))
    return all_chunks
