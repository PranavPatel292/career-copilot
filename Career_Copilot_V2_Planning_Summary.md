# Career Copilot — V2 planning summary

This document captures all decisions made during the V2 planning session, covering frontend design, frontend architecture, backend changes, data flows, and deferred items.

---

## 1. Overall strategy

The goal of V2 is to make Career Copilot demoable as a portfolio project for job applications. The priority order is driven by "what makes the biggest impression per hour spent," not "what a production product needs first."

**Execution order:**

1. Add a `profile.md` to the KB (five-minute job, big answer quality improvement)
2. Backend schema + endpoint changes (documents table, new endpoint, SSE)
3. React frontend (the main event — turns it from invisible to demoable)
4. Tests (interview credibility)
5. Public deploy (live URL on the resume)
6. Claude LLM swap (at deploy time — cheaper than self-hosting Ollama on a server)

---

## 2. Frontend design

**Design direction:** Clean, light-mode, structured layout inspired by Perplexity's answer style, combined with a warm "Copilot's take" card for the suggested/inferred section.

**Key differentiators from competitors (e.g. Ask VAi):**

- Grounded vs suggested answers are visually separated — grounded gets a green verification marker; suggested gets an amber "Copilot's take" card
- Inline source chips appear right where claims are made (not just a footer)
- Source footer shows document name + chunk count
- KB browser gives transparency into what's actually in the knowledge base

**Two routes:**

| Route                  | Purpose                                                                       | Audience                           |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `/` — Chat             | Ask questions, see grounded + suggested answers with citations                | Visitors, recruiters, interviewers |
| `/kb` — Knowledge base | Upload files, connect GitHub, view/delete documents, monitor ingestion status | The portfolio owner (you)          |

**Shared navigation:** A segmented toggle in a minimal top bar switches between "Chat" and "Knowledge base."

### Chat page components

- Header with app name + subtitle
- Message list with user messages (right-aligned, bordered bubble) and bot responses
- Bot response card containing:
  - Grounded answer section (green "Grounded answer" label, inline source chips like `resume.md`)
  - Copilot's take section (amber background card, bulb icon, secondary text colour)
  - Sources footer (document name + chunk count per source)
- Input bar with placeholder text and a circular send button

### Knowledge base page components

- Stats bar: 3 metric cards showing document count, total chunks, KB version
- Drop zone: dashed border area for drag-and-drop `.md`/`.txt` upload (max 10 files, 5MB each)
- GitHub import section: username input, optional PAT input, import button
- Document list: rows showing source icon (file vs GitHub), document name, chunk count, status badge, delete button

### Document status badges

| Status        | Badge colour     | Subtitle                                                | Notes                                      |
| ------------- | ---------------- | ------------------------------------------------------- | ------------------------------------------ |
| Waiting       | Grey             | "Waiting"                                               | Job is in BullMQ queue                     |
| Delayed       | Grey             | "Retrying soon"                                         | Job waiting for retry after a failure      |
| Active        | Amber + spinner  | "Starting..."                                           | Worker has picked up the job               |
| Processing    | Amber + spinner  | Stage + progress (e.g. "Embedding 7/12...")             | Updates live via SSE                       |
| Completed     | Green            | Chunk count                                             | Done, searchable; toast notification shown |
| Failed        | Red + red border | Error message (e.g. "Embedding failed after 3 retries") | Toast notification shown                   |
| Deleting      | Grey + spinner   | "Deleting..."                                           | Async delete job in progress               |
| Delete failed | Red              | Error message                                           | Async delete failed                        |

---

## 3. Frontend architecture

**Stack:** React + Tailwind + React Query + React Router + shadcn/ui

**Structure:** Feature-based with clean separation between data, logic, and UI layers.

```
src/
  api/                    # Data layer (HTTP + SSE clients)
    client.ts             # Base fetch/SSE client, base URL config
    queryApi.ts           # POST /query, SSE stream handling
    ingestApi.ts          # POST /ingest/upload, /ingest/github, DELETE
    statusApi.ts          # GET /ingest/status/:jobId
    kbApi.ts              # GET /kb/documents (paginated), GET /kb/events (SSE)

  hooks/                  # Business logic layer (React hooks)
    useChat.ts            # Message history, calls queryApi, parses SSE
    useDocumentUpload.ts  # File upload + job polling lifecycle
    useGitHubImport.ts    # GitHub import + job polling
    useKnowledgeBase.ts   # KB document list (paginated), delete
    useKBEvents.ts        # SSE subscription to /kb/events, updates React Query cache

  types/                  # Domain types
    chat.ts               # Message, GroundedAnswer, SuggestedAnswer, Citation
    document.ts           # Document, Chunk, JobStatus
    api.ts                # API request/response shapes

  components/
    chat/                 # Chat feature
      ChatPage.tsx
      MessageList.tsx
      UserMessage.tsx
      BotMessage.tsx
      GroundedSection.tsx
      CopilotTake.tsx
      SourceChips.tsx
      ChatInput.tsx
    upload/               # Upload/KB feature
      KBPage.tsx
      StatsBar.tsx
      DropZone.tsx
      GitHubImport.tsx
      DocumentList.tsx
      DocumentRow.tsx
      StatusBadge.tsx
      Pagination.tsx        # "Load more" button for cursor-based pagination
    shared/               # Reusable primitives
      Layout.tsx
      NavToggle.tsx
      LoadingDots.tsx
      ErrorBanner.tsx
      Toast.tsx             # Toast notifications for KB events

  lib/                    # Pure utilities
    sse.ts                # SSE stream parser
    formatters.ts         # Text normalization, date formatting
    validators.ts         # Client-side input validation rules

  App.tsx                 # Router + layout shell
  main.tsx                # Entry point
```

