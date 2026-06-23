import type { ThemeTokens } from "./types";

// Derived from the original light-mode spec in "Career Copilot - Frontend.md"
// (section 2). Not wired into index.css yet — dark is the only active theme
// for now — but kept in the same shape as dark.ts so adding a runtime theme
// switch later is a data swap, not a restructure.
export const light: ThemeTokens = {
  surface: {
    base: "#FFFFFF",
    card: "#FFFFFF",
    elevated: "#F9FAFB",
    hover: "#F3F4F6",
  },
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    body: "#111827",
  },
  border: {
    default: "#E5E7EB",
    emphasis: "#D1D5DB",
    strong: "#3B82F6",
  },
  grounded: {
    bg: "#E1F5EE",
    text: "#0F6E56",
  },
  suggested: {
    bg: "#FAEEDA",
    label: "#854F0B",
    body: "#633806",
  },
  chip: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
  },
  status: {
    failedBg: "#FCEBEB",
    failedText: "#791F1F",
    failedBorder: "#FECACA",
  },
  interactive: {
    sendButtonBg: "#111827",
    sendButtonText: "#FFFFFF",
    sendButtonHoverBg: "#1F2937",
    disabledBg: "#D1D5DB",
    disabledText: "#6B7280",
    deleteIconHover: "#DC2626",
    navActiveTabBg: "#FFFFFF",
    navActiveTabText: "#111827",
    navInactiveTabHoverText: "#6B7280",
  },
};
