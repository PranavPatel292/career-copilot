# Career Copilot

A production-architected, full-stack RAG (Retrieval-Augmented Generation) career assistant that turns your real work - resume, project docs, and GitHub repositories - into a curated, queryable knowledge base with two-layer AI answers, streamed live to a React frontend.

## What it does

Upload your documents or connect your GitHub from the Knowledge Base page. Ask a question in the chat UI. Career Copilot retrieves the most relevant slices of your actual experience and answers in two clearly separated layers, streamed token-by-token over SSE:

- **Grounded** - strictly from your knowledge base, with citations.
- **Suggested** - the model reasons on top (adjacent technologies, roles, "why"), clearly marked as inference.

```
POST /query
Accept: text/event-stream
{ "question": "What frontend frameworks do I know?" }

→ event: grounded   data: { "text": "React, React Native, and Next.js..." }   (repeats as tokens stream)
→ event: suggested  data: { "text": "Adjacent frameworks include Vue..." }    (repeats as tokens stream)
→ event: citations  data: { "citations": [{ chunkId, documentId, title, source, text, score }] }
→ event: done        data: {}
```

Cache hits and low-confidence refusals skip the LLM entirely and return plain JSON instantly, even when the client asked for SSE.

## Why this exists

A resume is a lossy 1–2 page compression of years of work. GitHub is the high-bandwidth, harder-to-fake record - but raw, it's noisy. This tool turns sprawling real work into a curated judging point, with retrieval quality you can trace and verify.

Built as a hands-on RAG + systems-design project with production-grade patterns: clean architecture, event-driven ingestion, hybrid retrieval, transactional writes, and cache invalidation.

## Architecture

```
backend/src/
  domain/         # Pure business rules - zero dependencies
    ├── entities.ts
    ├── chunker.ts          # Text splitting (LangChain RecursiveCharacterTextSplitter)
    ├── normalizer.ts       # Text cleaning before chunking
    ├── inputGuard.ts       # Profanity + injection detection (obscenity)
    └── documentId.ts       # Deterministic document identity
  use-cases/      # Orchestrators - import ports only, never adapters
    ├── IngestManualDocument.ts   # Creates document row, enqueues ingestion job
    ├── ProcessIngestionJob.ts    # Worker: normalize → chunk → embed → store
    ├── AnswerCareerQuery.ts      # Guard → cache → retrieve → generate (sync + streaming)
    ├── ImportFromGitHub.ts       # Fetch repos → create document row → enqueue
    └── DeleteDocument.ts         # Enqueues async delete job
  ports/          # Interfaces (contracts)
    ├── VectorStore.ts
    ├── EmbeddingProvider.ts
    ├── LlmProvider.ts
    ├── IngestionQueue.ts
    ├── DocumentStore.ts
    ├── EventBus.ts
    ├── ResponseCache.ts
    └── ContentModerator.ts
  infra/          # Adapters - the only place SDKs and frameworks live
    ├── db/                 # PgVectorStore + PgDocumentStore (Drizzle + pgvector)
    ├── ollama/             # OllamaProvider (local LLM, supports streaming)
    ├── queue/              # BullMqQueue + IngestionWorker + DeletionWorker
    ├── cache/              # ValkeyCache (exact-match + version-based invalidation)
    ├── github/             # GitHubConnector (Octokit)
    ├── events/             # InProcessEventBus - powers SSE on /kb/events
    └── http/               # Fastify routes + middleware
  config/         # Environment-driven wiring
  main.ts         # Composition root - the only file that imports adapters

frontend/src/
  theme/          # dark.ts (active) + light.ts (not wired in) color tokens
  types/          # Mirrors backend response shapes
  lib/            # sse.ts (manual SSE parser + EventSource wrapper), formatters, validators
  api/            # Plain fetch/SSE functions - no React Query here
  hooks/          # React Query + state, wraps api/
  components/
    chat/         # Streaming chat UI
    upload/       # Knowledge base dashboard
    shared/       # Header, LoadingDots
    ui/           # shadcn primitives
  App.tsx         # Routes: / → /chat (redirect), /chat, /kb
```

**Dependencies point inward.** Domain and use cases never import infra. Swapping pgvector for Aurora, Ollama for Claude, or BullMQ for another queue = one adapter change, zero use-case changes. On the frontend, `api/` knows HTTP and SSE only; `hooks/` owns React Query and all cache-key knowledge; `components/` render and call hooks, never `api/` directly.

## Tech stack

### Backend

| Layer              | Technology                                                          |
| ------------------ | -------------------------------------------------------------------- |
| API                | Node.js, TypeScript, Fastify                                       |
| Vector store       | PostgreSQL + pgvector - exact search, no ANN index yet (see below)  |
| Full-text search   | PostgreSQL `tsvector` / `ts_rank` - not true BM25 (see below)       |
| Embeddings         | Transformers.js (bge-m3 / all-MiniLM-L6-v2, local, free)            |
| Generation         | Ollama (qwen3:4b, local) - swappable to Claude via config           |
| Queue              | BullMQ on Valkey                                                    |
| Cache              | Valkey (exact-match, version-based invalidation)                   |
| Events             | In-process EventEmitter - powers `/kb/events` SSE                  |
| GitHub integration | Octokit                                                             |
| Validation         | Zod                                                                 |
| ORM                | Drizzle                                                             |

### Frontend