**Separation principle:**

- `api/` — knows about HTTP and SSE, nothing about React
- `hooks/` — knows about React state and the api layer, nothing about DOM
- `components/` — knows about rendering, calls hooks, never makes API calls directly

This means swapping the transport (SSE to WebSocket) or the backend URL is a change in `api/` only.

---

## 4. Frontend validation

All inputs are validated client-side before any API call. The backend's Zod validation is a second layer — users should never see a raw 400 error for something the UI could have caught.

### Chat input

| Rule                    | Constraint                                                   | Error message                                                 |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Non-empty               | Trim whitespace, reject empty                                | (disable send button, no error shown)                         |
| Max length              | 2000 characters (~500 tokens, matches `MAX_QUESTION_TOKENS`) | "Question is too long. Please keep it under 2000 characters." |
| Disable while streaming | Send button disabled during active SSE stream                | (button swaps to stop icon)                                   |

### File upload (drop zone)

| Rule            | Constraint                                            | Error message                                                          |
| --------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| File type       | `.md` and `.txt` only                                 | "Only .md and .txt files are supported."                               |
| File size       | 5MB max per file                                      | "File exceeds the 5MB size limit."                                     |
| File count      | 10 files max per upload batch                         | "Maximum 10 files per upload."                                         |
| Duplicate check | Warn if filename matches an already-ingested document | "A document with this name already exists. Uploading will replace it." |

### GitHub import

| Rule     | Constraint                                    | Error message                                         |
| -------- | --------------------------------------------- | ----------------------------------------------------- |
| Username | Required, non-empty, trimmed                  | "GitHub username is required."                        |
| PAT      | Optional; if provided, must start with `ghp_` | "Invalid token format. GitHub PATs start with ghp\_." |

Validation logic lives in `lib/validators.ts` as pure functions (no React dependencies), making them independently testable.

---

## 5. Frontend testing strategy

Three tiers, in priority order:

| Tier            | Tool                           | What to test                                                              | Example                                                                           |
| --------------- | ------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Hook tests      | Vitest + renderHook            | Business logic in hooks — SSE parsing, state accumulation, error handling | `useChat` correctly splits streamed tokens into grounded vs suggested             |
| Component tests | Vitest + React Testing Library | Interactive behaviour — does clicking/typing do the right thing?          | `ChatInput` calls submit handler; `BotMessage` renders both sections when present |
| API layer tests | Vitest + MSW                   | HTTP/SSE correctness — does the client parse responses correctly?         | `queryApi` correctly parses SSE events, handles connection drops                  |

**Skip:** Snapshot tests, CSS class assertions. Test behaviour, not appearance.

---

## 5. Backend changes

### 5.1 New `documents` table

```
documents
  id                text    PK      # Deterministic SHA-256 (tenant + normalized title)
  tenant_id         text
  title             text            # Original filename or repo name
  source            text            # 'manual' | 'github'
  status            text            # Extends JobStatus: 'waiting' | 'delayed' | 'active' | 'processing' | 'completed' | 'failed' + 'deleting' | 'delete_failed'
  processing_stage  text    NULL    # 'normalizing' | 'chunking' | 'embedding' | 'storing'
  total_chunks      int     NULL    # Set after chunking step completes
  chunks_processed  int     default 0  # Incremented after each chunk is embedded
  chunk_count       int     default 0  # Final count after successful storage
  error_message     text    NULL    # Populated on failure
  job_id            text    NULL    # BullMQ job reference
  created_at        timestamp
  updated_at        timestamp
```

**Index:** `(tenant_id, created_at DESC)` — supports paginated listing sorted by most recent first.

### 5.2 Foreign key on chunks table

```
chunks.document_id → documents.id (FK, ON DELETE CASCADE)
```

- Prevents orphan chunks
- Delete cascades automatically — delete the document row and Postgres handles chunk removal
- Requires a Drizzle migration

