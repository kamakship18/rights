# Cursor / Antigravity Prompt Pack — Actionable Justice OS

> Paste these prompts **in order** into a fresh Cursor/Antigravity Agent chat. Each one is self-contained: it tells the agent what already exists, what to build, where to put it, and how to know it's done. Run, review, commit, then move to the next.
>
> **Always keep [`../Layers.md`](../Layers.md), [`../PROJECT_BLUEPRINT.md`](../PROJECT_BLUEPRINT.md) and [`./EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) attached as context** when running these prompts. Most prompts assume the agent can see them.
>
> Conventions used in every prompt:
> - **Tech**: Next.js 14 (App Router) + TS, NestJS, FastAPI, Prisma + Neon Postgres, Upstash Redis, Pinecone, BullMQ, Socket.io, Clerk, SendGrid, Twilio, Bhashini, Indian Kanoon, Google Places.
> - **Repo**: pnpm workspaces, structure shown in `EXECUTION_PLAN.md` §3. Use the **hackathon org repo** (or a private remote) when you push; you do not need a separate “your own” GitHub for day one.
> - **Deployment (Phase 2)**: Vercel (web) + Render (api, worker, ai) + Neon + Upstash + Pinecone — all free tier. It is **fine** to complete Prompts 1–9 (or a big chunk of them) **entirely locally** and only do cloud accounts + first push + deploy after ~1–1.5 days — see `EXECUTION_PLAN.md` §2.1.
> - **Style**: TypeScript strict, ESLint + Prettier, zod at every boundary, no secrets in git.

---

## Prompt 1 — Monorepo bootstrap, tooling, CI, hello-world (local first; deploy optional)

```text
You are bootstrapping the Actionable Justice OS monorepo. Read Layers.md, PROJECT_BLUEPRINT.md and docs/EXECUTION_PLAN.md (especially §2.1) before starting.

CONTEXT
- Empty or fresh folder. Nothing built yet.
- Target stack: Next.js 14, NestJS, FastAPI, Prisma + Postgres, Redis, Pinecone, BullMQ, Socket.io.
- The team may **not** want to push to a public org repo on day one — that is OK. Prioritize a fully working **local** stack; cloud deploy is a follow-up step in the same PR or a later day.

GOAL
Set up a pnpm-workspace monorepo with four runnable apps, two shared packages, infra for local dev, and a "hello world" on **localhost** for each service. Include CI + render/vercel scaffolding in the **repo** so cloud connect takes minutes later, but the **Definition of Done** for this prompt is local health checks, not a live public URL.

PHASE A (required — do this first)
- Root: package.json (pnpm workspaces), pnpm-workspace.yaml, .nvmrc (node 20), .editorconfig, .prettierrc, eslint config (typescript, prettier), .gitignore, tsconfig.base.json, README.md
- apps/web: Next.js 14 App Router + TS + Tailwind + Framer Motion. Home page renders "Actionable Justice OS — alive". Add /healthz route returning JSON {ok: true, service: "web"}.
- apps/api: NestJS + Socket.io + BullMQ producer scaffolding. /healthz returns 200 JSON. Empty SosGateway placeholder.
- apps/worker: NestJS standalone application that boots, logs "worker ready", exposes a minimal /healthz on worker PORT. Include a node-cron tick that logs every minute.
- apps/ai: FastAPI app with /healthz returning {"ok": true, "service": "ai"}. Use uv or poetry; commit pyproject.toml + lock.
- packages/shared: TS package with zod schemas placeholder and exported types Grievance, Officer, NoticeEvent.
- packages/prisma: Prisma project with empty schema.prisma (datasource + generator only) and a placeholder seed.ts. Document DATABASE_URL for local Docker in .env.example.
- infra/docker-compose.yml: postgres:16 + redis:7 for local dev. This is the default DATABASE_URL/REDIS_URL for Prompt 2+ until the team adds Neon/Upstash.

PHASE B (in-repo preparation for later deploy — add files, do not require the user to connect services yet)
- infra/render.yaml: 3 services (api, worker, ai) wired to apps/api, apps/worker, apps/ai. Use pnpm (corepack enable, pnpm@9).
- .github/workflows/ci.yml: install pnpm, run lint, typecheck, build for all TS apps; ruff + mypy for ai. (CI runs when they push; local dev does not need GitHub.)
- vercel.json or apps/web/vercel.json: document web app root for Vercel if required by their layout.

ACCEPTANCE CRITERIA
- `pnpm install` then `pnpm -r build` succeeds.
- `pnpm --filter web dev`, `pnpm --filter api dev`, `pnpm --filter worker dev` all start without errors.
- `cd apps/ai && uv run uvicorn main:app` starts FastAPI; curl /healthz works.
- `docker compose -f infra/docker-compose.yml up -d` brings up Postgres + Redis.
- README documents: prerequisites, env-var matrix, **how to run every app on localhost** (one section), and a second short section "When you're ready: connect Vercel + Render + Neon" pointing to the same files.

DEPLOYMENT IMPACT (optional — the user may do this days later, after first meaningful local vertical slice and/or a private/push to hackathon remote)
1. Push to the hackathon-provided remote (or private) when they choose — not a blocker for Prompt 1.
2. Connect Vercel to web; Render Blueprint from render.yaml; provision Neon, Upstash, env vars; hit public /healthz; add Vercel cron pinger. Treat Prompt 10 as the "full deploy" consolidation pass if they delayed this.

DO NOT
- Do not add any business logic yet.
- Do not commit any secrets. Use .env.example files only.
- Do not require the user to have already created Vercel, Render, or Neon to consider Prompt 1 "done" — local is enough.
```

---

## Prompt 2 — Prisma schema, migrations, seed

```text
Read Layers.md, PROJECT_BLUEPRINT.md and docs/EXECUTION_PLAN.md §5 before starting.

CONTEXT
- Monorepo from Prompt 1 is in place. packages/prisma exists with an empty schema.
- DATABASE_URL: use **local Docker Postgres** from `infra/docker-compose.yml` for dev; switch to Neon when the team sets up cloud (same schema, new URL in `.env`).

GOAL
Define the full Prisma schema for Actionable Justice OS, generate migrations against Neon, and create deterministic seed data that powers the demo.

CREATE / MODIFY
- packages/prisma/schema.prisma — implement exactly the model in EXECUTION_PLAN.md §5: User, EmergencyContact, Officer (self-referential parent for escalation), Grievance, NoticeEvent, plus enums Urgency, GrievanceStatus, EventKind, Channel.
- Add @@index on Officer(jurisdictionPin, department), Grievance(userId, status), NoticeEvent(grievanceId, kind).
- packages/prisma/seed.ts:
  - Insert 3 demo Officers with parent-child hierarchy: "ASI Local" -> "DCP North" -> "Commissioner" (use the user's own email for all three so demo emails are visible).
  - Insert 3 demo personas covering harassment (urgency=CRITICAL), noise (urgency=HIGH), electricity (urgency=NORMAL). Each linked to one demo User.
  - Insert 1 demo User with Clerk-style id, primaryPin "110001", and 2 EmergencyContacts (use the team's verified Twilio numbers from env).
- packages/prisma/package.json scripts: "generate", "migrate:dev", "migrate:deploy", "seed", "studio".
- packages/shared: re-export Prisma types so apps/api and apps/worker share them without circular deps.

ACCEPTANCE CRITERIA
- `pnpm --filter @aj/prisma migrate:dev --name init` creates the schema in the database pointed at by DATABASE_URL (local first; Neon when provided).
- `pnpm --filter @aj/prisma seed` inserts demo data idempotently (re-running is safe; use upsert).
- Prisma Studio shows expected rows.
- Generated client is importable from apps/api with full typing.
- A short docs/DB.md explains: how to branch Neon for demos, how to reset, how to backfill officers.

DEPLOYMENT IMPACT
- On Render api + worker: add a postdeploy hook running `pnpm --filter @aj/prisma migrate:deploy`.
- Verify env DATABASE_URL is set on api and worker services.

DO NOT
- Do not weaken types with String where an enum fits.
- Do not seed real personal data.
```

---

## Prompt 3 — FastAPI AI service: triage, statute mapping, officer matching

```text
Read Layers.md §"Layer 1", PROJECT_BLUEPRINT.md and docs/EXECUTION_PLAN.md §6 before starting.

CONTEXT
- apps/ai is a FastAPI skeleton with /healthz only.
- Pinecone index "legal-statutes" exists (1 index free tier); credentials in env.
- Indian Kanoon API key in env.
- packages/prisma has Officer rows; the AI service connects to the same Postgres for officer lookup.

GOAL
Build three production-shaped FastAPI endpoints that ground all legal answers in real Indian law via RAG, never via LLM memory.

CREATE / MODIFY (under apps/ai)
- main.py: FastAPI app + CORS for the web origin + structured JSON logging.
- routers/triage.py: POST /triage {text, lang?} -> {urgency: "CRITICAL"|"HIGH"|"NORMAL", category: str, confidence: float, reasoning: str}.
  - Use a small classifier-style prompt with strict JSON output (use instructor or pydantic-ai); few-shot includes "I am being followed" -> CRITICAL/harassment.
- routers/statute.py: POST /map-statute {text, category} -> {statute, section, citations: [{source, snippet, url}], confidence}.
  - RAG pipeline: embed text -> Pinecone top-k=5 from "legal-statutes" namespace -> rerank -> ask LLM for the single best statute+section, must cite at least one chunk; if confidence < 0.55, return {needs_lawyer_review: true}.
  - Hit Indian Kanoon API to fetch the canonical section text and include URL in citations.
- routers/officer.py: POST /find-officer {pin, category} -> {officer, parent}.
  - Hybrid search: SQL filter by jurisdictionPin + department mapping for category; if zero rows, vector fallback over an "officers" Pinecone namespace; return the officer plus the parent in the hierarchy.
- services/embeddings.py: wrap OpenAI embeddings (or local sentence-transformers if no key) with caching by sha256 of input.
- services/pinecone_client.py and services/kanoon_client.py with retries + exponential backoff.
- pyproject.toml additions: fastapi, uvicorn, pydantic, instructor, pinecone-client, sqlalchemy, asyncpg, httpx, langchain-core, sentence-transformers.
- tests/: unit-test triage with three fixtures (harassment, noise, electricity) asserting expected category and urgency.

ACCEPTANCE CRITERIA
- `curl -X POST .../triage -d '{"text":"I am being followed home"}'` returns urgency=CRITICAL category=harassment.
- `curl -X POST .../map-statute -d '{"text":"loud DJ at night","category":"noise"}'` returns Noise Pollution (Regulation and Control) Rules, 2000 with at least one Indian Kanoon citation.
- `curl -X POST .../find-officer -d '{"pin":"110001","category":"noise"}'` returns the demo DCP North row with its parent Commissioner.
- All routes degrade gracefully when Pinecone or Kanoon is down (return needs_lawyer_review=true with explanation, never 500).
- Pytest is green; ruff + mypy clean.

DEPLOYMENT IMPACT
- Render ai service env: PINECONE_API_KEY, PINECONE_INDEX, KANOON_API_KEY, OPENAI_API_KEY (optional), DATABASE_URL.
- Add /docs to allowed routes; restrict CORS to the Vercel domain.

DO NOT
- Do not let the LLM answer without retrieved chunks.
- Do not return raw chunk text without source attribution.
```

---

## Prompt 4 — Data ingestion: IPC/BNS, rules, CPGRAMS officers

```text
Read Layers.md §"Layer 1" and docs/EXECUTION_PLAN.md before starting.

CONTEXT
- AI service from Prompt 3 expects content in Pinecone "legal-statutes" namespace and Officer rows in Postgres.
- We need a one-shot ingestion job that's safe to re-run (idempotent).

GOAL
Build a reproducible ingestion pipeline that loads:
1. IPC sections (legacy) and BNS sections (Bharatiya Nyaya Sanhita 2023) — section number, title, body — into Pinecone.
2. Noise Pollution (Regulation and Control) Rules, 2000 and Electricity (Rights of Consumers) Rules, 2020 — same shape.
3. CPGRAMS Nodal Officer dataset CSV from data.gov.in — name, designation, department, jurisdictionPin, email — into Postgres Officer rows with a synthesised hierarchy (sub-officer -> district officer -> state nodal).

CREATE
- apps/ai/ingest/__main__.py CLI with subcommands: `ingest statutes`, `ingest officers`, `ingest all`.
- apps/ai/ingest/sources/: small fetchers for each source (Indian Kanoon scraping is allowed for IPC/BNS; respect robots.txt, throttle).
- apps/ai/ingest/chunker.py: split each section into ~400-token chunks with section heading preserved in metadata.
- apps/ai/ingest/embed_and_upsert.py: batch embed and upsert to Pinecone with deterministic vector IDs (sha256(source + section + chunk_index)).
- apps/ai/ingest/officers.py: read CSV (path from env or URL), normalise PIN to 6-digit string, dedupe, infer hierarchy from "designation" tier mapping (clerk/asi -> dcp/dm -> commissioner/state), upsert into Postgres via the shared Prisma migration (use a small SQLAlchemy connection — do not require Node here).
- scripts/seed-pinecone-officers.ts (Node) OR a Python equivalent: also embed officer rows into a Pinecone "officers" namespace for the vector fallback in /find-officer.
- A tiny Makefile target: `make ingest`.

ACCEPTANCE CRITERIA
- `python -m ingest all` completes locally against a real Pinecone index and Neon DB; running again upserts (no duplicates).
- Pinecone "legal-statutes" namespace contains > 200 vectors after run (IPC alone has 511 sections — okay to subset to ~50 most-cited for the demo, but keep noise + electricity in full).
- `select count(*) from "Officer"` is > 100 from the CPGRAMS sample.
- A small docs/INGEST.md notes data sources, licence, and how to re-run.
- Logs are structured and readable; failures are caught per chunk, not per run.

DEPLOYMENT IMPACT
- This job runs locally or as a Render one-off (`render run` or a manual deploy with `command: python -m ingest all`). It must NOT run on every deploy.
- Add INGEST_OFFICERS_CSV env (path/URL) to documentation.

DO NOT
- Do not commit the raw CSVs or scraped HTML to git (use .gitignore for ingest/cache).
- Do not embed anything without a stable ID — re-runs must be deterministic.
```

---

## Prompt 5 — NestJS grievance, notice, filing modules + SendGrid

```text
Read Layers.md §"Layer 2", PROJECT_BLUEPRINT.md and docs/EXECUTION_PLAN.md §6 before starting.

CONTEXT
- apps/api is a NestJS skeleton with /healthz.
- Prisma client is shared via packages/prisma; AI service from Prompt 3 is reachable at AI_SERVICE_URL.
- SendGrid env: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL (verified single sender).
- Clerk env: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY.

GOAL
Build the NestJS modules that turn user intent into an actually-sent email to the right Nodal Officer, persisted as a Grievance + NoticeEvent.

CREATE / MODIFY (under apps/api/src)
- modules/auth: Clerk verification middleware; protect all routes except /healthz.
- modules/grievance:
  - DTOs (zod via nestjs-zod): IntentDto {text, lang?, pin, lat?, lng?}, CreateGrievanceDto extends IntentDto with {confirmedStatute, confirmedOfficerId}.
  - Controller:
    - POST /grievance/intent -> calls ai.triage + ai.mapStatute + ai.findOfficer in parallel where possible, returns a "preview card" {urgency, category, statute, section, officer, citations}.
    - POST /grievance -> persists Grievance(status=PENDING), enqueues NoticeJob on the "notice" BullMQ queue (with idempotencyKey=grievance.id), returns the grievance.
    - GET /grievance/:id -> returns grievance + Chain-of-Action timeline (NoticeEvents ordered).
    - GET /grievance -> list user's grievances with cursor pagination.
  - Service uses Prisma; never trusts client-supplied officer/statute (re-resolves server-side using AI service).
- modules/notice:
  - templates/handlebars/notice.hbs: formal Indian legal notice template with placeholders {citizenName, statute, section, factsBrief, dateISO, officerName, officerDesignation}.
  - NoticeBuilder.build(grievance) -> {subject, html, text}.
- modules/filing:
  - SendGridService.send({to, cc?, subject, html, text, idempotencyKey}). Use sendgrid mail with custom-args.idempotencyKey.
  - Retries: 3 attempts with exponential backoff; on permanent failure, write NoticeEvent(kind=FILED, channel=SYSTEM, payload={error}) and set status=PENDING (will be retried by worker).
- modules/sos: empty placeholder (filled in Prompt 7).
- BullMQ queues defined here as PRODUCERS only (consumer lives in apps/worker, Prompt 6).

ACCEPTANCE CRITERIA
- Authenticated POST /grievance/intent with body {text:"loud DJ next door at 1am", pin:"110001"} returns a preview with statute "Noise Pollution (Regulation and Control) Rules, 2000" and officer DCP North.
- POST /grievance creates a row, enqueues a job, returns 201.
- (After Prompt 6 worker is running) the demo officer email receives a real legal-shaped HTML notice.
- All endpoints typed end-to-end in TS via packages/shared.
- Unit tests for NoticeBuilder.build and integration test for /grievance/intent (mock AI service).

DEPLOYMENT IMPACT
- Render api env: DATABASE_URL, REDIS_URL (Upstash), AI_SERVICE_URL, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, CLERK_SECRET_KEY, FRONTEND_ORIGIN.
- CORS allow only FRONTEND_ORIGIN.

DO NOT
- Do not send email synchronously inside the HTTP request — always enqueue.
- Do not log PII (names, emails) at info level; use redacted fields.
```

---

## Prompt 6 — BullMQ worker: follow-up, escalation, cron tick

```text
Read Layers.md §"Layer 3" and docs/EXECUTION_PLAN.md §7-Day-3 before starting.

CONTEXT
- apps/worker is a NestJS standalone app that boots and logs.
- apps/api enqueues "notice" jobs (Prompt 5).
- Upstash REDIS_URL is available.
- Demo trick: a query/header `X-Demo-Speed: fast` on api collapses 7d -> 30s and 14d -> 60s.

GOAL
Implement the persistence loop so that every grievance auto-follows-up at 7 days and escalates to the parent officer at 14 days, plus a daily reconciliation cron that catches missed jobs.

CREATE / MODIFY (under apps/worker/src)
- queues/notice.processor.ts: consumes "notice" queue. On job:
  1. Build notice via NoticeBuilder (import from packages/shared or apps/api as a workspace dep).
  2. Send via SendGridService.
  3. Persist NoticeEvent(kind=FILED, channel=EMAIL).
  4. Schedule a delayed job on "followup" queue with delay = 7 days (or demoFastMs if grievance.demoSpeed = fast).
  5. Update Grievance.status = FILED, filedAt = now.
- queues/followup.processor.ts: on job:
  1. Reload grievance; if status in (RESOLVED) -> noop.
  2. Send follow-up email; persist NoticeEvent(kind=FOLLOWUP_7D).
  3. Update status = FOLLOWED_UP.
  4. Schedule "escalation" with delay = 7 more days.
- queues/escalation.processor.ts: on job:
  1. Reload grievance; if RESOLVED -> noop.
  2. Resolve parent Officer (Officer.parentId chain, walk one step up).
  3. Send notice CCing parent; persist NoticeEvent(kind=ESCALATION_14D, payload={ccOfficerId}).
  4. Update status = ESCALATED.
- cron/daily.tick.ts: node-cron at "0 9 * * *" IST that:
  - Finds grievances stuck in PENDING (filing failed earlier) and re-enqueues "notice".
  - Finds grievances FILED for >7d with no FOLLOWUP_7D event -> enqueue followup.
  - Finds grievances FOLLOWED_UP for >7d with no ESCALATION_14D event -> enqueue escalation.
  - Logs counts.
- Health: a tiny HTTP server on PORT exposing /healthz (so Render keeps the worker alive and the cold-start pinger can hit it).
- Unit tests: simulate a grievance through filed -> followup -> escalation using the demoFast path; assert exactly 3 NoticeEvents and final status ESCALATED.

ACCEPTANCE CRITERIA
- With `X-Demo-Speed: fast`, a freshly created grievance produces FILED, FOLLOWUP_7D and ESCALATION_14D NoticeEvents within ~90 seconds.
- The cron tick is observable in worker logs once a minute (use a 60s tick locally, switch to daily in prod via env CRON_SCHEDULE).
- Worker is resilient: if SendGrid 5xx, the job retries with backoff; if it ultimately fails, the grievance status reflects PENDING, not FILED.

DEPLOYMENT IMPACT
- Render worker service is a "Background Worker" type in render.yaml (no public URL needed, but expose /healthz on PORT for the pinger).
- Same env as api: DATABASE_URL, REDIS_URL, SENDGRID_*, AI_SERVICE_URL.

DO NOT
- Do not use setTimeout for delays — always BullMQ delayed jobs (survives restarts).
- Do not rely on local time; persist all timestamps in UTC.
```

---

## Prompt 7 — SOS module: Socket.io, Twilio, Google Places

```text
Read Layers.md §"Layer 0" and docs/EXECUTION_PLAN.md §7-Day-4 before starting.

CONTEXT
- apps/api modules/sos is an empty placeholder.
- apps/web has no SOS page yet (built in Prompt 8).
- Twilio env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_SMS, TWILIO_FROM_WHATSAPP.
- Google Places env: GOOGLE_PLACES_API_KEY (server-side only).

GOAL
Implement the Pulse SOS layer: a one-tap broadcast that, in under 5 seconds, sends WhatsApp + SMS with the user's GPS coordinates and the 3 nearest police stations + 3 nearest hospitals to all configured EmergencyContacts, while pushing live status over Socket.io.

CREATE / MODIFY
apps/api/src/modules/sos/
- sos.module.ts wired into AppModule.
- sos.gateway.ts: Socket.io namespace "/sos" with rooms keyed by userId. On connect, verify Clerk JWT.
- sos.controller.ts:
  - POST /sos/contacts (CRUD on EmergencyContact)
  - POST /sos/trigger {lat, lng, message?} -> {tel: "tel:112", broadcastedTo: number, places: {police[], hospitals[]}}.
- sos.service.ts:
  - On trigger:
    a) Persist NoticeEvent(kind=SOS_BROADCAST) immediately.
    b) Call Google Places Nearby Search twice in parallel: type=police radius=3000, type=hospital radius=3000 — keep top 3 each (name, vicinity, lat, lng, mapsUrl).
    c) For each EmergencyContact, send Twilio WhatsApp + SMS in parallel with body "[SOS from {name}] location: maps.google.com/?q={lat},{lng}. Nearest: {police[0].name}, {hospitals[0].name}." Hard-stop at 4 seconds; whatever sent, that sent.
    d) Emit "sos:status" events over the user's room as each delivery confirms.
    e) Return the response shape above.
