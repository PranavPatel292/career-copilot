# Career Copilot — V2 build context

This file provides context for Claude Code to continue the V2 implementation. The full planning session is captured in `Handover_V2_Planning.md` at the project root. Read that first.

## What has been built (V1)

A production-architected RAG career assistant. See `backend/Handover.md` for the full V1 architecture, tech stack, API endpoints, flows, and design decisions.

Key V1 facts:

- Clean architecture: domain → use-cases → ports → infra (inward dependencies only)
- Fastify API, Drizzle ORM, PostgreSQL + pgvector, BullMQ on Valkey, Ollama (qwen3:4b)
- Hybrid search: 0.7 semantic + 0.3 BM25
- All environment config in `src/config/index.ts`
- Composition root in `src/main.ts` — creates adapters, injects into use cases

## What has been done in V2 so far

### Files to place (from the planning session)

| File                  | Destination                                 | Status                                                    |
| --------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `schema.ts`           | `backend/src/infra/db/schema.ts`            | REPLACE existing — adds `documents` table + FK on chunks  |
| `DocumentStore.ts`    | `backend/src/ports/DocumentStore.ts`        | NEW — port for document lifecycle                         |
| `PgDocumentStore.ts`  | `backend/src/infra/db/PgDocumentStore.ts`   | NEW — adapter implementing DocumentStore                  |
| `GitHubProvider.ts`   | `backend/src/ports/GitHubProvider.ts`       | NEW — port for GitHub (fixes clean arch violation)        |
| `ImportFromGitHub.ts` | `backend/src/use-cases/ImportFromGitHub.ts` | REPLACE — now creates document rows + uses injected ports |

### Migration required

After placing the schema, run:

```bash
cd backend
docker compose exec db psql -U postgres -d career_copilot -c "TRUNCATE TABLE chunks;"
yarn db:generate
yarn db:migrate
```

See `MIGRATION_NOTES.md` for full details including the tsvector column and verification steps.

## What remains to build

### Phase 1 — Backend (remaining use case updates)

- [ ] **Update `IngestManualDocument`** — inject `DocumentStore`, create document row (source: 'manual', status: 'waiting') before enqueueing, link jobId back
- [ ] **Update `ProcessIngestionJob`** — inject `DocumentStore`, update status + processing_stage at each pipeline step, change embedding from batch to sequential with chunks_processed updates
- [ ] **Update `GitHubConnector`** — implement the new `GitHubProvider` port interface (move token from constructor to method param)
- [ ] **New KB routes** — `GET /kb/documents` (paginated, cursor-based) and `DELETE /ingest/:documentId` (async via BullMQ)
- [ ] **New delete use case** — enqueue delete job, set status to 'deleting', worker deletes document row (FK cascade handles chunks)
- [ ] **Update `main.ts` composition root** — wire up `PgDocumentStore`, inject into use cases

### Phase 2 — Backend (SSE)

- [ ] **EventEmitter bridge** — in-process event bus, worker emits document lifecycle events
- [ ] **`GET /kb/events` SSE endpoint** — subscribes to EventEmitter, streams `document:progress`, `document:completed`, `document:failed`, `document:deleted` events
- [ ] **`LlmProvider.generateStream()`** — new port method returning `AsyncGenerator<string>`
- [ ] **`OllamaProvider` streaming adapter** — implements generateStream using Ollama's `stream: true`
- [ ] **SSE on `POST /query`** — check Accept header, branch between JSON and SSE. Event protocol: `grounded` → `suggested` → `citations` → `done`

### Phase 3 — Frontend

- [ ] **Project scaffold** — Vite + React + Tailwind + React Query + React Router + shadcn/ui in `frontend/`
- [ ] **Types + API layer** — all type definitions, fetch/SSE clients, API functions
- [ ] **Shared components** — Layout, NavToggle, Toast, LoadingDots, ErrorBanner
- [ ] **KB page** — StatsBar, DropZone, GitHubImport, DocumentList with StatusBadge, pagination, SSE subscription + toasts
- [ ] **Chat page** — ChatInput, MessageList, BotMessage with GroundedSection + CopilotTake + SourceChips, SSE streaming

### Phase 4 — Tests

- [ ] **Hook tests** (Vitest + renderHook) — useChat, useKnowledgeBase, useKBEvents
- [ ] **Component tests** (Vitest + RTL) — ChatInput, BotMessage, DocumentRow, StatusBadge
- [ ] **API layer tests** (Vitest + MSW) — SSE parsing, pagination, error handling

## Key technical decisions

Read `Handover_V2_Planning.md` for full details. Quick reference:

- **SSE over WebSocket** for both chat streaming and KB dashboard events
- **Cursor-based pagination** on GET /kb/documents (cursor = created_at, most recent first)
- **DocumentStatus extends JobStatus** — reuses existing `waiting | delayed | active | processing | completed | failed` + adds `deleting | delete_failed`
- **Sequential embedding** (not batch) — enables per-chunk progress tracking
- **Async delete** via BullMQ worker — prevents blocking the API
- **Frontend architecture** — feature-based: api/ (data) → hooks/ (logic) → components/ (UI), with validation in lib/validators.ts

## Design direction

- Clean, light-mode, structured layout (Perplexity-inspired)
- Grounded answers: green verification marker + inline source chips
- Suggested answers: amber "Copilot's take" card
- Two routes: `/` (Chat) and `/kb` (Knowledge base)
- Segmented toggle navigation in top bar
- Stack: React + Tailwind + React Query + React Router + shadcn/ui

## File structure reference

```
career-copilot/
  backend/
    src/
      domain/           # entities, chunker, normalizer, inputGuard, documentId
      use-cases/        # IngestManualDocument, ProcessIngestionJob, AnswerCareerQuery, ImportFromGitHub
      ports/            # VectorStore, EmbeddingProvider, LlmProvider, IngestionQueue, ResponseCache, ContentModerator, DocumentStore (new), GitHubProvider (new)
      infra/
        db/             # schema, index, PgVectorStore, PgDocumentStore (new)
        ollama/         # OllamaProvider
        queue/          # BullMqQueue, IngestionWorker
        cache/          # ValkeyCache
        github/         # GitHubConnector
        http/           # routes, middleware, schemas
      config/
      main.ts
  frontend/             # V2 — React app (to be built)
  CLAUDE.md             # This file
  Handover_V2_Planning.md
```
