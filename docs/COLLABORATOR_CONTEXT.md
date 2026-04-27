# Actionable Justice OS — Collaborator & Cursor Context Report

> **Purpose:** One document for a new teammate (or a fresh Cursor chat) to understand what this repo is, how it is wired, what is real vs. simulated, and how to run and verify the system.  
> **Read time:** ~15 minutes. For deeper product intent, also read `Layers.md` and `PROJECT_BLUEPRINT.md` in the repo root.

---

## 1. What this product is (elevator pitch)

**Actionable Justice OS** is a hackathon-style monorepo for an *execution-first* Indian citizen grievance flow: safety triage, AI-assisted legal mapping, automated notice to an authority, and a follow-up / escalation loop. The team brand in docs is **Team Maverick (Kamakshi & Chirag)**.

It is **not** a real government integration (no CPGRAMS or court portal in production); it is a **demonstrable end-to-end prototype** with optional real APIs (email, maps, LLM, vector DB) when keys are configured.

---

## 2. The four “layers” (product map)

| Layer | Name | In this codebase |
|------:|------|------------------|
| 0 | **Urgency (SOS)** | Nest `SosModule` — Google Places (nearest help), Twilio SMS/WhatsApp, optional Socket.io, `tel:112` style messaging. |
| 1 | **Intelligence (statute + officer)** | FastAPI `apps/ai` — triage, RAG + statutes, officer lookup. |
| 2 | **Execution (filing)** | API creates `Grievance`, worker sends **legal notice** email via SendGrid. |
| 3 | **Persistence (follow-up)** | BullMQ delayed jobs: 7d follow-up, 14d escalation, optional `demoSpeed: fast` for demos. |

---

## 3. Monorepo layout (where everything lives)

```
actionable-justice-os/          # pnpm workspace root
├── apps/
│   ├── web/                    # Next.js 14 — UI, Clerk auth, chat, dashboard, grievance, SOS
│   ├── api/                    # NestJS — REST, Socket.io, BullMQ producer, CORS, grievance, SOS, filing
│   ├── worker/                 # NestJS + BullMQ consumer — notice send, follow-up, escalation, SendGrid
│   └── ai/                     # FastAPI — /triage, /map-statute, /find-officer, ingestion jobs
├── packages/
│   ├── shared/                 # @repo/shared — zod, notice builder, types
│   └── prisma/                 # @repo/prisma — schema, migrations, seed
├── infra/
│   ├── docker-compose.yml     # local Postgres + Redis
│   └── render.yaml            # cloud stubs (Render)
└── docs/                      # execution plan, prompts, this file, etc.
```

**Internal package names** use the **`@repo/*`** prefix (e.g. `@repo/web`, `@repo/api`, `@repo/worker`, `@repo/prisma`, `@repo/shared`).

---

## 4. Services, ports, and dependencies

| Service | Default port | Tech | Depends on |
|--------|---------------|------|------------|
| `web` | 3000 | Next.js, Tailwind, Framer | API URL + Clerk keys for protected routes |
| `api` | 4000 | NestJS, BullMQ, Socket.io | Postgres, **Redis** (queues), `apps/ai` (HTTP) |
| `worker` | 4001 | NestJS, Bull workers, cron | Postgres, **Redis**, same SendGrid as “real” email path |
| `ai` | 8000 | FastAPI, Groq, Pinecone, Prisma’s DB (via SQLAlchemy) for officers | Postgres (optional but needed for real officer SQL), optional Pinecone/Groq keys |

**Infrastructure (local):** Docker Compose provides **PostgreSQL** and **Redis**. Without Redis, the API can accept requests but **Bull jobs will not process** — the grievance may stay in a pre-notice state until the worker runs.

---

## 5. End-to-end data flow (happy path: “file a grievance from chat”)

1. **User** opens `/chat`, enters text + 6-digit PIN, submits.
2. **`web`** calls **`POST /grievance/intent`** (or the route your `lib/api` names `intentPreview`) on **`api`**, with Clerk JWT.
3. **`api` `GrievanceService.preview`** calls **`apps/ai`** in sequence/parallel:
   - **`POST /triage`** — classifies **urgency** + **category** (uses **Groq**; on failure, safe default fallback).
   - **`POST /map-statute`** — **Pinecone** RAG + **Groq** + **Indian Kanoon** (or Kanoon **fallback** URLs if no key).
   - **`POST /find-officer`** — **Postgres `Officer` rows** (category → department, PIN) then optional **Pinecone `officers`** namespace.