### 5.3 New endpoint: `GET /kb/documents`

Returns all documents for the tenant with metadata (status, processing_stage, chunk_count, source, timestamps). This is what the frontend's KB page polls to build the document list.

### 5.4 Async delete via BullMQ

`DELETE /ingest/:documentId` no longer deletes synchronously. Instead:

1. Sets document status to `deleting`
2. Enqueues a delete job on BullMQ
3. Returns `202 Accepted` immediately

The worker picks up the job, deletes the document row (FK cascade handles chunks), and emits a `document:deleted` SSE event to the dashboard. If deletion fails, status is set to `delete_failed` with an error message.

This prevents long-running DELETE queries from blocking the API process at scale.

### 5.5 ProcessIngestionJob changes

The use case now:

1. Creates the document row (status: `waiting`) before enqueueing the BullMQ job
2. Updates `processing_stage` at each pipeline step (normalizing → chunking → embedding → storing)
3. After chunking: sets `total_chunks` on the document row
4. During embedding: increments `chunks_processed` after each chunk is embedded, emits `document:progress` SSE event
5. After successful storage: updates `chunk_count`, sets status to `completed`, emits `document:completed` SSE event
6. On failure: sets status to `failed` with `error_message`, emits `document:failed` SSE event

### 5.6 SSE on the `/query` endpoint

**Why SSE over WebSocket:** The data flow is unidirectional (server streams answer to client). The user sends a question via regular `POST /query` — they don't need to push data through a persistent connection. SSE is simpler, works with existing Fastify middleware (rate limiting, validation, tenant context), and is the same pattern ChatGPT and Claude use.

**How it works:**

1. User sends `POST /query` with `Accept: text/event-stream` header
2. Server opens an SSE stream instead of returning JSON
3. Tokens are pushed as they're generated by the LLM
4. When no SSE header is present, falls back to existing JSON response (backward compatible)

**SSE event protocol:**

| Event       | Payload                                  | When                                     |
| ----------- | ---------------------------------------- | ---------------------------------------- |
| `grounded`  | Streamed tokens (text)                   | As the grounded section generates        |
| `suggested` | Streamed tokens (text)                   | After grounded completes                 |
| `citations` | Single JSON payload with source metadata | After suggested completes                |
| `done`      | Empty                                    | Signals stream end, triggers cache store |

**Backend implementation:**

- `LlmProvider` port gets a new method: `generateStream(system, question, maxTokens) → AsyncGenerator<string>`
- `OllamaProvider` adapter implements it using Ollama's native `stream: true` option
- `ClaudeProvider` adapter (future) implements it using the Anthropic SDK's streaming API
- Query route checks the `Accept` header and branches between SSE and JSON response

### 5.7 SSE for KB dashboard

A second SSE channel, separate from the query stream. The KB page opens a persistent connection on load.

**Endpoint:** `GET /kb/events`

**Event protocol:**

| Event                | Payload                                               | Trigger                         |
| -------------------- | ----------------------------------------------------- | ------------------------------- |
| `document:progress`  | `{ documentId, stage, chunksProcessed, totalChunks }` | After each chunk is embedded    |
| `document:completed` | `{ documentId, chunkCount }`                          | Ingestion finished successfully |
| `document:failed`    | `{ documentId, errorMessage }`                        | Ingestion failed after retries  |
| `document:deleted`   | `{ documentId }`                                      | Async delete completed          |

**Frontend handling:**

- Updates the document row in place via React Query cache invalidation
- Shows a toast notification for completed/failed/deleted events
- No polling needed — the dashboard is fully reactive

**Implementation:**

- V1 (worker in same process): in-process EventEmitter. The worker emits events; the SSE route subscribes and forwards to connected clients.
- Future (worker in separate process): Valkey pub/sub channel. Same event protocol, different transport. No frontend changes needed.

### 5.8 Paginated `GET /kb/documents`

Cursor-based pagination, sorted by most recent first.

**Request:**

```
GET /kb/documents?limit=20&cursor=<created_at of last item>
```

**Response:**

```json
{
  "documents": [...],
  "nextCursor": "2026-06-22T10:30:00Z",
  "hasMore": true
}
```

- Cursor is the `created_at` timestamp of the last document in the current page
- Next request fetches documents where `created_at < cursor`
- Uses the `(tenant_id, created_at DESC)` index — efficient at any page depth
- Default limit: 20
- No filtering yet (parking lot: filter by source, status, date range)

---

## 6. Data flows

### Ingestion flow

