"""
CPGRAMS Nodal Officer ingestion into Postgres.

Reads from a CSV file (INGEST_OFFICERS_CSV env var) or generates a realistic
synthetic CPGRAMS-style dataset for the demo covering 150+ officers across
multiple Delhi districts.

Hierarchy tiers:
  Tier 3: ASI / Head Constable / Clerk  →  parent = Tier 2
  Tier 2: DCP / DM / Senior Inspector  →  parent = Tier 1
  Tier 1: Commissioner / State Nodal   →  parent = None

Upserts by (jurisdictionPin, department, designation) to avoid duplicates.
"""

import csv
import hashlib
import logging
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from config import settings

logger = logging.getLogger(__name__)


# ─── Tier mapping ────────────────────────────────────────

TIER_MAP = {
    # Tier 1 — Top (no parent)
    "Commissioner of Police": 1,
    "State Nodal Officer": 1,
    "Director General": 1,
    "Secretary": 1,
    # Tier 2 — Middle
    "DCP": 2,
    "District Magistrate": 2,
    "Senior Superintendent": 2,
    "Superintendent": 2,
    "Senior Inspector": 2,
    "Joint Commissioner": 2,
    # Tier 3 — Ground level (parent = Tier 2)
    "ASI": 3,
    "Sub Inspector": 3,
    "Head Constable": 3,
    "Inspector": 3,
    "Assistant Commissioner": 3,
    "Clerk": 3,
    "Junior Engineer": 3,
    "Lineman": 3,
}


def get_tier(designation: str) -> int:
    """Get the tier for a designation. Default to 3 (lowest)."""
    for key, tier in TIER_MAP.items():
        if key.lower() in designation.lower():
            return tier
    return 3


# ─── Synthetic data generator ────────────────────────────

DELHI_DISTRICTS = [
    ("110001", "Central Delhi"),
    ("110002", "Central Delhi"),
    ("110003", "South Delhi"),
    ("110005", "New Delhi"),
    ("110006", "Karol Bagh"),
    ("110007", "North Delhi"),
    ("110008", "Patel Nagar"),
    ("110009", "Civil Lines"),
    ("110010", "South Delhi"),
    ("110011", "South West Delhi"),
    ("110012", "Connaught Place"),
    ("110015", "Sadar Bazaar"),
    ("110016", "South Delhi"),
    ("110017", "South Delhi"),
    ("110019", "South East Delhi"),
    ("110020", "South East Delhi"),
    ("110021", "South West Delhi"),
    ("110022", "South Delhi"),
    ("110023", "South West Delhi"),
    ("110024", "East Delhi"),
    ("110025", "South Delhi"),
    ("110027", "South Delhi"),
    ("110028", "South West Delhi"),
    ("110029", "South West Delhi"),
    ("110030", "South Delhi"),
    ("110032", "Shahdara"),
    ("110033", "North West Delhi"),
    ("110034", "North West Delhi"),
    ("110035", "West Delhi"),
    ("110037", "North Delhi"),
    ("110038", "South West Delhi"),
    ("110039", "West Delhi"),
    ("110040", "South Delhi"),
    ("110041", "West Delhi"),
    ("110042", "North West Delhi"),
    ("110043", "South West Delhi"),
    ("110044", "South East Delhi"),
    ("110045", "South West Delhi"),
    ("110046", "South Delhi"),
    ("110048", "South Delhi"),
    ("110049", "South Delhi"),
    ("110051", "Shahdara"),
    ("110052", "North West Delhi"),
    ("110053", "North Delhi"),
    ("110054", "North Delhi"),
    ("110055", "West Delhi"),
    ("110056", "North West Delhi"),
    ("110057", "West Delhi"),
    ("110058", "West Delhi"),
    ("110059", "West Delhi"),
    ("110060", "South Delhi"),
    ("110061", "South West Delhi"),
    ("110062", "South Delhi"),
    ("110063", "South West Delhi"),
    ("110064", "North West Delhi"),
    ("110065", "South Delhi"),
    ("110066", "South Delhi"),
    ("110067", "South Delhi"),
    ("110070", "South West Delhi"),
    ("110075", "East Delhi"),
    ("110076", "South East Delhi"),
    ("110080", "West Delhi"),
    ("110081", "North West Delhi"),
    ("110082", "East Delhi"),
    ("110083", "East Delhi"),
    ("110084", "North East Delhi"),
    ("110085", "North Delhi"),
    ("110086", "North West Delhi"),
    ("110087", "West Delhi"),
    ("110088", "North West Delhi"),
    ("110091", "East Delhi"),
    ("110092", "Shahdara"),
    ("110093", "North East Delhi"),
    ("110094", "East Delhi"),
    ("110095", "East Delhi"),
    ("110096", "South East Delhi"),
]

DEPARTMENTS = ["Delhi Police", "Revenue Department", "Municipal Corporation", "Electricity Board"]

