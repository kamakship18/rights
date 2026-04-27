"""
POST /find-officer — Hybrid officer lookup (SQL + vector fallback).

1. SQL: Filter by jurisdictionPin + department mapping for category.
2. If zero SQL rows: vector fallback over Pinecone "officers" namespace.
3. Return the officer plus their parent in the escalation hierarchy.
"""

import logging

from fastapi import APIRouter

from models import OfficerResponse, OfficerResult
from services.database import find_officer_by_pin_and_category
from services.pinecone_client import query_vectors

logger = logging.getLogger(__name__)
router = APIRouter(tags=["officer"])


@router.post("/find-officer", response_model=OfficerResponse)
async def find_officer(request: dict):
    """
    Find the appropriate nodal officer for a grievance.

    Hybrid search: SQL first (by PIN + category), then vector fallback.
    Returns officer with parent for escalation chain.
    """
    pin = request.get("pin", "")
    category = request.get("category", "")

    if not pin:
        return OfficerResponse(
            officer=OfficerResult(
                id="unknown",
                name="Unable to determine — PIN required",
                designation="N/A",
                department="N/A",
                jurisdiction_pin="",
                email="",
            ),
            parent=None,
            source="error",
        )

    try:
        # Step 1: SQL lookup
        result = find_officer_by_pin_and_category(pin, category)

        if result:
            officer_data = result["officer"]
            parent_data = result.get("parent")

            officer = OfficerResult(
                id=officer_data["id"],
                name=officer_data["name"],
                designation=officer_data["designation"],
                department=officer_data["department"],
                jurisdiction_pin=officer_data["jurisdiction_pin"],
                email=officer_data["email"],
            )

            parent = None
            if parent_data:
                parent = OfficerResult(
                    id=parent_data["id"],
                    name=parent_data["name"],
                    designation=parent_data["designation"],
                    department=parent_data["department"],
                    jurisdiction_pin=parent_data["jurisdiction_pin"],
                    email=parent_data["email"],
                )

            return OfficerResponse(
                officer=officer,
                parent=parent,
                source="sql",
            )

        # Step 2: Vector fallback via Pinecone "officers" namespace
        logger.info("No SQL match for PIN=%s category=%s, trying vector fallback", pin, category)

        query_text = f"Officer for {category} complaints in PIN {pin}"
        vector_results = query_vectors(
            query_text,
            namespace="officers",
            top_k=1,
        )

        if vector_results:
            match = vector_results[0]
            metadata = match.get("metadata", {})

            officer = OfficerResult(
                id=metadata.get("id", "vector_match"),
                name=metadata.get("name", "Unknown Officer"),
                designation=metadata.get("designation", "Nodal Officer"),
                department=metadata.get("department", "General"),
                jurisdiction_pin=metadata.get("jurisdiction_pin", pin),
                email=metadata.get("email", ""),
            )

            return OfficerResponse(
                officer=officer,
                parent=None,
                source="vector",
            )

        # Step 3: No match found
        logger.warning("No officer found for PIN=%s category=%s", pin, category)
        return OfficerResponse(
            officer=OfficerResult(
                id="not_found",
                name=f"No officer found for PIN {pin}",
                designation="N/A",
                department="N/A",
                jurisdiction_pin=pin,
                email="",
            ),
            parent=None,
            source="not_found",
        )

    except Exception as e:
        logger.error("Officer lookup failed: %s", e)
        return OfficerResponse(
            officer=OfficerResult(
                id="error",
                name=f"Lookup failed: {str(e)[:80]}",
                designation="N/A",
                department="N/A",
                jurisdiction_pin=pin,
                email="",
            ),
            parent=None,
            source="error",
        )