- providers/twilio.client.ts and providers/places.client.ts with clear timeouts (1.5s per call) and structured error logs.
- Integration with AI: when /grievance/intent returns urgency=CRITICAL, the api response includes {sosRecommended: true} so the frontend can auto-open the red interface.

apps/worker/src (optional but preferred):
- queue "sos-broadcast" — for resilience, trigger can fan out via this queue so retries are free; for the demo direct-fan-out is fine if budget tight.

ACCEPTANCE CRITERIA
- POST /sos/trigger with valid Clerk auth and 2 verified Twilio test numbers as EmergencyContacts produces a real WhatsApp + SMS to both within 5 seconds.
- Google Places returns sensible results for lat/lng of New Delhi (28.6139, 77.2090).
- Socket.io client receives at least one "sos:status" event with deliveryStatus per contact.
- Failure isolation: if Places is down, Twilio still fires (and vice versa). Log clearly.
- e2e test using nock to mock Twilio + Places asserts the orchestration.

DEPLOYMENT IMPACT
- Add Twilio + Places env to api (and worker if used).
- Vercel web env: NEXT_PUBLIC_API_URL (already set), NEXT_PUBLIC_SOCKET_URL.
- Document Twilio trial limitation in JUDGES.md: "Trial accounts can SMS only verified numbers — fine for the demo".

