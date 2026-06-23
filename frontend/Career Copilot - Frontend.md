# Career Copilot — Frontend design specification

This document defines the visual design system, component specs, and page layouts for the Career Copilot frontend. It is the single source of truth for all design decisions. Reference the attached screenshots for the agreed mockups.

---

## 1. Design philosophy

Career Copilot is a portfolio project that serves two audiences: hiring managers evaluating technical taste, and the portfolio owner demoing it in interviews. The design should feel like a polished AI product (Perplexity, ChatGPT) — not a generic dashboard template and not a chat widget clone.

**Core principles:**

- Clean over clever — clarity always wins
- Light mode default, structured answers, generous whitespace
- The UI itself demonstrates the RAG architecture — grounded vs suggested is visible, not hidden
- Every element is intentional — no decorative padding, no placeholder sections

**Inspiration references:**

- Perplexity (answer structure with inline citations)
- ChatGPT (streaming feel, input bar, message layout)
- Linear (component quality, tight spacing, attention to detail)

---

## 2. Color system

### Brand colors

The app uses two semantic accent colors that map to the core RAG feature:

**Grounded (green) — verified from knowledge base:**
| Token | Hex | Usage |
|-------|-----|-------|
| `grounded-bg` | `#E1F5EE` | Badge background |
| `grounded-text` | `#0F6E56` | Label text |
| `grounded-icon` | `#1D9E75` | Check icon |
| `grounded-dark` | `#085041` | Badge text on green bg |

**Suggested / Copilot's take (amber) — inferred, not grounded:**
| Token | Hex | Usage |
|-------|-----|-------|
| `suggested-bg` | `#FAEEDA` | Card background |
| `suggested-text` | `#854F0B` | Label text, subtitle |
| `suggested-icon` | `#854F0B` | Bulb icon |
| `suggested-body` | `#633806` | Body text inside amber card |

**Status colors (document lifecycle):**
| Status | Badge bg | Badge text | Border |
|--------|----------|------------|--------|
| Waiting | `gray-100` | `gray-600` | — |
| Delayed | `gray-100` | `gray-600` | — |
| Active | `#FAEEDA` | `#633806` | — |
| Processing | `#FAEEDA` | `#633806` | — |
| Completed | `#E1F5EE` | `#085041` | — |
| Failed | `#FCEBEB` | `#791F1F` | `border-red-200` |
| Deleting | `gray-100` | `gray-600` | — |
| Delete failed | `#FCEBEB` | `#791F1F` | `border-red-200` |

**Source chips:**
| Token | Hex | Usage |
|-------|-----|-------|
| `chip-bg` | Tailwind `blue-50` / `#EFF6FF` | Inline citation chip background |
| `chip-text` | Tailwind `blue-700` / `#1D4ED8` | Chip text + icon |

### Tailwind config extensions

```javascript
// tailwind.config.js — extend the default theme
module.exports = {
  theme: {
    extend: {
      colors: {
        grounded: {
          50: "#E1F5EE",
          500: "#1D9E75",
          700: "#0F6E56",
          900: "#085041",
        },
        suggested: {
          50: "#FAEEDA",
          500: "#BA7517",
          700: "#854F0B",
          900: "#633806",
        },
      },
    },
  },
};
```

### General color usage rules

- Background: `white` (primary surfaces), Tailwind `gray-50` (secondary surfaces like stats cards, nav background)
- Text: Tailwind `gray-900` (primary), `gray-500` (secondary), `gray-400` (tertiary/hints)
- Borders: Tailwind `gray-200` (default), `gray-300` (hover/emphasis)
- Never use pure black (`#000`) — use `gray-900`
- Never hardcode hex values in components — use the Tailwind tokens above

---

## 3. Typography

