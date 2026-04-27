"""
POST /map-statute — Map grievance to Indian statute via RAG.

Pipeline: embed text → Pinecone top-k=5 → rerank → Groq LLM → Indian Kanoon citation.
Never answers from LLM memory — always requires retrieved chunks.
"""

import logging
import re

from fastapi import APIRouter

from models import Citation, StatuteRequest, StatuteResponse
from services.groq_client import chat_completion_json
from services.kanoon_client import kanoon_client
from services.pinecone_client import query_vectors

logger = logging.getLogger(__name__)
router = APIRouter(tags=["statute"])

# Pinecone "legal-statutes" is a mixed index (IPC, BNS, noise, electricity, etc.).
# Vector similarity is not topic-accurate; we filter retrieved chunks for LLM + UI by triage category.
# Substrings in chunk metadata["source"] to EXCLUDE when category is in the key set.
_INCOMPATIBLE_PINECONE_SOURCES: dict[str, tuple[str, ...]] = {
    "harassment": ("Electricity", "Noise Pollution", "Consumer Rules 2020"),
    "stalking": ("Electricity", "Noise Pollution", "Consumer Rules 2020"),
    "assault": ("Electricity", "Noise Pollution", "Consumer Rules 2020"),
    "domestic_violence": ("Electricity", "Noise Pollution", "Consumer Rules 2020"),
    "cybercrime": ("Electricity", "Noise Pollution", "Consumer Rules 2020"),
    "consumer": ("Noise Pollution",),
    "noise": ("Electricity Consumer",),
    "electricity": ("Noise Pollution",),
}

# If the citizen text is clearly about air / waste / burning and not about sound, drop
# Pinecone "Noise Pollution Rules" hits even when category is broad (e.g. municipal).
_NOISE_INTENT = re.compile(
    r"\b(noise|decibel|\bdb\b|loud|loudspeaker|speaker|public address|sound system|acoustic|shor)\b",
    re.IGNORECASE,
)
_AIR_WASTE_BURNING_INTENT = re.compile(
    r"\b(air\s*pollution|garbage|trash|burning|open burn|municipal solid|waste|"
    r"landfill|smoke|fumes|emission|particulate|stubble|dump|biomass)\b",
    re.IGNORECASE,
)


def _filter_chunks_for_category(
    chunks: list[dict],
    category: str,
) -> list[dict]:
    block = _INCOMPATIBLE_PINECONE_SOURCES.get(category.lower().strip(), ())
    if not block or not chunks:
        return list(chunks)
    out: list[dict] = []
    for c in chunks:
        source = (c.get("metadata") or {}).get("source") or ""
        if any(s in source for s in block):
            continue
        out.append(c)
    return out


def _filter_noise_chunks_by_grievance_text(
    chunks: list[dict],
    grievance_text: str,
    category: str,
) -> list[dict]:
    """Do not show Noise Rules for air/burning/garbage complaints (noise is not air quality)."""
    if category.lower().strip() == "noise":
        return list(chunks)
    if not chunks or not grievance_text:
        return list(chunks)
    t = grievance_text.strip()
    if _NOISE_INTENT.search(t):
        return list(chunks)
    if not _AIR_WASTE_BURNING_INTENT.search(t):
        return list(chunks)
    out: list[dict] = []
    for c in chunks:
        source = (c.get("metadata") or {}).get("source") or ""
        if "Noise Pollution" in source:
            continue
        out.append(c)
    if len(out) < len(chunks):
        logger.info("Dropped noise-rule chunks: grievance is air/waste/burning, not sound.")
    return out

# Known statute mappings for common categories (used as fallback when RAG has no data)
KNOWN_STATUTES = {
    "noise": {
        "statute": "Noise Pollution (Regulation and Control) Rules, 2000",
        "section": "Rule 5 — Restrictions on the use of loudspeakers/public address systems",
        "kanoon_query": "noise pollution rules 2000 rule 5",
    },
    "harassment": {
        "statute": "Indian Penal Code / Bharatiya Nyaya Sanhita",
        "section": "Section 354A — Sexual Harassment / Section 75 BNS",
        "kanoon_query": "section 354A IPC sexual harassment",
    },
    "stalking": {
        "statute": "Indian Penal Code / Bharatiya Nyaya Sanhita",
        "section": "Section 354D — Stalking / Section 78 BNS",
        "kanoon_query": "section 354D IPC stalking",
    },
    "electricity": {
        "statute": "Electricity (Rights of Consumers) Rules, 2020",
        "section": "Rule 5 — Metering",
        "kanoon_query": "electricity consumer rights rules 2020 metering",
    },
    "assault": {
        "statute": "Indian Penal Code / Bharatiya Nyaya Sanhita",
        "section": "Section 352 — Assault / Section 74 BNS",
        "kanoon_query": "section 352 IPC assault",
    },
    "domestic_violence": {
        "statute": "Protection of Women from Domestic Violence Act, 2005",
        "section": "Section 3 — Definition of domestic violence",
        "kanoon_query": "domestic violence act 2005 section 3",
    },
    "consumer": {
        "statute": "Consumer Protection Act, 2019",
        "section": "Section 2(7) — Consumer defined",
        "kanoon_query": "consumer protection act 2019",
    },
    "cybercrime": {
        "statute": "Information Technology Act, 2000",
        "section": "Section 66 — Computer related offences",
        "kanoon_query": "IT act 2000 section 66 cybercrime",
    },
}