DO NOT
- Do not put GOOGLE_PLACES_API_KEY in the browser. All Places calls go through api.
- Do not block the HTTP response on Twilio confirmations — use a 4s timeout and fire-and-forget tail.
```

---

## Prompt 8 — Next.js frontend: chat, dashboard, SOS, onboarding

```text
Read all three docs before starting (Layers.md, PROJECT_BLUEPRINT.md, docs/EXECUTION_PLAN.md).

CONTEXT
- apps/web is a Next.js 14 App Router skeleton.
- apps/api exposes /grievance/*, /sos/* and Socket.io namespaces.
- Clerk env on web: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY.

GOAL
Ship a polished, judge-ready frontend with four pages, a coherent design system, and tasteful Framer Motion choreography. Mobile-first; the SOS page must be flawless on a phone.

CREATE / MODIFY (under apps/web)
- app/layout.tsx: Clerk provider, global Tailwind, dark theme by default with a calm "justice" palette (deep navy + warm amber accent).
- app/(marketing)/page.tsx: hero + "Try the demo" CTA -> /sign-in -> /chat.
- app/chat/page.tsx:
  - Chat-like UI for grievance intake. One textarea + voice button (placeholder; wired in Prompt 9).
  - On submit: call /grievance/intent. Render a "Preview card" with statute, section, citations, officer.
  - Confirm button -> POST /grievance -> route to /grievance/[id].
  - If response.sosRecommended === true, expand a red bottom sheet linking to /sos with the message pre-filled.
- app/grievance/[id]/page.tsx: Chain-of-Action vertical timeline (FILED -> FOLLOWUP_7D -> ESCALATION_14D -> RESOLVED). Each event card shows channel + timestamp + payload preview. Framer Motion staggered reveal.
- app/dashboard/page.tsx: list of user's grievances grouped by status, with sparkline of activity. Server component using Clerk session + apps/api client.
- app/sos/page.tsx: full-bleed red gradient. Big circular pulse button (Framer Motion repeating scale). On press-and-hold for 1 second, request geolocation, POST /sos/trigger, show live deliveries from the Socket.io stream. Also render `<a href="tel:112">` deep link button. Show 3 nearest police + 3 nearest hospitals as cards with map links.
- app/onboard/page.tsx: form for emergency contacts (name, phone, relation), saved via /sos/contacts.
- components/ui/: Button, Card, Input, Tag, Timeline, Pulse — Tailwind + framer-motion, accessible (aria-labels, focus rings).
- lib/api.ts: typed fetch client using packages/shared types and Clerk getToken.
- lib/socket.ts: Socket.io client factory with auth token.
- middleware.ts (Clerk): protect /chat, /grievance, /dashboard, /sos, /onboard.

ACCEPTANCE CRITERIA
- Lighthouse mobile score >= 90 on /sos.
- Full happy path works against the deployed api: sign in -> chat ("loud DJ next door at 1am") -> preview -> confirm -> timeline page shows FILED event immediately.
- Press-hold SOS sends WhatsApp + SMS and shows live status updates in <5 s.
- All Tailwind classes follow the design tokens in tailwind.config.ts (no inline hex outside config).
- Empty states, loading skeletons, and error boundaries everywhere a network call happens.
- Storybook (or simple components/__previews__/) for the 6 UI primitives.

DEPLOYMENT IMPACT
- Vercel env: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY.
- Configure Clerk allowed origins to include the Vercel preview + production domains.

DO NOT
- Do not call SendGrid / Twilio / Places from the browser. Always via apps/api.
- Do not hard-code copy in components — use a small i18n object in lib/strings.ts so the future Hindi UI swap is easy.
```

---

## Prompt 9 — Bhashini WebSocket voice intake + intent-driven SOS expansion

```text
Read Layers.md §"Layer 2 -> Bhashini Integration" and docs/EXECUTION_PLAN.md §7-Day-5 before starting.

CONTEXT
- apps/web /chat page has a voice button placeholder.
- apps/api can add a Socket.io namespace "/voice" that brokers Bhashini.
- Bhashini env: BHASHINI_API_KEY, BHASHINI_USER_ID, BHASHINI_PIPELINE_ID (for ASR; pick Hindi by default, expose 22 langs).

GOAL
Wire a multilingual voice path: user taps mic, audio streams to apps/api over WebSocket, api proxies to Bhashini, partial transcripts come back live, final transcript is fed into /grievance/intent. If urgency=CRITICAL, auto-open the SOS red interface with the message pre-filled.

CREATE / MODIFY
apps/api/src/modules/voice/
- voice.gateway.ts: Socket.io namespace "/voice". Events:
  - client -> server "voice:start" {lang} -> server opens Bhashini WS, returns sessionId.
  - client -> server "voice:chunk" {pcm16Base64} -> forwarded to Bhashini.
  - client -> server "voice:stop" -> close Bhashini session, emit "voice:final" {transcript, lang}.
  - server -> client "voice:partial" {transcript}.
- providers/bhashini.client.ts: WebSocket client with reconnect; handles auth headers per Bhashini docs.

apps/web
- components/VoiceButton.tsx: press-and-hold to record using MediaRecorder API. Stream chunks to /voice as PCM16 base64 frames (downsample to 16 kHz mono in an AudioWorklet).
- components/LanguagePicker.tsx: 22 Indian languages with native script labels (default Hindi).
- app/chat/page.tsx wires these: live partial transcript replaces the textarea content as user speaks; on stop, auto-submits to /grievance/intent.
- If response.urgency === "CRITICAL", a sheet expands with: "It sounds urgent. Send SOS now?" with two buttons: "Yes, send SOS" -> /sos auto-trigger, "No, file complaint instead".

ACCEPTANCE CRITERIA
- Speaking Hindi "Mere ghar ke pass bahut shor hai" produces a live partial transcript and a final transcript that, when sent to /grievance/intent, returns category=noise.
- Speaking "I am being followed home" auto-opens the SOS sheet and the SOS page pre-fills the message.
- Disconnect/reconnect of the Bhashini upstream does not crash the page; user sees a "Voice service hiccup, please retry" toast.
- A typed-text fallback always works regardless of voice state.

DEPLOYMENT IMPACT
- Add BHASHINI_* env to api.
- Vercel: nothing new client-side beyond NEXT_PUBLIC_SOCKET_URL.

DO NOT
- Do not store raw audio anywhere. Stream-only; drop PCM frames after relay.
- Do not assume browsers expose mic without user gesture; always request permission inside an event handler.
```

---

## Prompt 10 — Deployment hardening, demo seed, judge artefacts

```text
Read all three docs before starting.

CONTEXT
- All four apps work locally and on first-deploy. Now we make them demo-grade.
- The user wants a single live URL to show judges, with predictable cold-start behaviour and a clean storyboard.

GOAL
Lock in a reliable, cold-start-resilient deployment, seed a polished demo, and produce two judge-facing artefacts.

CREATE / MODIFY
- infra/render.yaml: finalise three services (api, worker, ai). Pin pnpm@9 via corepack. Add postdeploy to api: `pnpm --filter @aj/prisma migrate:deploy`. Set healthCheckPath: /healthz. Plan: "free".
- vercel.json: include build env, headers (CSP, X-Frame-Options DENY), rewrites (/api/* -> the apps/api Render URL only if you want first-party origin; else CORS only).
- apps/web/cron/keepalive.ts (Vercel cron): every 10 minutes, fetch /healthz on api, worker, ai. Configure in vercel.json crons.
- packages/prisma/seed.demo.ts: idempotent demo seed inserting:
  - 3 grievances at distinct lifecycle stages: one PENDING (just-filed), one FOLLOWED_UP (with FILED + FOLLOWUP_7D events), one ESCALATED (all three events).
  - Each timestamp staged so the timeline looks credible.
  - A "?demoSpeed=fast" feature flag wired via env DEMO_FAST_MS.
- scripts/release.sh: one-shot script that runs migrate:deploy, seed:demo, and prints the live URLs.
- docs/JUDGES.md: a one-page judge brief — problem, the 4 layers, live URL, "Click these 3 things in order", tech depth bullets, the team.
- README.md: full developer onboarding (envs, run locally, deploy, troubleshoot cold-start, how to run ingestion).
- .github/workflows/ci.yml: extend with a deploy job on main that hits Vercel + Render deploy hooks.
- docs/SECURITY.md: short statement (no PII at info logs, secrets only in Vercel/Render dashboards, Twilio + SendGrid keys never in client).

ACCEPTANCE CRITERIA
- A fresh tab to the Vercel URL completes the full demo storyboard from EXECUTION_PLAN.md §9 in under 4 minutes, with no cold-start visible (because pinger has been running).
- /grievance/[id] timeline shows FILED, FOLLOWUP_7D, ESCALATION_14D within 90 seconds when DEMO_FAST_MS is small.
- /sos sends real WhatsApp + SMS to verified Twilio numbers in <5 s.
- README + JUDGES.md committed; no dead links.
- All envs documented in a single .env.matrix.md table per service.

DEPLOYMENT IMPACT
- This is the deployment. After this prompt, the project is live and demo-ready.
- Tag the commit `v0.1.0-hackathon`.

DO NOT
- Do not enable verbose logging in production; tone down to warn-level except errors.
- Do not commit any .env or seed files containing real personal information.
```

---

## Operating tips while running these prompts

- **Local first, public repo later:** You can work **only** on your machine (with `git` commits locally) until a vertical slice is ready, then push to the hackathon org remote; cloud deploy (Prompt 1’s “Phase B” + Prompt 10) can wait until the day you need a shareable URL.
- **Always commit between prompts.** If a prompt produces something off, you can `git checkout` cleanly and rerun.
- **Keep the three planning docs pinned** in the Cursor context so the agent stays grounded.
- **Run the prompts in order.** Each one assumes the previous one shipped.
- **Fast feedback loop**: after Prompt 6, you can demo the whole persistence flow with `?demoSpeed=fast` even before the frontend is polished — useful if you run out of time.
- **If a prompt over-runs scope**, narrow it: "Same prompt, but only do steps 1–3; we'll do the rest next." The prompts are written to be chunkable.
