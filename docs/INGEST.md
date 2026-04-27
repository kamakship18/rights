# Data Ingestion Guide — Actionable Justice OS

## Overview

The ingestion pipeline populates two data stores:

| Store | Namespace | Content | Count |
|-------|-----------|---------|-------|
| **Pinecone** | `legal-statutes` | IPC/BNS sections, Noise Rules 2000, Electricity Rules 2020 | ~80 vectors |
| **Pinecone** | `officers` | Officer embeddings for vector fallback search | ~160 vectors |
| **Postgres** | `Officer` table | CPGRAMS-style nodal officers with hierarchy | ~160 rows |

## Quick Start

```bash
# Ensure Docker is running
pnpm docker:up

# Run everything
make ingest
# or explicitly:
cd apps/ai && uv run python -m ingest all
```

### Subcommands

```bash
# Statutes only (Pinecone)
cd apps/ai && uv run python -m ingest statutes

# Officers only (Postgres + Pinecone)
cd apps/ai && uv run python -m ingest officers
```

## Data Sources

### Statutes

| Source | Sections | Licence |
|--------|----------|---------|
| Indian Penal Code, 1860 (IPC) | 55 most-cited sections | Govt. of India Open Data |
| Bharatiya Nyaya Sanhita, 2023 (BNS) | Mapped to IPC equivalents | Govt. of India Open Data |
| Noise Pollution Rules, 2000 | 10 rules + Schedule | MoEFCC, Govt. of India |
| Electricity Consumer Rules, 2020 | 14 rules | Ministry of Power, Govt. of India |
| Domestic Violence Act, 2005 | 3 key sections | Govt. of India Open Data |
| POSH Act, 2013 | 3 key sections | Govt. of India Open Data |
| Consumer Protection Act, 2019 | 2 key sections | Govt. of India Open Data |
| IT Act, 2000 | 4 key sections | Govt. of India Open Data |

Statutes are stored as curated Python data in `apps/ai/ingest/sources/`. This is more reliable than scraping and gives deterministic, quality data.

### Officers

| Source | Format | Rows |
|--------|--------|------|
| **Synthetic CPGRAMS** (default) | Generated in-memory | ~160 officers |
| **Real CPGRAMS CSV** (optional) | CSV from data.gov.in | Varies |

The synthetic generator creates officers across 76 Delhi PIN codes with proper hierarchy:
- **Tier 1**: Commissioner / State Nodal (4 officers, one per department)
- **Tier 2**: DCP / DM / Senior Inspector (~50 officers, per district per department)
- **Tier 3**: ASI / Clerk / Junior Engineer (~110 officers, per PIN)

To use a real CPGRAMS CSV:

```bash
export INGEST_OFFICERS_CSV=/path/to/cpgrams_officers.csv
cd apps/ai && uv run python -m ingest officers
```

Expected CSV columns: `name`, `designation`, `department`, `jurisdictionPin` (or `pin`), `email`

Download from: [data.gov.in — CPGRAMS Nodal Officers](https://data.gov.in/search?title=cpgrams+nodal+officers)

## Idempotency

All operations are idempotent — safe to re-run:

- **Pinecone**: Vector IDs are `sha256(source + section + chunk_index)`. Upserts overwrite existing vectors with the same ID.
- **Postgres**: Uses `ON CONFLICT (id) DO UPDATE`. Officer IDs are `sha256(pin + dept + designation)`.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PINECONE_API_KEY` | Yes | — | Pinecone API key |
| `PINECONE_INDEX` | No | `legal-statutes` | Pinecone index name |
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/justice_os` | Postgres URL |
| `INGEST_OFFICERS_CSV` | No | — | Path to CPGRAMS CSV (uses synthetic if unset) |
| `DEMO_OFFICER_EMAIL` | No | `team@actionablejustice.dev` | Email for all demo officers |

## Deployment

This job runs **on-demand**, never on every deploy:

```bash
# Local
make ingest

# Render one-off
render run --service justice-os-ai -- python -m ingest all
```

## Logs

All logs are structured and readable. Failures are caught per-chunk, not per-run:

```
2026-04-26 03:30:00 [INFO] ingest: 🚀 Justice OS Ingestion Pipeline
2026-04-26 03:30:00 [INFO] ingest: STATUTE INGESTION — Starting
2026-04-26 03:30:00 [INFO] ingest: Source sections: IPC/BNS=55, Noise=10, Electricity=14, Total=79
2026-04-26 03:30:01 [INFO] ingest:   Upserted batch 0-49 (50 vectors) to namespace 'legal-statutes'
2026-04-26 03:30:02 [INFO] ingest:   Upserted batch 50-78 (29 vectors) to namespace 'legal-statutes'
2026-04-26 03:30:02 [INFO] ingest: ✅ Statute ingestion complete
```
