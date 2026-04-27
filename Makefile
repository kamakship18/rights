# Actionable Justice OS — Makefile
# Quick commands for common tasks

.PHONY: dev docker ingest ingest-statutes ingest-officers seed studio

# ── Development ──────────────────────────────────────
dev:
	pnpm dev

docker:
	pnpm docker:up

# ── Database ─────────────────────────────────────────
seed:
	pnpm db:seed

studio:
	pnpm db:studio

migrate:
	pnpm db:migrate:dev

# ── Ingestion ────────────────────────────────────────
ingest:
	cd apps/ai && uv run python -m ingest all

ingest-statutes:
	cd apps/ai && uv run python -m ingest statutes

ingest-officers:
	cd apps/ai && uv run python -m ingest officers
