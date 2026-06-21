# Career Copilot

A production-architected RAG (Retrieval-Augmented Generation) career assistant that turns your real work — resume, project docs, and GitHub repositories — into a curated, queryable knowledge base with two-layer AI answers.

## What it does

Upload your documents or connect your GitHub. Ask a question. Career Copilot retrieves the most relevant slices of your actual experience and answers in two clearly separated layers:

- **Grounded** — strictly from your knowledge base, with citations.
- **Suggested** — the model reasons on top (adjacent technologies, roles, "why"), clearly marked as inference.

```
POST /query
{ "question": "What frontend frameworks do I know?" }

→ grounded: "React, React Native, and Next.js across multiple projects including..."
→ suggested: "Adjacent frameworks include Vue and Svelte. Roles like..."
→ citations: [{ chunkId, documentId, text, score }]
```

## Why this exists

A resume is a lossy 1–2 page compression of years of work. GitHub is the high-bandwidth, harder-to-fake record — but raw, it's noisy. This tool turns sprawling real work into a curated judging point, with retrieval quality you can trace and verify.

Built as a hands-on RAG + systems-design project with production-grade patterns: clean architecture, event-driven ingestion, hybrid retrieval, transactional writes, and cache invalidation.

## Architecture

```
src/
  domain/         # Pure business rules — zero dependencies
    ├── entities.ts
    ├── chunker.ts          # Text splitting (LangChain RecursiveCharacterTextSplitter)
    ├── normalizer.ts       # Text cleaning before chunking
    ├── inputGuard.ts       # Profanity + injection detection (obscenity)
    └── documentId.ts       # Deterministic document identity
  use-cases/      # Orchestrators — import ports only, never adapters
    ├── IngestManualDocument.ts   # Enqueues ingestion job
    ├── ProcessIngestionJob.ts    # Worker: normalize → chunk → embed → store
    ├── AnswerCareerQuery.ts      # Guard → cache → retrieve → generate
    └── ImportFromGitHub.ts       # Fetch repos → enqueue each as document
  ports/          # Interfaces (contracts)
    ├── VectorStore.ts
    ├── EmbeddingProvider.ts
    ├── LlmProvider.ts
    ├── IngestionQueue.ts
    ├── ResponseCache.ts
    └── ContentModerator.ts
  infra/          # Adapters — the only place SDKs and frameworks live
    ├── db/                 # PgVectorStore (Drizzle + pgvector)
    ├── ollama/             # OllamaProvider (local LLM)
    ├── queue/              # BullMqQueue + IngestionWorker
    ├── cache/              # ValkeyCache (exact-match + version-based invalidation)
    ├── github/             # GitHubConnector (Octokit)
    └── http/               # Fastify routes + middleware
  config/         # Environment-driven wiring
  main.ts         # Composition root — the only file that imports adapters
```

**Dependencies point inward.** Domain and use cases never import infra. Swapping pgvector for Aurora, Ollama for Claude, or BullMQ for another queue = one adapter change, zero use-case changes.

## Tech stack

| Layer              | Technology                                                |
| ------------------ | --------------------------------------------------------- |
| API                | Node.js, TypeScript, Fastify                              |
| Vector store       | PostgreSQL + pgvector (HNSW index)                        |
| Full-text search   | PostgreSQL tsvector (BM25 scoring)                        |
| Embeddings         | Transformers.js (bge-m3 / all-MiniLM-L6-v2, local, free)  |
| Generation         | Ollama (qwen3:4b, local) — swappable to Claude via config |
| Queue              | BullMQ on Valkey                                          |
| Cache              | Valkey (exact-match, version-based invalidation)          |
| GitHub integration | Octokit                                                   |
| Validation         | Zod                                                       |
| ORM                | Drizzle                                                   |
| Testing            | Vitest                                                    |

## Key design decisions

**Hybrid retrieval (BM25 + semantic).** Pure vector search can miss exact keyword matches ("BullMQ experience" might rank lower than semantically similar but wrong chunks). Hybrid combines keyword scoring (0.3 weight) with semantic similarity (0.7 weight) in a single Postgres query — no external search engine needed.

