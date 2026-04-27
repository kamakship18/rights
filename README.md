# Actionable Justice OS

> **Execution-First** legal redressal infrastructure — from SOS to autonomous follow-ups.

**Team Maverick** · Kamakshi & Chirag

---

## Architecture

| Layer | Name         | Purpose                      | Headline Feature    |
|------:|-------------|------------------------------|---------------------|
|     0 | Urgency      | Life-safety triage           | **Pulse SOS**       |
|     1 | Intelligence | NL → Statute → Authority     | **Statute Guard**   |
|     2 | Execution    | Filing without manual effort | **Direct-File**     |
|     3 | Persistence  | Accountability loop          | **Persistence Bot** |

## Tech Stack

- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **API**: NestJS + Socket.io + BullMQ
- **Worker**: NestJS standalone + BullMQ consumer + node-cron
- **AI**: FastAPI + LangChain (RAG pipeline)
- **DB**: PostgreSQL (Prisma ORM) + Redis + Pinecone

## Quick Start (Local)

### Prerequisites

- Node.js 20+ (`nvm use` will read `.nvmrc`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.15.4 --activate`)
- Docker & Docker Compose
- Python 3.12+ with [uv](https://docs.astral.sh/uv/)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd actionable-justice-os
pnpm install
```

### 2. Start Infrastructure

```bash
pnpm docker:up
# Starts PostgreSQL 16 on :5432 and Redis 7 on :6379
```

### 3. Setup Environment

```bash
cp packages/prisma/.env.example packages/prisma/.env
# Edit .env if your Docker ports differ
```

### 4. Start All Services

```bash
# Terminal 1 — Node.js apps
pnpm dev

# Terminal 2 — AI service
cd apps/ai
uv run uvicorn main:app --reload --port 8000
```

### 5. Verify Health Checks

```bash
curl http://localhost:3000/healthz   # web
curl http://localhost:4000/healthz   # api
curl http://localhost:4001/healthz   # worker
curl http://localhost:8000/healthz   # ai
```

All should return `{ "ok": true, "service": "<name>" }`.

## Project Structure

```
├── apps/
│   ├── web/        # Next.js 14 frontend
│   ├── api/        # NestJS orchestrator API
│   ├── worker/     # Background jobs + cron
│   └── ai/         # FastAPI RAG service
├── packages/
│   ├── shared/     # TS types + zod schemas
│   └── prisma/     # Prisma schema + migrations
├── infra/
│   ├── docker-compose.yml  # Local Postgres + Redis
│   └── render.yaml         # Cloud deploy (Phase C)
├── docs/
│   ├── EXECUTION_PLAN.md
│   └── CURSOR_PROMPTS.md
└── .github/workflows/ci.yml
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all Node.js apps in parallel |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format all files with Prettier |
| `pnpm typecheck` | Type-check all TS packages |
| `pnpm docker:up` | Start local Postgres + Redis |
| `pnpm docker:down` | Stop local infrastructure |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:seed` | Seed database |

## Deployment

See [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) §2.1 for the local → cloud phasing.

- **Web** → Vercel
- **API / Worker / AI** → Render
- **Database** → Neon (Postgres) + Upstash (Redis) + Pinecone (Vector)

## License

Private — Hackathon project.
