# ⛓ Chain Service — Blockchain Grievance Module

Standalone Express.js service providing **immutable, SHA-256 hashed** grievance documentation with MongoDB fallback.

## Ports

| Service | Port |
|---------|------|
| Web (Next.js) | 3000 |
| API (NestJS)  | 4000 |
| Worker        | 4001 |
| AI (FastAPI)  | 8000 |
| **Chain**     | **4002** |

## Quick start

```bash
cd apps/chain

# Install dependencies (first run only)
npm install

# Start (with file watching)
npm run dev
```

Optional: create `apps/chain/.env` (not committed) to override defaults:

```bash
CHAIN_PORT=4002
MONGODB_URI=mongodb://localhost:27017/justice_chain
FRONTEND_ORIGIN=http://localhost:3000
```

## Architecture

```
POST /api/grievance-chain
       │
       ├─ Hash all uploaded files (SHA-256, streaming)
       ├─ Build block payload { grievanceId, metadata, fileHashes, timestamp }
       │
       ▼
  blockchain.addBlock(data)          ← PRIMARY (data/ledger.json)
       │
       ├── SUCCESS → save reference to MongoDB (for fast queries)
       └── FAILURE → save to MongoDB only (storageType = "mongodb")
```

## Storage

- **Blockchain ledger**: `apps/chain/data/ledger.json` — append-only JSON, survives restarts
- **File uploads**: `apps/chain/uploads/` — served at `GET /uploads/:filename`
- **MongoDB**: `justice_chain` database (optional, graceful skip if unavailable)

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/grievance-chain` | File a new grievance (multipart/form-data) |
| `GET`  | `/api/grievance-chain` | List all grievances (`?page=1&limit=20`) |
| `GET`  | `/api/grievance-chain/chain-status` | Blockchain health |
| `GET`  | `/api/grievance-chain/:id` | Get one grievance with block proof |
| `GET`  | `/api/grievance-chain/:id/download` | Court-ready JSON export |
| `GET`  | `/healthz` | Service health |

### POST /api/grievance-chain — field reference

| Field | Type | Required |
|-------|------|----------|
| `pin` | string (6-digit) | ✓ |
| `title` | string | ✓ |
| `description` | string | ✓ |
| `fullName` | string | optional |
| `location` | string | optional |
| `tags` | string[] / comma-separated | optional |
| `rightsRegulations` | string[] | optional |
| `files` | File[] (multipart) | optional, max 10 × 10 MB |

Accepted file types: `jpg`, `png`, `gif`, `webp`, `pdf`, `doc`, `docx`

## Module structure

```
apps/chain/src/modules/grievance-chain/
├── blockchain/
│   ├── block.js          — Block class with SHA-256 calculateHash()
│   ├── blockchain.js     — Blockchain class: addBlock, validateChain, getBlockById
│   ├── ledger.js         — File-system persistence (data/ledger.json)
│   └── ledger-instance.js— Singleton export
├── db/
│   ├── grievance.model.js     — Mongoose schema (immutability guards)
│   └── grievance.repository.js— Data-access layer (connection-aware)
├── service/
│   └── grievance.service.js   — Orchestration + failover logic
├── controller/
│   └── grievance.controller.js— HTTP handlers
├── routes/
│   └── grievance.routes.js    — Express router + Multer config
└── utils/
    ├── hash.utils.js    — hashString, hashFile (streaming SHA-256), generateGrievanceId
    └── file.utils.js    — Upload dir management, URL generation
```