The app uses the system font stack (Tailwind's default `font-sans`). No custom fonts needed.

| Element                          | Size               | Weight              | Line height | Color                        |
| -------------------------------- | ------------------ | ------------------- | ----------- | ---------------------------- |
| App title ("Career Copilot")     | 16px (`text-base`) | 500 (`font-medium`) | 1.5         | `gray-900`                   |
| App subtitle                     | 12px (`text-xs`)   | 400 (`font-normal`) | 1.5         | `gray-400`                   |
| Section labels (GROUNDED ANSWER) | 12px (`text-xs`)   | 500 (`font-medium`) | 1.5         | Semantic color (green/amber) |
| Answer body text                 | 14px (`text-sm`)   | 400 (`font-normal`) | 1.7         | `gray-900`                   |
| Copilot's take body              | 13px               | 400                 | 1.65        | `suggested-900` (#633806)    |
| Source chip text                 | 11px               | 400                 | 1           | `blue-700`                   |
| Source footer label              | 12px (`text-xs`)   | 400                 | 1.5         | `gray-400`                   |
| User message text                | 14px (`text-sm`)   | 400                 | 1.5         | `gray-900`                   |
| Input placeholder                | 14px (`text-sm`)   | 400                 | 1.5         | `gray-400`                   |
| Stats card number                | 22px (`text-xl`)   | 500 (`font-medium`) | 1.2         | `gray-900`                   |
| Stats card label                 | 12px (`text-xs`)   | 400                 | 1.5         | `gray-400`                   |
| Document row title               | 13px               | 500 (`font-medium`) | 1.5         | `gray-900`                   |
| Document row subtitle            | 11px               | 400                 | 1.5         | `gray-400`                   |
| Status badge text                | 11px               | 500 (`font-medium`) | 1           | Semantic color               |

**Rules:**

- Only two font weights: 400 (regular) and 500 (medium). Never use 600/700/bold.
- All labels are sentence case. Never Title Case. Never ALL CAPS except section markers (GROUNDED ANSWER).
- Bold inline text (tech keywords in answers) uses `font-medium`, not `font-bold`.
- Monospace (`font-mono`) is not used anywhere — this is a product, not a dev tool.

---

## 4. Spacing and layout

**Base unit:** 4px (Tailwind's default spacing scale)

**Key spacing values:**
| Context | Value | Tailwind class |
|---------|-------|----------------|
| Page padding | 24px | `p-6` |
| Card padding | 16px-20px | `p-4` / `p-5` |
| Section gap (between cards) | 16px | `gap-4` |
| Inner section gap | 10px-14px | `gap-2.5` / `gap-3.5` |
| Stats card grid gap | 10px | `gap-2.5` |
| Document list gap | 6px | `gap-1.5` |

**Max width:** Content is capped at `max-w-2xl` (672px) and centered. This keeps the chat comfortable to read and matches the feel of ChatGPT/Perplexity.

**Border radius:**
| Element | Radius | Tailwind class |
|---------|--------|----------------|
| Cards, answer containers | 12px | `rounded-xl` |
| Input bar | 12px | `rounded-xl` |
| Buttons (send) | 50% | `rounded-full` |
| Status badges | 4px | `rounded` |
| Source chips (inline) | 4px | `rounded` |
| Source chips (footer) | 8px | `rounded-lg` |
| Copilot's take card | 10px | `rounded-[10px]` |
| Drop zone | 12px | `rounded-xl` |
| Stats cards | 8px | `rounded-lg` |

**Borders:**

- Default: `border border-gray-200` (0.5px if supported, 1px fallback)
- Cards and containers: `border border-gray-200`
- Failed document rows: `border border-red-200`
- Drop zone: `border-2 border-dashed border-gray-300`
- Dividers inside cards: `border-t border-gray-100`

---

## 5. Component specifications

### 5.1 Navigation bar

A minimal top bar shared between both pages.

- Full width, white background, bottom border `border-gray-200`
- Height: 56px, flex centered vertically
- Left: app icon (28px circle, `blue-50` bg, briefcase icon `blue-700`) + "Career Copilot" label
- Right: segmented toggle (Chat / Knowledge base)
  - Container: `bg-gray-50`, `rounded-lg`, `p-0.5`
  - Active tab: `bg-white`, `rounded-md`, `shadow-sm`, `font-medium`
  - Inactive tab: transparent, `text-gray-500`
  - Tab icons: `ti-message` (Chat), `ti-database` (Knowledge base)

### 5.2 Chat page

**Empty state (no messages yet):**

- Centered vertically and horizontally
- App icon (larger, 48px), title, subtitle "Ask me anything about Pranav's experience"
- 2-3 suggested starter questions as clickable chips below
- Input bar at the bottom

**Message list:**

- Scrollable area between nav and input bar
- Messages stack top to bottom with 16px gap
- Auto-scroll to bottom on new messages

**User message bubble:**

- Right-aligned, max-width 80%
- Background: `white`, border: `border-gray-200`
- Border radius: 12px
- Padding: 10px 14px
- Text: 14px, `gray-900`

**Bot response card (the main design element):**

- Left-aligned, full width of content area
- Background: `white`, border: `border-gray-200`
- Border radius: 12px
- Padding: 16px 20px

Contains three sections:

**A) Grounded answer section:**

- Green check icon (`ti-check`, 14px, `#1D9E75`) + "GROUNDED ANSWER" label (12px, uppercase, `#0F6E56`, letter-spacing 0.5px)
- Body text: 14px, line-height 1.7, `gray-900`
- Tech keywords: `font-medium` (not bold)
- Inline source chips: `bg-blue-50`, `text-blue-700`, rounded 4px, padding 1px 6px, font-size 11px, with `ti-file` icon (11px). Appear inline right after the claim they support.

**B) Copilot's take card:**