STATUTE_SYSTEM_PROMPT = """You are a legal statute mapping system for Indian law. Given a grievance text, a category, and retrieved legal chunks, identify the single most relevant Indian statute and section.

## Rules
1. You MUST base your answer on the retrieved chunks provided. Never answer from memory alone.
2. If the retrieved chunks are empty or irrelevant, use the fallback statute provided and set confidence lower.
3. Return valid JSON with keys: statute, section, confidence, reasoning.
4. statute = full official name of the act/rules.
5. section = specific section/rule number with title.
6. confidence = float 0-1. Set below 0.55 if you're uncertain.
7. reasoning = brief explanation of why this statute applies.
"""


@router.post("/map-statute", response_model=StatuteResponse)
async def map_statute(request: StatuteRequest):
    """
    Map a grievance to the most relevant Indian statute.

    Uses RAG (Pinecone → Groq) with Indian Kanoon citations.
    Degrades gracefully when external services are down.
    """
    try:
        # Step 1: Query Pinecone for relevant legal chunks
        raw_chunks = query_vectors(
            request.text,
            namespace="legal-statutes",
            top_k=5,
        )

        # Step 1b: Drop off-domain chunks; then drop noise-rule chunks for air/burning/garbage text
        # (Noise Rules govern dB levels, not open burning or air quality.)
        chunks = _filter_chunks_for_category(raw_chunks, request.category)
        chunks = _filter_noise_chunks_by_grievance_text(
            chunks, request.text, request.category
        )
        if raw_chunks and not chunks:
            logger.info(
                "Pinecone hits for category %s were filtered out; using fallback for statute context",
                request.category,
            )

        # Step 2: Get fallback statute for the category
        fallback = KNOWN_STATUTES.get(request.category.lower(), {})

        # Step 3: Build context from retrieved chunks
        if chunks:
            chunk_context = "\n\n".join([
                f"[Chunk {i+1}] (score: {c['score']:.2f})\n"
                f"Source: {c['metadata'].get('source', 'unknown')}\n"
                f"Section: {c['metadata'].get('section', 'unknown')}\n"
                f"Text: {c['metadata'].get('text', '')[:500]}"
                for i, c in enumerate(chunks)
            ])
        else:
            chunk_context = "(No retrieved chunks available — using fallback knowledge)"

        # Step 4: Ask Groq to select the best statute
        user_message = (
            f"Grievance text: {request.text}\n"
            f"Category: {request.category}\n\n"
            f"Retrieved legal chunks:\n{chunk_context}\n\n"
            f"Fallback statute (if chunks are empty/irrelevant): "
            f"{fallback.get('statute', 'N/A')} — {fallback.get('section', 'N/A')}"
        )

        try:
            result = chat_completion_json(
                STATUTE_SYSTEM_PROMPT,
                user_message,
                temperature=0.1,
                max_tokens=512,
            )
        except Exception as llm_err:
            logger.warning("LLM failed, using fallback: %s", llm_err)
            result = {
                "statute": fallback.get("statute", "Unable to determine"),
                "section": fallback.get("section", "Unable to determine"),
                "confidence": 0.5,
                "reasoning": f"LLM unavailable; using known statute for category '{request.category}'.",
            }

        # Step 5: Fetch Indian Kanoon citations
        citations = []
        kanoon_query = fallback.get("kanoon_query", f"{result.get('statute', '')} {result.get('section', '')}")

        try:
            kanoon_result = await kanoon_client.search(kanoon_query)
            docs = kanoon_result.get("docs", [])
            for doc in docs[:3]:  # Top 3 citations
                citations.append(Citation(
                    source="Indian Kanoon" if kanoon_result.get("source") != "fallback" else "Indian Kanoon (cached)",
                    snippet=doc.get("snippet", doc.get("title", ""))[:300],
                    url=doc.get("url", ""),
                ))
        except Exception as kanoon_err:
            logger.warning("Kanoon citation fetch failed: %s", kanoon_err)

        # Add Pinecone chunk citations
        for chunk in chunks[:2]:
            citations.append(Citation(
                source=chunk["metadata"].get("source", "Legal Database"),
                snippet=chunk["metadata"].get("text", "")[:300],
                url=chunk["metadata"].get("url", ""),
            ))

        confidence = min(1.0, max(0.0, float(result.get("confidence", 0.5))))

        return StatuteResponse(
            statute=result.get("statute", fallback.get("statute", "Unable to determine")),
            section=result.get("section", fallback.get("section", "Unable to determine")),
            citations=citations,
            confidence=confidence,
            needs_lawyer_review=confidence < 0.55,
            reasoning=result.get("reasoning", ""),
        )

    except Exception as e:
        logger.error("Statute mapping failed: %s", e)
        # Graceful degradation
        fallback = KNOWN_STATUTES.get(request.category.lower(), {})
        return StatuteResponse(
            statute=fallback.get("statute", "Unable to determine statute"),
            section=fallback.get("section", "Unable to determine section"),
            citations=[],
            confidence=0.3,
            needs_lawyer_review=True,
            reasoning=f"Service degraded: {str(e)[:100]}. Returning known statute for category.",
        )
