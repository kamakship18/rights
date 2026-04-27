"""
Database service for officer lookups.

Uses SQLAlchemy with psycopg2 (sync) to query the same Postgres
that the NestJS apps use. Async would be ideal but sync is simpler
and sufficient for the AI service's query patterns.
"""

import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy needs the scheme without the ?schema=public param that Prisma uses
_db_url = settings.database_url.split("?")[0]
_engine = None


def _get_engine():
    """Get or create the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        try:
            _engine = create_engine(_db_url, pool_pre_ping=True, pool_size=5)
            logger.info("Database engine created: %s", _db_url.split("@")[-1])
        except Exception as e:
            logger.error("Failed to create database engine: %s", e)
    return _engine


# Map grievance categories to officer departments
CATEGORY_DEPARTMENT_MAP = {
    "harassment": "Delhi Police",
    "stalking": "Delhi Police",
    "noise": "Delhi Police",
    "assault": "Delhi Police",
    "theft": "Delhi Police",
    "cybercrime": "Delhi Police",
    "electricity": "Delhi Police",  # In practice, this would be BSES/DERC
    "consumer": "Consumer Affairs",
    "municipal": "Municipal Corporation",
}


def find_officer_by_pin_and_category(pin: str, category: str) -> dict | None:
    """
    Find a nodal officer by jurisdiction PIN and category.

    Returns officer dict with parent info, or None if not found.
    """
    engine = _get_engine()
    if engine is None:
        logger.error("Database engine unavailable")
        return None

    department = CATEGORY_DEPARTMENT_MAP.get(category.lower(), "Delhi Police")

    try:
        with Session(engine) as session:
            # Find officer by PIN + department, preferring lower-rank first
            # (so escalation goes up the chain)
            result = session.execute(
                text("""
                    SELECT o.id, o.name, o.designation, o.department,
                           o."jurisdictionPin", o.email, o."parentId"
                    FROM "Officer" o
                    WHERE o."jurisdictionPin" = :pin
                      AND o.department = :department
                      AND o."parentId" IS NOT NULL
                    ORDER BY o."createdAt" DESC
                    LIMIT 1
                """),
                {"pin": pin, "department": department},
            )
            row = result.mappings().fetchone()

            if row is None:
                # Fallback: any officer for this PIN
                result = session.execute(
                    text("""
                        SELECT o.id, o.name, o.designation, o.department,
                               o."jurisdictionPin", o.email, o."parentId"
                        FROM "Officer" o
                        WHERE o."jurisdictionPin" = :pin
                        ORDER BY o."createdAt" DESC
                        LIMIT 1
                    """),
                    {"pin": pin},
                )
                row = result.mappings().fetchone()

            if row is None:
                return None

            officer = {
                "id": row["id"],
                "name": row["name"],
                "designation": row["designation"],
                "department": row["department"],
                "jurisdiction_pin": row["jurisdictionPin"],
                "email": row["email"],
            }

            # Fetch parent if exists
            parent = None
            if row["parentId"]:
                parent_result = session.execute(
                    text("""
                        SELECT id, name, designation, department,
                               "jurisdictionPin", email
                        FROM "Officer"
                        WHERE id = :parent_id
                    """),
                    {"parent_id": row["parentId"]},
                )
                parent_row = parent_result.mappings().fetchone()
                if parent_row:
                    parent = {
                        "id": parent_row["id"],
                        "name": parent_row["name"],
                        "designation": parent_row["designation"],
                        "department": parent_row["department"],
                        "jurisdiction_pin": parent_row["jurisdictionPin"],
                        "email": parent_row["email"],
                    }

            return {"officer": officer, "parent": parent, "source": "sql"}

    except Exception as e:
        logger.error("Database query failed: %s", e)
        return None


def get_all_officers(pin: str | None = None) -> list[dict]:
    """Fetch all officers, optionally filtered by PIN."""
    engine = _get_engine()
    if engine is None:
        return []

    try:
        with Session(engine) as session:
            if pin:
                result = session.execute(
                    text("""
                        SELECT id, name, designation, department,
                               "jurisdictionPin", email, "parentId"
                        FROM "Officer"
                        WHERE "jurisdictionPin" = :pin
                    """),
                    {"pin": pin},
                )
            else:
                result = session.execute(
                    text('SELECT id, name, designation, department, "jurisdictionPin", email, "parentId" FROM "Officer"')
                )

            return [dict(row) for row in result.mappings().fetchall()]
    except Exception as e:
        logger.error("Failed to fetch officers: %s", e)
        return []