- Separated from grounded by 14px margin-top
- Background: `#FAEEDA` (amber-50)
- Border radius: 10px
- Padding: 12px 14px
- Bulb icon (`ti-bulb`, 14px, `#854F0B`) + "Copilot's take" label (12px, `font-medium`, `#854F0B`)
- Body text: 13px, line-height 1.65, `#633806`

**C) Sources footer:**

- Separated by `border-t border-gray-100`, 14px margin-top, 12px padding-top
- "Sources" label (12px, `gray-400`)
- Source chips: `bg-gray-50`, `rounded-lg`, padding 4px 10px, font-size 12px, `gray-600`
  - Format: `[icon] document-name · N chunks`
  - Icons: `ti-file` for manual uploads, `ti-brand-github` for GitHub imports
  - Chunk count in `gray-400`

**Chat input bar:**

- Sticky at the bottom of the page
- Background: `white`, border: `border-gray-200`
- Border radius: 12px
- Padding: 10px 14px
- Flex row: input (flex-1) + send button
- Send button: 32px circle, `bg-gray-900`, `text-white`, `ti-arrow-up` icon
- While streaming: send button swaps to stop button (`bg-gray-900`, `ti-player-stop` icon)
- Disabled state: `bg-gray-300` (when input is empty)

### 5.3 Knowledge base page

**Stats bar:**

- 3-column grid, `gap-2.5`
- Each card: `bg-gray-50`, `rounded-lg`, padding 12px
- Label: 12px, `gray-400` (top)
- Value: 22px, `font-medium`, `gray-900` (bottom)
- Metrics: "Documents" (count), "Chunks" (total), "KB version"

**Drop zone:**

- `border-2 border-dashed border-gray-300`, `rounded-xl`
- Padding: 28px 20px, centered text
- Upload icon (`ti-upload`, 24px, `gray-400`)
- Primary text: 14px, `gray-600`, "Drop .md or .txt files here, or click to browse"
- Constraint text: 12px, `gray-400`, "Up to 10 files, 5MB each"
- Active/hover state: `border-blue-400`, `bg-blue-50/50`
- Drag-over state: same as active

**GitHub import section:**

- `bg-gray-50`, `rounded-xl`, padding 14px 16px
- Header: GitHub icon (`ti-brand-github`, 16px) + "Import from GitHub" (13px, `font-medium`)
- Inputs row: flex, gap 8px
  - Username input (flex-1, placeholder "GitHub username")
  - PAT input (flex-1, placeholder "PAT (optional)")
  - Import button
- Validation errors appear as 12px red text below the relevant input

**Document list:**

- Section header: "Documents" (13px, `font-medium`) + count on the right (12px, `gray-400`)
- List of document rows with 6px gap

**Document row:**

- Flex row, items centered, gap 12px
- Padding: 10px 14px
- Background: `white`, border: `border-gray-200`, `rounded-lg`
- Left: source icon (`ti-file` or `ti-brand-github`, 18px, `gray-400`)
- Middle (flex-1):
  - Title: 13px, `font-medium`, `gray-900`, truncate with ellipsis
  - Subtitle: 11px, `gray-400` (chunk count, or processing stage, or error message)
- Right: status badge + delete button (`ti-trash`, 16px, `gray-400`)
- Failed row: `border-red-200`, error message in subtitle as `text-red-600`

**Status badge:**

- Padding: 2px 8px, `rounded`, font-size 11px
- Processing badge includes animated spinner (6px circle, `border-2`, border-top transparent, spinning)

**Toast notifications:**