| Layer              | Technology                                                        |
| ------------------ | ------------------------------------------------------------------ |
| Framework          | React 19, TypeScript, Vite                                        |
| Styling            | Tailwind CSS v4, shadcn/ui (Radix primitives)                     |
| Data/state         | TanStack Query - all server state and cache; no separate store    |
| Routing            | React Router 7                                                    |
| Streaming          | Manual `fetch`+`ReadableStream` SSE parser (`/query`), native `EventSource` (`/kb/events`) |
| Icons              | Tabler Icons                                                      |
| Dates              | dayjs                                                              |

## Key design decisions

**Hybrid retrieval (semantic + lexical).** Pure vector search can miss exact keyword matches ("BullMQ experience" might rank lower than semantically similar but wrong chunks). A single Postgres query combines `ts_rank` lexical scoring (0.3 weight) with pgvector cosine similarity (0.7 weight) - no external search engine needed. Note: this is PostgreSQL's native full-text ranking, not the BM25 algorithm - `ts_rank` has no corpus-wide IDF term and no term-frequency saturation the way BM25 does. A true BM25 implementation would need an extension like ParadeDB's `pg_search`.

**No ANN index on `embedding` (yet, by design).** Both `search()` and `hybridSearch()` do an exact, brute-force distance scan - there's no HNSW or IVFFlat index on the `chunks.embedding` column. At this project's scale (tens to low hundreds of chunks) that's sub-millisecond and adding an index would cost more (memory, build time, slight recall loss) than it saves. The threshold to actually add one is roughly tens-of-thousands of rows, where a sequential scan starts costing real milliseconds. When that happens: `CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);`.

**Event-driven ingestion.** Upload returns immediately with a job ID. A BullMQ worker processes asynchronously: normalize → chunk → embed → transactional write. 3 retries with exponential backoff. Idempotent - re-uploading the same document replaces cleanly via deterministic document IDs and delete-before-insert inside a transaction.

**Version-based cache invalidation.** Each tenant has a `kb_version` counter in Valkey. Cache keys include the version. When new content is ingested, the version increments - all old cached answers become unreachable instantly. No scanning, no bulk deletion. One `INCR` command.

**Confidence threshold.** If the top retrieval score is below 0.15, the system refuses to answer instead of hallucinating. The model never generates from weak evidence.

**Clean architecture.** Use cases depend on ports (interfaces), not adapters. The composition root (`main.ts`) is the only file that knows about concrete implementations. Swap LLM providers, vector stores, or queue backends by changing config - the domain and use cases compile unchanged.

## Getting started

### Prerequisites

- Docker (for Postgres + Valkey)
- Node.js 20+
- Yarn
- Ollama (for local LLM)

### Backend setup

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

# 8. Start the server (http://localhost:3000)
yarn dev
```

### Frontend setup

```bash
cd career-copilot/frontend
yarn install
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:3000
yarn dev                   # http://localhost:5173
```

### Environment variables

Backend (`backend/.env`):

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/career_copilot
VALKEY_URL=redis://localhost:6379
ANTHROPIC_API_KEY=              # optional, for Claude
EMBEDDING_PROVIDER=local
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
AUTH_MODE=dev
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW=1 minute
MAX_QUESTION_TOKENS=500
MAX_ANSWER_TOKENS=600
```

Frontend (`frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:3000
```

## API endpoints

| Method | Path                    | Description                                                          |
| ------ | ----------------------- | ---------------------------------------------------------------------- |
| GET    | `/health`               | Health check                                                          |
| POST   | `/ingest/upload`        | Upload .md / .txt files (multipart)                                  |
| POST   | `/ingest/github`        | Import repos from GitHub                                             |
| GET    | `/ingest/status/:jobId` | Poll ingestion job status                                            |
| DELETE | `/ingest/:documentId`   | Delete a document and its chunks (async - 202, then SSE confirms)    |
| GET    | `/kb/documents`         | Cursor-paginated document list (`?limit=&cursor=`)                   |
| GET    | `/kb/events`            | SSE - live document lifecycle events (progress/completed/failed/deleted) |
| POST   | `/query`                | Ask a question - JSON, or SSE if `Accept: text/event-stream`         |

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

### Ingestion (async, mirrored live to the frontend)

```
Upload / GitHub → Middleware (rate limit → validate → tenant)
  → IngestManualDocument: create document row (status: waiting) → enqueue → BullMQ (Valkey)
  → Worker: normalize → chunk → embed (sequential, per-chunk progress) → transaction (delete + insert) → pgvector
  → Each step updates the document row AND emits on the EventBus
  → Invalidate cache (bump kb_version)

Frontend: one long-lived EventSource on /kb/events relays every EventBus event
  as an SSE frame → patches the React Query cache directly → UI updates live, no polling
```

### Query (sync or streamed)

```
Question → Middleware (rate limit → validate → tenant)
  → AnswerCareerQuery.prepare(): InputGuard → Cache check
  → [hit, or low confidence] → instant answer, no LLM call
  → [miss] → Embed question → Hybrid search (ts_rank + semantic, tenant-scoped, single query)
  → LLM streams tokens → re-segmented into grounded/suggested events in real time
  → Citations enriched with document title + source → cache store → done

Frontend: manual fetch+ReadableStream SSE parser (EventSource can't POST or
  set custom headers) accumulates grounded/suggested text token-by-token
```
## Note

There are some bugs and issues that I am still working on - if you encounter them, please [open an issue](https://github.com/PranavPatel292/career-copilot/issues) or a PR, or reach out at pranav.patel292@gmail.com.

## License

MIT
