# Career Copilot - Frontend

React/TypeScript frontend for [Career Copilot](../README.md). Two routes: a streaming chat UI and a knowledge-base dashboard, both driven live by Server-Sent Events from the backend - no polling anywhere in the app.

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4 + shadcn/ui** (Radix primitives) - dark theme only for now; see `src/theme/`
- **TanStack Query** - the only state layer; no Redux/Zustand
- **React Router 7**
- **Tabler Icons**, **dayjs**

## Architecture

```
src/
  theme/          # dark.ts (active), light.ts (not wired in), shared types.ts
  types/          # document.ts, chat.ts, api.ts - mirror backend response shapes exactly
  lib/             # sse.ts, formatters.ts, validators.ts, utils.ts (shadcn's cn())
  api/             # client.ts + ingestApi/statusApi/kbApi/queryApi - plain HTTP/SSE, no React
  hooks/           # useKnowledgeBase, useDocumentUpload, useGitHubImport, useKBEvents, useChat
  components/
    chat/           # ChatPage, MessageList, BotMessage, GroundedSection, CopilotTake, SourceChips, ChatInput
    upload/         # KBPage, StatsBar, DropZone, GitHubImport, DocumentList, DocumentRow, StatusBadge
    shared/         # Header (nav + segmented Chat/Knowledge base toggle), LoadingDots
    ui/             # shadcn primitives (button, input, tabs, sonner, tooltip, dialog, badge)
  App.tsx           # / redirects to /chat; /chat; /kb
```

**Layering rule:** `api/` knows HTTP and SSE only, no React Query. `hooks/` owns all React Query usage and cache-key knowledge, and wraps `api/`. `components/` render and call hooks - never `api/` directly. This keeps the SSE/transport layer swappable and testable without a `QueryClient` in scope.

## Why two different SSE approaches

`GET /kb/events` is a plain GET with no special headers, so `hooks/useKBEvents.ts` uses the browser's native `EventSource` directly (via the `subscribeToEventSource` wrapper in `lib/sse.ts`) - free reconnection, no custom parsing needed.

`POST /query` needs a request body and a custom `Accept` header, neither of which `EventSource` supports. So `lib/sse.ts` also exports a manual frame parser (`parseSseStream`) that reads a `fetch()` response's `ReadableStream` byte-by-byte, buffers partial frames across network reads, and yields complete `{event, data}` frames as they arrive. `api/queryApi.ts` also has to handle the backend's instant-JSON fallback: on a cache hit or low-confidence refusal, the server responds with plain JSON even though SSE was requested - detected by checking the response's `Content-Type`, not by trying to parse it as a stream.

## Setup

```bash
yarn install
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3000
yarn dev                # http://localhost:5173
```

Requires the backend running separately - see the [root README](../README.md) for backend setup. The backend's `CORS_ORIGIN` env var must match this dev server's origin (defaults to `http://localhost:5173` on both sides).

## Known gaps

- Dark mode only - `theme/light.ts` exists but isn't wired into `index.css`.
- A few planned shared components (`ErrorBanner`, a `Toast` wrapper, `NavToggle` as its own file) ended up inlined into the components that use them rather than extracted - functionally complete, just not split out.
- No tests yet (planned: Vitest + RTL + MSW).
- Source citation chips are grouped after the grounded paragraph, not positioned inline at the exact claim - citations carry no text-offset data to place them more precisely.