**Event-driven ingestion.** Upload returns immediately with a job ID. A BullMQ worker processes asynchronously: normalize → chunk → embed → transactional write. 3 retries with exponential backoff. Idempotent — re-uploading the same document replaces cleanly via deterministic document IDs and delete-before-insert inside a transaction.

**Version-based cache invalidation.** Each tenant has a `kb_version` counter in Valkey. Cache keys include the version. When new content is ingested, the version increments — all old cached answers become unreachable instantly. No scanning, no bulk deletion. One `INCR` command.

**Confidence threshold.** If the top retrieval score is below 0.15, the system refuses to answer instead of hallucinating. The model never generates from weak evidence.

**Clean architecture.** Use cases depend on ports (interfaces), not adapters. The composition root (`main.ts`) is the only file that knows about concrete implementations. Swap LLM providers, vector stores, or queue backends by changing config — the domain and use cases compile unchanged.

## Getting started

### Prerequisites

- Docker (for Postgres + Valkey)
- Node.js 20+
- Yarn
- Ollama (for local LLM)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/PranavPatel292/career-copilot.git
cd career-copilot/backend
yarn install

# 2. Start infrastructure
docker compose up -d

# 3. Enable pgvector extension
docker compose exec db psql -U postgres -d career_copilot \
  -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 4. Add tsvector column for hybrid search
docker compose exec db psql -U postgres -d career_copilot -c "
  ALTER TABLE chunks ADD COLUMN IF NOT EXISTS tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', text)) STORED;
  CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin(tsv);
"

# 5. Run database migrations
yarn db:generate
yarn db:migrate

# 6. Pull a local LLM
ollama pull qwen3:4b

# 7. Create .env from example
cp .env.example .env

# 8. Start the server
yarn dev
```

### Environment variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/career_copilot
VALKEY_URL=redis://localhost:6379
ANTHROPIC_API_KEY=              # optional, for Claude
EMBEDDING_PROVIDER=local
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
AUTH_MODE=dev
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=1 minute
MAX_QUESTION_TOKENS=500
MAX_ANSWER_TOKENS=600
```

## API endpoints

| Method | Path                    | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| GET    | `/health`               | Health check                        |
| POST   | `/ingest/upload`        | Upload .md / .txt files (multipart) |
| POST   | `/ingest/github`        | Import repos from GitHub            |
| GET    | `/ingest/status/:jobId` | Poll ingestion job status           |
| DELETE | `/ingest/:documentId`   | Delete a document and its chunks    |
| POST   | `/query`                | Ask a question                      |

### Upload files

```bash
curl -X POST http://localhost:3000/ingest/upload \
  -F "file=@./skills.md" \
  -F "file=@./projects.md"
```

### Import from GitHub

```bash
# Public repos only
curl -X POST http://localhost:3000/ingest/github \
  -H "Content-Type: application/json" \
  -d '{"username": "PranavPatel292"}'

# Include private repos
curl -X POST http://localhost:3000/ingest/github \
  -H "Content-Type: application/json" \
  -d '{"username": "PranavPatel292", "token": "ghp_your_token"}'
```

### Query

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What frontend frameworks do I know?"}'
```

## Flows

### Ingestion (async)

```
Upload / GitHub → Middleware (rate limit → validate → tenant)
  → IngestManualDocument (enqueue) → BullMQ (Valkey)
  → Worker: normalize → chunk → embed → transaction (delete + insert) → pgvector
  → Invalidate cache (bump kb_version)
```

### Query (sync)

```
Question → Middleware (rate limit → validate → tenant)
  → AnswerCareerQuery → InputGuard → Cache check
  → [miss] → Embed question → Hybrid search (BM25 + semantic, tenant-scoped)
  → Confidence check (low → refuse) → LLM (two-layer prompt)
  → Cache store → Return answer + citations
```

## Roadmap

- [ ] Multi-tenant auth (JWT / Cognito)
- [ ] Semantic caching on the generic inference layer
- [ ] Reranker model (cross-encoder) after initial retrieval
- [ ] Deep code summarization (LLM over source files)
- [ ] PDF support for uploads
- [ ] Eval harness for retrieval quality
- [ ] Frontend UI
- [ ] Observability (structured logging, tracing)
- [ ] WebSocket / SSE for real-time job status

## License

MIT