4. User reviews **preview** and confirms.
5. **`api` `GrievanceService.create`** inserts **`Grievance`** (status `PENDING`), enqueues **Bull** job on queue **`notice`**.
6. **`worker` `NoticeProcessor`** builds HTML/text notice, calls **SendGrid**, on success: **`NoticeEvent` FILED**, `Grievance` → `FILED`, schedules **followup** job.
7. User can open **`/grievance/{id}`** to see the **chain of action** (events in DB).

**Critical:** The **worker must be running** and **Redis** must be up for step 6 to happen. **AI service** must be up for step 3 if you use the real preview flow from the UI.

---

## 6. How “nodal officers” are chosen (not magic CPGRAMS)

- Officers are **rows in the `Officer` table** (Prisma) with a **hierarchy** (`parentId` for escalation).
- **Seeded demo data** (`packages/prisma/seed.ts`) inserts three fictional Delhi Police officers (ASI / DCP / Commissioner) for PIN **110001**, all sharing **`DEMO_OFFICER_EMAIL`** (override with env) — **not** live government data.
- **Optional `apps/ai/ingest/officers.py`** can load a **Data.gov.in CPGRAMS CSV** *or* generate a **synthetic** dataset, then (separately) you can **embed to Pinecone** for vector fallback (`seed_officers_pinecone.py`).
- **`find-officer` logic** (see `apps/ai/services/database.py` + `apps/ai/routers/officer.py`): **SQL by PIN + department (from category)**, else any officer for PIN, else **Pinecone** “officers” if populated.

**Honest label for judges:** *“Officer table + rules-based routing + RAG-style fallback; demo seed / optional ingest, not a live government roster.”*

---

## 7. “Real” vs. simulated / dev-only behavior

| Area | When it behaves as “production-like” | When it is dev / mock / fallback |
|------|----------------------------------------|-----------------------------------|
| **Grievance create + DB** | Always — row is real in Postgres. | N/A |
| **Notice email (SendGrid)** | `SENDGRID_API_KEY` and verified **`SENDGRID_FROM_EMAIL`**, and worker has same env. | No key: worker **logs** `[DEV]` style lines and still returns “success” so the job can mark **FILED** (no real deliverability) |
| **Triage (Groq)** | `GROQ_API_KEY` set. | Fails over to **fixed HIGH / other** with low confidence. |
| **Pinecone RAG** | Key + ingested index. | Empty / missing → statute path uses **KNOWN_STATUTES** map + less retrieval. |
| **Indian Kanoon** | `INDIAN_KANOON_API_KEY` in AI settings. | Static / canned citation URLs in `kanoon_client` fallback. |
| **SOS: Twilio** | Full Twilio env + `FROM` numbers. | **Skips** real send, returns ok in dev. |
| **SOS: Google Places** | `GOOGLE_PLACES_API_KEY` set. | **Empty** nearby list, logged warning. |
| **Multilingual voice (Bhashini)** | Planned in blueprint; not wired in current tree | Chat has a **mic button placeholder** (“coming soon” in `strings`); no Bhashini in TS sources |

---

## 8. Key environment variables (by concern)

- **All apps (often root `.env` or per-app with same values for DB/Redis):** `DATABASE_URL`, `REDIS_URL`
- **API + web:** `CLERK` keys — web needs `NEXT_PUBLIC_CLERK_*`, API `CLERK_SECRET_KEY` (or your project’s exact Clerk setup)
- **Web → API:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL` (default to `http://localhost:4000` in local dev)
- **API → AI:** `AI_SERVICE_URL` (default `http://localhost:8000`)
- **Worker + email:** `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` — **place on the worker** for real sends
- **AI:** `GROQ_API_KEY`, `PINECONE_API_KEY`, `KANOON` / `INDIAN_KANOON` as in `apps/ai/config.py`
- **SOS (API):** `GOOGLE_PLACES_API_KEY`, Twilio vars
- **Seed override:** `DEMO_OFFICER_EMAIL`, `DEMO_PHONE_*`

