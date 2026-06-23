import type { ThemeTokens } from "./types";

// Mirrors the CSS variables in src/index.css (.dark block) exactly — this
// file is the typed reference for use in JS/TSX (e.g. inline styles, charts),
// since Tailwind v4's CSS-first config has no build step to derive the CSS
// variables from this file automatically. Keep both in sync by hand.
export const dark: ThemeTokens = {
  surface: {
    base: "#0F0F10",
    card: "#1A1A1C",
    elevated: "#242426",
    hover: "#2C2C2E",
  },
  text: {
    primary: "#EDEDEC",
    secondary: "#A0A09E",
    tertiary: "#6B6B69",
    body: "#D0D0CE",
  },
  border: {
    default: "rgba(255, 255, 255, 0.06)",
    emphasis: "rgba(255, 255, 255, 0.12)",
    strong: "rgba(255, 255, 255, 0.18)",
  },
  grounded: {
    bg: "rgba(93, 202, 165, 0.12)",
    text: "#5DCAA5",
  },
  suggested: {
    bg: "rgba(186, 117, 23, 0.12)",
    label: "#EF9F27",
    body: "#D4A854",
  },
  chip: {
    bg: "rgba(55, 138, 221, 0.12)",
    text: "#85B7EB",
  },
  status: {
    failedBg: "rgba(226, 75, 74, 0.12)",
    failedText: "#F09595",
    failedBorder: "rgba(226, 75, 74, 0.25)",
  },
  interactive: {
    sendButtonBg: "#EDEDEC",
    sendButtonText: "#0F0F10",
    sendButtonHoverBg: "#FFFFFF",
    disabledBg: "#3A3A3C",
    disabledText: "#6B6B69",
    deleteIconHover: "#F09595",
    navActiveTabBg: "#242426",
    navActiveTabText: "#EDEDEC",
    navInactiveTabHoverText: "#A0A09E",
  },
};