```
User uploads file / connects GitHub
  → POST /ingest/upload or /ingest/github
  → Fastify middleware (rate limit → validate → tenant context)
  → IngestManualDocument use case:
      1. Derive deterministic documentId (SHA-256 of tenant + title)
      2. Create document row (status: waiting)
      3. Enqueue BullMQ job
      4. Return jobId to frontend
  → BullMQ worker picks up job
  → ProcessIngestionJob use case:
      1. Update status → processing, stage → normalizing
      2. Normalize text (strip HTML, clean whitespace)
      3. Update stage → chunking
      4. Chunk (RecursiveCharacterTextSplitter, 800 chars, 100 overlap)
      5. Set total_chunks on document row
      6. Update stage → embedding
      7. For each chunk (requires changing embedder.embed from batch to sequential):
         a. Embed chunk (all-MiniLM-L6-v2, 384 dimensions)
         b. Increment chunks_processed on document row
         c. Emit SSE event: document:progress { chunksProcessed, totalChunks }
      8. Update stage → storing
      9. Transaction: delete old chunks + batch insert new chunks
      10. Update chunk_count on document row
      11. Invalidate cache (INCR kb_version)
      12. Update status → completed
      13. Emit SSE event: document:completed { chunkCount }
      (On failure → status: failed, emit document:failed { errorMessage })
```

### Query flow

```
User types question and hits send
  → POST /query (Accept: text/event-stream)
  → Fastify middleware (rate limit → validate → tenant context)
  → AnswerCareerQuery use case:
      1. InputGuard (profanity + injection check)
      2. Cache check (exact-match, key = tenant:kb_version:normalized_question)
      3. [cache hit] → return cached answer (no SSE, instant JSON)
      4. [cache miss] → embed question (384-dim vector)
      5. Hybrid search (0.7 semantic + 0.3 BM25, tenant-scoped, top 3)
      6. Confidence check (top score < 0.15 → refuse)
      7. Build two-layer prompt (grounded + suggested)
      8. LLM generateStream (Ollama qwen3:4b or Claude)
      9. Stream SSE events: grounded → suggested → citations → done
      10. Cache store (after stream completes)
```

---

## 7. Locked-in build items

These are confirmed and will be built for the demoable version:

1. `documents` table with status, processing_stage, total_chunks, and chunks_processed tracking
2. Foreign key on `chunks.document_id` with `ON DELETE CASCADE`
3. Composite index on `(tenant_id, created_at DESC)` for paginated listing
4. `GET /kb/documents` with cursor-based pagination (limit + cursor, most recent first)
5. `GET /kb/events` SSE endpoint for real-time dashboard updates
6. Async delete via BullMQ worker with `deleting`/`delete_failed` status
7. `ProcessIngestionJob` updates processing_stage + chunks_processed at each step, emits SSE events
8. SSE streaming on `POST /query` with the four-event protocol (grounded, suggested, citations, done)
9. `LlmProvider` port extended with `generateStream()` method
10. React frontend — Chat page + KB page with shared navigation
11. Frontend architecture following the feature-based structure
12. KB dashboard: real-time document status updates via SSE, toast notifications on complete/fail/delete
13. Frontend tests (hooks → components → API layer)

---

## 8. TBD items (after demoable version)

| Item                             | Notes                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| Cancel stream                    | AbortController on the fetch request; swap send button for stop button while streaming      |
| Edit previous question           | Frontend-only — remove messages after the edited one, re-submit                             |
| Error handling + typed responses | Try/catch at use-case level across all DB operations; typed error responses for frontend    |
| Retry for failed manual uploads  | Requires storing raw file content in documents table; one-click re-enqueue                  |
| Claude LLM swap                  | One config line change; do at deploy time (cheaper than self-hosting Ollama)                |
| `profile.md`                     | Add a profile document to the KB with name + summary; improves answer quality significantly |

### Future refinements (not V2, when needed)

- Tiered file dedup (size → partial hash → full hash) for large files
- Multi-process worker (separate entry point from API)
- Partition chunks table by tenant_id (hash partitioning) at scale
- Anthropic prompt caching on stable system prompt prefix
- Upgrade embedding model (bge-m3 or Voyage voyage-code-3)
- Track tsvector column in Drizzle migrations properly
- KB filtering on `GET /kb/documents` (by source, status, date range)

### Refactor list

| Item                                   | Why                                                                                                                                                                                                                                                               | Impact                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Batch embedding → sequential embedding | Current `embedder.embed(chunks)` processes all chunks at once. Must change to per-chunk loop to support progress tracking and to reduce peak memory. Slight latency increase (N calls vs 1) but enables `chunks_processed` updates and SSE progress events.       | Required for chunk progress feature; blocks `document:progress` SSE events until done |
| Streaming chunk storage                | Currently all chunk objects + embeddings are held in memory until the final transaction. For large documents (deep code summarisation), this is a memory risk. Future approach: stream chunks to a staging table or temp file, then bulk-load in the transaction. | Not urgent for .md/.txt files; becomes critical for deep code summarisation           |