FIRST_NAMES = [
    "Rajesh",
    "Suresh",
    "Pradeep",
    "Anil",
    "Vijay",
    "Manoj",
    "Sanjay",
    "Ramesh",
    "Mukesh",
    "Dinesh",
    "Ashok",
    "Rakesh",
    "Vinod",
    "Naresh",
    "Satish",
    "Sunita",
    "Anita",
    "Kavita",
    "Neeta",
    "Pooja",
    "Seema",
    "Reena",
    "Priya",
    "Geeta",
    "Meena",
    "Ritu",
    "Savita",
    "Kiran",
    "Asha",
    "Nisha",
]

LAST_NAMES = [
    "Kumar",
    "Sharma",
    "Verma",
    "Singh",
    "Gupta",
    "Jain",
    "Mishra",
    "Yadav",
    "Chauhan",
    "Pandey",
    "Tiwari",
    "Srivastava",
    "Dubey",
    "Saxena",
    "Agarwal",
]


def _deterministic_name(seed: str) -> str:
    """Generate a deterministic name from a seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    first = FIRST_NAMES[h % len(FIRST_NAMES)]
    last = LAST_NAMES[(h >> 8) % len(LAST_NAMES)]
    return f"{first} {last}"


def _make_id(pin: str, dept: str, designation: str) -> str:
    """Generate a deterministic officer ID."""
    raw = f"officer_{pin}_{dept}_{designation}".lower().replace(" ", "_")
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def generate_synthetic_officers() -> list[dict]:
    """
    Generate a realistic CPGRAMS-style officer dataset.

    Creates ~160 officers across Delhi PIN codes with proper hierarchy:
    - 4 Tier-1 (Commissioner/State Nodal per department)
    - ~20 Tier-2 (DCP/DM per district cluster)
    - ~136 Tier-3 (ASI/Inspector per PIN per department)
    """
    officers: list[dict] = []
    tier1_ids: dict[str, str] = {}  # dept -> id
    tier2_ids: dict[str, str] = {}  # (district, dept) -> id

    demo_email = os.environ.get("DEMO_OFFICER_EMAIL", "team@actionablejustice.dev")

    # Step 1: Create Tier 1 officers (one per department)
    for dept in DEPARTMENTS:
        if dept == "Delhi Police":
            desig = "Commissioner of Police"
        else:
            desig = "State Nodal Officer"

        oid = _make_id("110000", dept, desig)
        name = _deterministic_name(f"tier1_{dept}")

        officers.append(
            {
                "id": oid,
                "name": f"Sh. {name}",
                "designation": desig,
                "department": dept,
                "jurisdictionPin": "110001",  # HQ pin
                "email": demo_email,
                "parentId": None,
            }
        )
        tier1_ids[dept] = oid

    # Step 2: Create Tier 2 officers (one per district per department)
    districts_seen: dict[str, str] = {}  # district_name -> first pin
    for pin, district in DELHI_DISTRICTS:
        if district not in districts_seen:
            districts_seen[district] = pin

    for district, pin in districts_seen.items():
        for dept in DEPARTMENTS:
            if dept == "Delhi Police":
                desig = "DCP"
            elif dept == "Revenue Department":
                desig = "District Magistrate"
            elif dept == "Municipal Corporation":
                desig = "Senior Inspector"
            else:
                desig = "Superintendent"

            oid = _make_id(pin, dept, desig)
            name = _deterministic_name(f"tier2_{district}_{dept}")

            officers.append(
                {
                    "id": oid,
                    "name": f"Sh. {name}",
                    "designation": f"{desig} ({district})",
                    "department": dept,
                    "jurisdictionPin": pin,
                    "email": demo_email,
                    "parentId": tier1_ids[dept],
                }
            )
            tier2_ids[(district, dept)] = oid

    # Step 3: Create Tier 3 officers (ground level)
    # One per PIN per primary department (Delhi Police), sampled for others
    for pin, district in DELHI_DISTRICTS:
        # Delhi Police — always have an ASI per PIN
        desig = "ASI"
        oid = _make_id(pin, "Delhi Police", desig)
        name = _deterministic_name(f"tier3_{pin}_Delhi Police")
        parent_key = (district, "Delhi Police")

        officers.append(
            {
                "id": oid,
                "name": f"Sh. {name}",
                "designation": desig,
                "department": "Delhi Police",
                "jurisdictionPin": pin,
                "email": demo_email,
                "parentId": tier2_ids.get(parent_key),
            }
        )

        # Other departments — add for every 3rd PIN to keep count manageable
        pin_num = int(pin)
        if pin_num % 3 == 0:
            for dept in DEPARTMENTS[1:]:
                if dept == "Revenue Department":
                    desig = "Clerk"
                elif dept == "Municipal Corporation":
                    desig = "Junior Engineer"
                else:
                    desig = "Lineman"

                oid = _make_id(pin, dept, desig)
                name = _deterministic_name(f"tier3_{pin}_{dept}")
                parent_key = (district, dept)

                officers.append(
                    {
                        "id": oid,
                        "name": f"Sh. {name}",
                        "designation": desig,
                        "department": dept,
                        "jurisdictionPin": pin,
                        "email": demo_email,
                        "parentId": tier2_ids.get(parent_key),
                    }
                )

    logger.info("Generated %d synthetic officers", len(officers))
    return officers


def read_csv_officers(csv_path: str) -> list[dict]:
    """
    Read officers from a CPGRAMS-style CSV file.

    Expected columns: name, designation, department, jurisdictionPin (or pin), email
    """
    officers = []

    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pin = row.get("jurisdictionPin", row.get("pin", row.get("PIN", ""))).strip()
            # Normalise PIN to 6 digits
            if pin and len(pin) < 6:
                pin = pin.zfill(6)

            name = row.get("name", row.get("Name", row.get("officer_name", ""))).strip()
            designation = row.get("designation", row.get("Designation", "")).strip()
            department = row.get("department", row.get("Department", "")).strip()
            email = row.get("email", row.get("Email", row.get("email_id", ""))).strip()

            if not name or not pin:
                continue

            oid = _make_id(pin, department, designation)

            officers.append(
                {
                    "id": oid,
                    "name": name,
                    "designation": designation,
                    "department": department or "General",
                    "jurisdictionPin": pin,
                    "email": email or "noreply@gov.in",
                    "parentId": None,  # Will be inferred
                }
            )

    # Infer hierarchy
    officers = _infer_hierarchy(officers)
    logger.info("Read %d officers from CSV: %s", len(officers), csv_path)
    return officers


def _infer_hierarchy(officers: list[dict]) -> list[dict]:
    """Infer parent-child relationships from designation tiers."""
    # Group by (dept, pin_prefix) — first 3 digits for district grouping
    by_dept: dict[str, list[dict]] = {}
    for o in officers:
        dept = o["department"]
        if dept not in by_dept:
            by_dept[dept] = []
        by_dept[dept].append(o)

    for dept, dept_officers in by_dept.items():
        tiers: dict[int, list[dict]] = {1: [], 2: [], 3: []}
        for o in dept_officers:
            tier = get_tier(o["designation"])
            tiers[tier].append(o)

        # Link Tier 3 → closest Tier 2
        for o3 in tiers[3]:
            best_parent = None
            for o2 in tiers[2]:
                if o2["jurisdictionPin"][:3] == o3["jurisdictionPin"][:3]:
                    best_parent = o2
                    break
            if not best_parent and tiers[2]:
                best_parent = tiers[2][0]
            if best_parent:
                o3["parentId"] = best_parent["id"]

        # Link Tier 2 → closest Tier 1
        for o2 in tiers[2]:
            if tiers[1]:
                o2["parentId"] = tiers[1][0]["id"]

    return officers


def upsert_officers_to_postgres(officers: list[dict]) -> int:
    """
    Upsert officers into the Postgres Officer table.

    Uses ON CONFLICT on id to make re-runs idempotent.
    Returns the number of officers upserted.
    """
    db_url = settings.database_url.split("?")[0]
    engine = create_engine(db_url, pool_pre_ping=True)

    total = 0
    batch_size = 50

    try:
        with Session(engine) as session:
            for i in range(0, len(officers), batch_size):
                batch = officers[i : i + batch_size]

                for officer in batch:
                    try:
                        session.execute(
                            text("""
                                INSERT INTO "Officer" (id, name, designation, department, "jurisdictionPin", email, "parentId", "createdAt")
                                VALUES (:id, :name, :designation, :department, :pin, :email, :parentId, NOW())
                                ON CONFLICT (id) DO UPDATE SET
                                    name = EXCLUDED.name,
                                    designation = EXCLUDED.designation,
                                    department = EXCLUDED.department,
                                    "jurisdictionPin" = EXCLUDED."jurisdictionPin",
                                    email = EXCLUDED.email,
                                    "parentId" = EXCLUDED."parentId"
                            """),
                            {
                                "id": officer["id"],
                                "name": officer["name"],
                                "designation": officer["designation"],
                                "department": officer["department"],
                                "pin": officer["jurisdictionPin"],
                                "email": officer["email"],
                                "parentId": officer.get("parentId"),
                            },
                        )
                        total += 1
                    except Exception as e:
                        logger.error("Failed to upsert officer %s: %s", officer.get("name", "?"), e)

                session.commit()
                logger.info(
                    "  Upserted batch %d-%d (%d officers)", i, i + len(batch) - 1, len(batch)
                )

    except Exception as e:
        logger.error("Database connection failed: %s", e)

    logger.info("Total officers upserted: %d / %d", total, len(officers))
    return total
