# Justice OS AI Service

FastAPI-based AI/RAG service for Actionable Justice OS.

## Endpoints

| Method | Path            | Purpose                               |
|--------|-----------------|---------------------------------------|
| GET    | `/healthz`      | Liveness probe                        |
| POST   | `/triage`       | Text → urgency + category (Prompt 3)  |
| POST   | `/map-statute`  | Text → statute + section (Prompt 3)   |
| POST   | `/find-officer` | PIN + category → officer (Prompt 3)   |

## Local Development

```bash
# Install uv (if not already)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync

# Run dev server
uv run uvicorn main:app --reload --port 8000

# Verify
curl http://localhost:8000/healthz
```