- Position: fixed bottom-right (or use shadcn/ui's Sonner integration)
- Appear when SSE events fire: `document:completed`, `document:failed`, `document:deleted`
- Auto-dismiss after 4 seconds
- Success toast: green accent
- Error toast: red accent

**Pagination:**

- "Load more" button at the bottom of the document list (not infinite scroll)
- Text: "Load more" (13px), secondary button style
- Hidden when `hasMore: false`

---

## 6. Responsive design

The app should work on desktop and tablet. Mobile is a bonus, not a requirement (this is a portfolio demo, not a consumer app).

**Breakpoints:**
| Screen | Width | Behaviour |
|--------|-------|-----------|
| Desktop | ≥768px | Full layout as designed |
| Tablet | 640-767px | Same layout, content area narrows |
| Mobile | <640px | Single column, stats stack, input bar stays fixed at bottom |

**Responsive adjustments:**

- Stats bar: 3 columns → 1 column on mobile (`grid-cols-3 sm:grid-cols-1`)
- GitHub import: inputs row wraps to column on mobile
- Document row: same layout works at all sizes (flex handles it)
- Chat: content max-width adjusts naturally
- Nav toggle: stays as-is (small enough to fit mobile)

**Minimum supported width:** 375px (iPhone SE)

---

## 7. shadcn/ui usage

Use shadcn/ui for the following base components (install only what's needed):

| Component        | Where used                                                      |
| ---------------- | --------------------------------------------------------------- |
| `Button`         | Send/stop, import, load more, delete                            |
| `Input`          | Chat input, GitHub username, PAT                                |
| `Tabs`           | Nav toggle (or custom — shadcn tabs may be heavier than needed) |
| `Sonner` (toast) | KB event notifications                                          |
| `Tooltip`        | Source chips hover (show full document path + chunk range)      |
| `Dialog`         | Delete confirmation                                             |
| `Badge`          | Status badges (or custom — the design is simple enough)         |

**Rules:**

- Use shadcn/ui as a starting point, then customise to match the design spec above
- Do not use shadcn's default color tokens — override with the Tailwind config extensions defined in section 2
- Do not install unnecessary components — every import should serve a purpose
- Prefer custom components over shadcn when the design is simpler than what shadcn provides (e.g. status badges are just styled spans, don't need a component library for that)

---

## 8. Icons

Use Tabler Icons (outline variant, already available via `@tabler/icons-react`).

**Icon inventory:**

| Icon              | Usage                         |
| ----------------- | ----------------------------- |
| `IconBriefcase`   | App icon in nav               |
| `IconMessage`     | Chat tab                      |
| `IconDatabase`    | Knowledge base tab            |
| `IconCheck`       | Grounded answer marker        |
| `IconBulb`        | Copilot's take marker         |
| `IconFile`        | Manual upload source          |
| `IconBrandGithub` | GitHub import source          |
| `IconUpload`      | Drop zone                     |
| `IconTrash`       | Delete document               |
| `IconArrowUp`     | Send button                   |
| `IconPlayerStop`  | Stop generating button        |
| `IconBolt`        | Cache hit indicator           |
| `IconInfoCircle`  | Low confidence indicator      |
| `IconRefresh`     | Retry (future)                |
| `IconLoader2`     | Spinner (with `animate-spin`) |

**Rules:**

- Icon size: 14-18px inline, 24px for decorative (drop zone)
- Icon colour: inherit from parent text color, or explicit semantic color
- Stroke width: default (2) — do not adjust
- Always outline variant, never filled

---

## 9. Animation and transitions

**Keep animations minimal and functional.** This is a professional tool, not a showcase.

| Animation               | Where             | Duration                   | Easing        |
| ----------------------- | ----------------- | -------------------------- | ------------- |
| Typing cursor blink     | Streaming text    | 1s                         | `step-end`    |
| Dot pulse (loading)     | "Searching KB..." | 1.4s per dot, 0.2s stagger | `ease-in-out` |
| Spinner rotation        | Processing badge  | 0.8s                       | `linear`      |
| Toast enter             | Bottom-right      | 200ms                      | `ease-out`    |
| Toast exit              | Bottom-right      | 150ms                      | `ease-in`     |
| Badge colour transition | Status change     | 200ms                      | `ease`        |

**No animations on:**

- Page transitions (instant swap via React Router)
- Card hover states (subtle bg change only, no transform)
- Message appearance (just render, no slide-in or fade)

---

## 10. Accessibility

- All interactive elements must be keyboard accessible
- Icon-only buttons must have `aria-label`
- Decorative icons get `aria-hidden="true"`
- Source chips are buttons with descriptive labels
- Status badges use `aria-label` with full status text
- Input has proper `label` association (visually hidden if needed)
- Colour contrast: all text/bg combinations meet WCAG AA (4.5:1 for body text, 3:1 for large text)
- Focus ring: `ring-2 ring-blue-500 ring-offset-2` (Tailwind default, do not remove)
- Drop zone is keyboard-activatable (Enter/Space triggers file picker)

---

## 11. File structure for styles

No separate CSS files. All styling via Tailwind utility classes in JSX. The only custom CSS is:

- `tailwind.config.js` — color extensions (section 2)
- `globals.css` — Tailwind directives (`@tailwind base/components/utilities`) + keyframe animations (cursor blink, dot pulse)

No CSS modules, no styled-components, no emotion. Tailwind only.
