# Database Guide — Actionable Justice OS

## Connection

| Environment | Provider | URL Source |
|-------------|----------|------------|
| **Local dev** | Docker Postgres 16 | `infra/docker-compose.yml` → `postgresql://postgres:postgres@localhost:5432/justice_os` |
| **Cloud** | Neon (free tier) | Neon dashboard → Connection string → paste into Render/Vercel env vars |

## Quick Commands

```bash
# Start local Postgres + Redis
pnpm docker:up

# Create .env from example (first time)
cp packages/prisma/.env.example packages/prisma/.env

# Run migrations (creates tables)
pnpm --filter @repo/prisma migrate:dev --name init

# Seed demo data (idempotent — safe to re-run)
pnpm --filter @repo/prisma db:seed

# Open Prisma Studio (visual DB browser)
pnpm --filter @repo/prisma studio

# Reset everything (drops + recreates + re-seeds)
pnpm --filter @repo/prisma migrate:reset
```

## Schema Overview

```
User ──< EmergencyContact
  │
  └──< Grievance ──< NoticeEvent
          │
          └── Officer ──< Officer (self-ref: escalation hierarchy)
```

### Models

| Model | Purpose |
|-------|---------|
| `User` | Citizens filing grievances. Linked to Clerk auth via `clerkId`. |
| `EmergencyContact` | SOS broadcast targets. Phone numbers verified via Twilio. |
| `Officer` | Nodal grievance officers. Self-referential `parent` for escalation chain. |
| `Grievance` | Core entity. Tracks lifecycle from PENDING → FILED → FOLLOWED_UP → ESCALATED → RESOLVED. |
| `NoticeEvent` | Chain-of-Action audit log. Records every email/SMS/WA sent for a grievance. |

### Enums

| Enum | Values |
|------|--------|
| `Urgency` | CRITICAL, HIGH, NORMAL |
| `GrievanceStatus` | PENDING, FILED, FOLLOWED_UP, ESCALATED, RESOLVED |
| `EventKind` | FILED, FOLLOWUP_7D, ESCALATION_14D, SOS_BROADCAST |
| `Channel` | EMAIL, SMS, WHATSAPP, SYSTEM |

### Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `Officer` | `(jurisdictionPin, department)` | Fast officer lookup by PIN + department |
| `Grievance` | `(userId, status)` | User's grievance dashboard filtering |
| `Grievance` | `(pin)` | Geo-based grievance queries |
| `NoticeEvent` | `(grievanceId, kind)` | Timeline rendering for Chain-of-Action |

## Demo Seed Data

The seed script (`packages/prisma/seed.ts`) creates:

| Entity | Count | Details |
|--------|-------|---------|
| Officers | 3 | ASI Local → DCP North → Commissioner (hierarchy) |
| Users | 1 | "Demo Citizen" with PIN 110001 (New Delhi) |
| Emergency Contacts | 2 | Linked to demo user |
| Grievances | 3 | Harassment (CRITICAL/FILED), Noise (HIGH/ESCALATED), Electricity (NORMAL/PENDING) |
| Notice Events | 4 | Full chain for noise complaint: FILED → FOLLOWUP_7D → ESCALATION_14D |

## Neon Branching for Demos

Neon supports database branching — create a `demo` branch so judges see clean data.

```bash
# Install Neon CLI
npm i -g neonctl

# Authenticate
neonctl auth

# Create a demo branch from main
neonctl branches create --name demo --project-id <your-project-id>

# Get the demo branch connection string
neonctl connection-string --branch demo

# Use that connection string in your demo environment
# Set it as DATABASE_URL in Vercel/Render for the demo
```

> **Tip**: Before each demo, reset the demo branch:
> ```bash
> neonctl branches delete demo && neonctl branches create --name demo
> ```

## Backfilling Officers (CPGRAMS Dataset)

When you have the full CPGRAMS dataset (1.07L+ officers from Data.gov.in):

1. Download the CSV from Data.gov.in (search "CPGRAMS Nodal Officers")
2. Create an ingestion script:
   ```bash
   # Will be implemented in Prompt 4
   pnpm --filter @repo/prisma run ingest:officers -- --csv path/to/cpgrams.csv
   ```
3. The script should:
   - Parse CSV rows into Officer records
   - Build the parent-child hierarchy from designation/department
   - Upsert by `(jurisdictionPin, department, designation)` to avoid duplicates
   - Generate Pinecone embeddings for vector-based officer search

## Deployment (Render)

Both `api` and `worker` services run migrations on deploy:

```yaml
# In render.yaml, each service has:
postDeployCommand: pnpm --filter @repo/prisma migrate:deploy
```

Ensure `DATABASE_URL` is set in each service's environment variables on Render.
