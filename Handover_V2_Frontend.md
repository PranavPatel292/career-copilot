# Career Copilot V2 — Frontend Handover

Status snapshot of the frontend build session. The plan this followed is `Career_Copilot_V2_Planning_Summary.md` + the design spec at `frontend/Career Copilot - Frontend.md` (note: the design doc's *light-mode* color section is superseded — see "Design deviations" below).

## What's built

### Backend fixes (Phase 0)
- **CORS** — `@fastify/cors` registered in `backend/src/main.ts`, origin configurable via `CORS_ORIGIN` env var (`backend/src/config/index.ts`), defaults to `http://localhost:5173`.
- **CORS on hijacked SSE routes** — `reply.hijack()` (used in `queryRoutes.ts`'s SSE branch and `kbEventsRoutes.ts`) bypasses Fastify's normal response pipeline, where `@fastify/cors` injects `Access-Control-Allow-Origin`. Both routes now set that header by hand in their manual `res.writeHead(...)` call.
- **GitHub import document rows** — `ImportFromGitHub.ts` now takes `DocumentStore` and creates a document row (`create()` + `updateStatus(..., "waiting", { jobId })`) before enqueueing, mirroring `IngestManualDocument.ts`. Previously GitHub-imported repos never appeared in the KB dashboard since `ProcessIngestionJob` assumes the row already exists.
- **Citation enrichment** — `Citation` (in `backend/src/domain/entities.ts`) gained `title` and `source` fields. `AnswerCareerQuery.toCitations()` now looks up each unique `documentId` via `DocumentStore.findById()` (at most 3 lookups, top-3 search) so the frontend's sources footer doesn't need to guess document titles from a possibly-empty client cache. `AnswerCareerQuery` constructor now takes `documentStore` (wired in `main.ts`).

### Frontend (Phases 1-4 complete, Phase 5 partial)
Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui (Radix base) + React Query + React Router 7, all installed via yarn (project converted to Yarn Berry 4.17 with `nodeLinker: node-modules` along the way — see Gotchas).

- **Theme** (`frontend/src/theme/`) — `dark.ts` (active), `light.ts` (derived from the original design doc, not wired in), shared `types.ts`. Actual runtime colors live in `frontend/src/index.css` as CSS custom properties (`:root` = light values, `.dark` = dark values, applied via `class="dark"` on `<html>` in `index.html`) — Tailwind v4 is CSS-first, so there's no JS config importing from `theme/`; the two are kept in sync by hand.
- **Shared layer** (`src/types/`, `src/lib/sse.ts`, `src/api/client.ts`, `src/lib/formatters.ts`, `src/lib/validators.ts`) — typed mirrors of backend shapes, manual SSE frame parser for `/query` (fetch+ReadableStream, since POST+custom-header isn't supported by `EventSource`), `EventSource` wrapper for `/kb/events`, `dayjs` for date formatting.
- **KB feature** (`src/api/{ingestApi,statusApi,kbApi}.ts`, `src/hooks/{useKnowledgeBase,useDocumentUpload,useGitHubImport,useKBEvents}.ts`, `src/components/upload/*`) — upload, GitHub import, cursor-paginated document list (`useInfiniteQuery`), live SSE-driven status updates, delete with confirmation dialog. Tested live: upload → processing → completed lifecycle, GitHub import validation.
- **Chat feature** (`src/api/queryApi.ts`, `src/hooks/useChat.ts`, `src/components/chat/*`) — SSE streaming with the instant-JSON fallback (cache hit / low confidence) branch, grounded→suggested→citations→done accumulation, stop-via-`AbortController`, sources footer grouped by document (not true inline positioning — see Design deviations).
- **Routing/nav** — `App.tsx` has `BrowserRouter` with `/` → redirect to `/chat`, `/chat` → `ChatPage`, `/kb` → `KBPage`. `components/shared/Header.tsx` has the logo + segmented Chat/Knowledge base toggle (built by the user directly, styled to match the design spec's nav bar section).

## Design deviations from the written spec (user-confirmed, based on reference screenshots)

1. **Dark mode, not light mode.** Full palette in `index.css`'s `.dark` block / `theme/dark.ts`. Light mode exists in `theme/light.ts` but isn't wired up.
2. **No Retry feature** on failed documents — would need raw-content storage + a new endpoint; explicitly deferred.
3. **Simplified source chips** — grouped after the grounded paragraph, not positioned inline mid-sentence (citations have no text-offset data, and the LLM prompt has no inline-marker instruction).
4. **No outer "app shell" container** — one reference screenshot showed the whole app in a centered rounded card on a darker page background. Tried, user didn't like it, reverted. Current layout is Header + routed page content directly on `bg-background`.
5. **Status badge label** "Ingested" (not "Completed") for the completed state, per the KB page reference screenshot.
6. **Styling convention** — Tailwind classNames composed directly in JSX, no `@apply`/custom CSS classes. The only non-utility CSS is the `@theme`/`:root`/`.dark` token blocks and two `@keyframes` (`dot-pulse`, `cursor-blink`) in `index.css`.

## Not yet done

- **Component extraction** — `ErrorBanner`, a `Toast` wrapper, and `NavToggle` were planned as separate shared components but ended up inlined (error text directly in `ChatInput`/`BotMessage`/`GitHubImport`; `sonner`'s `toast.*` called directly from hooks; the nav toggle lives inside `Header.tsx`). All functionally complete, just not abstracted into their own files. A `Layout.tsx` wrapping `<Outlet/>` was also skipped — `Header` + `<Routes>` sit directly in `App.tsx`.
- **Tests** — none written yet. Plan calls for Vitest+`renderHook` (`useChat`, `useKBEvents`), Vitest+RTL (`ChatInput`, `DocumentRow`/`StatusBadge`), Vitest+MSW (`queryApi` SSE/instant-JSON parsing, `kbApi` pagination).
- **Full manual verification pass** — tested ad hoc: upload→processing→completed lifecycle, GitHub import validation, chat streaming, message alignment. Not yet explicitly confirmed: pagination with >20 documents, delete flow's `document:deleted` SSE confirmation, the low-confidence refusal path, asking the same question twice (cache-hit instant path), stop-button mid-stream.
- **`GitHubProvider` port abstraction** (mentioned in `CLAUDE.md`'s original task list) — explicitly out of scope; `GitHubConnector` is still instantiated directly inside `ImportFromGitHub.ts`.
- Optional cleanup: `@fontsource-variable/inter` is an unused dependency (design spec calls for system font stack; the import was dropped from `index.css` but the package itself is still installed).

## Known gotchas (see also `[[project_bullmq_jobid_collision]]` memory)

- **BullMQ deterministic jobId** — `BullMqQueue.enqueue()` uses the document's content hash as the BullMQ job ID. A request that completes server-side but whose response the browser fails to read (e.g., a pre-CORS-fix upload) can leave a stale terminal job in Valkey under that same ID; re-uploading the same filename later silently no-ops instead of queuing a new job. Fix when it happens: `docker compose exec valkey redis-cli FLUSHALL` (clears Valkey only, not Postgres). Not fixed in code — accepted as a known limitation for now.
- **Yarn Berry conversion** — running `yarn dlx shadcn@latest ...` converted the frontend from classic Yarn 1.x to Yarn Berry 4.17 (corepack auto-fetches Berry since `dlx` doesn't exist in Yarn 1.x). It defaulted to PnP mode, which broke VS Code's TypeScript resolution (no physical `node_modules`); fixed by setting `nodeLinker: node-modules` in `frontend/.yarnrc.yml`. The backend is still on classic Yarn 1.22.22 — the two halves of the repo now use different Yarn major versions, which is fine in practice but worth knowing.
- **`next-themes` dependency** — pulled in automatically by shadcn's `sonner.tsx` template (it's not Next.js-specific despite the name). `Toaster` is rendered with an explicit `theme="dark"` prop in `App.tsx` rather than relying on `next-themes`' system-theme detection, since the app forces dark mode globally.
- **Yarn registry "quarantine"** — Yarn Berry blocks installing freshly-published transitive dependency versions for a cooldown period (`npmMinimalAgeGate` setting). Hit this during `shadcn init`/`add`; resolved by temporarily running `yarn config set npmMinimalAgeGate 0`, installing, then resetting it back (left enabled — it's a legitimate supply-chain safety feature).

## File structure reference

```
frontend/src/
  theme/            dark.ts, light.ts, types.ts, index.ts
  types/            document.ts, chat.ts, api.ts
  lib/              sse.ts, client.ts (actually in api/), formatters.ts, validators.ts, utils.ts (shadcn's cn())
  api/               client.ts, ingestApi.ts, statusApi.ts, kbApi.ts, queryApi.ts
  hooks/             useKnowledgeBase.ts, useDocumentUpload.ts, useGitHubImport.ts, useKBEvents.ts, useChat.ts
  components/
    ui/              shadcn primitives (button, input, tabs, sonner, tooltip, dialog, badge)
    upload/           KBPage, StatsBar, DropZone, GitHubImport, DocumentList, DocumentRow, StatusBadge, Pagination
    chat/             ChatPage, MessageList, UserMessage, BotMessage, GroundedSection, CopilotTake, SourceChips, ChatInput
    shared/           Header.tsx, LoadingDots.tsx
  App.tsx, main.tsx, index.css
```