See **`.env.example`** at the repo root for a template. **Never commit** real secrets.

---

## 9. How to run locally (minimal checklist)

1. **Node 20+, pnpm 9+** (`package.json` `engines` + `packageManager`).
2. `pnpm install` (from repo root).
3. `pnpm docker:up` — Postgres + Redis.
4. `pnpm db:push` or migrations + `pnpm db:seed` (if you need demo data).
5. `pnpm dev` — starts all Node apps in parallel (per root `dev` script).
6. In a second terminal, **`cd apps/ai && uv run uvicorn main:app --reload --port 8000`**.

Health checks (all should return JSON with `ok: true`):

- `http://localhost:3000/healthz` (web)  
- `http://localhost:4000/healthz` (api)  
- `http://localhost:4001/healthz` (worker)  
- `http://localhost:8000/healthz` (ai)  

**Verify filing:** See section 10. **Confirm SendGrid** in worker logs and SendGrid dashboard if key is set.

---

## 10. How to verify “was it filed?” and “was email really sent?”

- **Filing persisted:** new row in **`Grievance`**, user linked by Clerk. After worker runs: **`status = FILED`**, **`NoticeEvent`** with kind **`FILED`**.
- **Email really sent (not just dev log):** `SENDGRID_API_KEY` on **worker** + verified sender, then check **SendGrid Activity** and the inbox for **`officer.email`**.
- If email key is **missing:** grievance can still go to **FILED** in DB with only **log** output — that is by design in `SendGridService` for local hacking.

**Tooling:** `pnpm db:studio` — Prisma Studio to inspect `Grievance`, `Officer`, `NoticeEvent`.

---

## 11. Important code entry points (for debugging)

| Concern | Start here |
|---------|------------|
| Grievance API | `apps/api/src/modules/grievance/grievance.service.ts` |
| AI client from API | `apps/api/src/modules/grievance/ai.service.ts` |
| Notice email job | `apps/worker/src/queues/notice.processor.ts` |
| SendGrid (worker) | `apps/worker/src/filing/sendgrid.service.ts` |
| Triage / statute / officer | `apps/ai/routers/triage.py`, `statute.py`, `officer.py` |
| SQL officer lookup (AI) | `apps/ai/services/database.py` |
| Prisma schema | `packages/prisma/schema.prisma` |
| Chat UI | `apps/web/src/app/chat/page.tsx` |
| Shared notice HTML | `packages/shared/src/notice/notice.builder.ts` |

---

## 12. Documentation already in the repo

| File | Use |
|------|-----|
| `README.md` | Quick start, scripts, stack |
| `docs/EXECUTION_PLAN.md` | Phased build, deployment intent, checklists |
| `docs/CURSOR_PROMPTS.md` | Big prompts for Cursor to extend the system |
| `docs/DB.md`, `docs/INGEST.md` | DB and ingestion notes |
| `Layers.md`, `PROJECT_BLUEPRINT.md` | Product vision and layers |

---

## 13. What to paste into **Cursor** for your friend

- **Always attach:** this file (`docs/COLLABORATOR_CONTEXT.md`), `README.md`, and the file you are about to change.
- For product wording / judges: `PROJECT_BLUEPRINT.md` + `docs/JUDGES.md` if present.
- For AI/RAG changes: the relevant `apps/ai/routers/*.py` and `config.py`.

---

## 14. Glossary

| Term | Meaning here |
|------|--------------|
| **Bull / BullMQ** | Redis-backed job queue; `notice` → `followup` → `escalation`. |
| **Chain of action** | `NoticeEvent` rows shown on the grievance timeline (FILED, FOLLOWUP_7D, ESCALATION_14D, SOS_BROADCAST, etc.). |
| **RAG** | Pinecone vector search over “legal-statutes” (and category filtering in `statute.py`). |
| **demo seed** | `packages/prisma/seed.ts` preloads demo user, officers, and sample grievances for the dashboard. |

---

*This report reflects the intended architecture and the codebase structure at the time of writing. If a feature (e.g. Bhashini voice) is in the docs but not in the repo, treat the docs as roadmap, not as shipped code.*
