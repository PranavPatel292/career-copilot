export type { ThemeTokens } from "./types";
export { dark } from "./dark";
export { light } from "./light";

import { dark } from "./dark";

// Dark is the only theme wired into index.css for now.
export const activeTheme = dark;
