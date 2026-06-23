export interface Citation {
  chunkId: string;
  documentId: string;
  title: string;
  source: "manual" | "github";
  text: string;
  score: number;
}

export interface Answer {
  grounded: string;
  suggested: string;
  citations: Citation[];
}

// Mirrors backend/src/domain/entities.ts's StreamEvent union exactly.
export type StreamEvent =
  | { type: "instant"; answer: Answer }
  | { type: "grounded"; text: string }
  | { type: "suggested"; text: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "done" };

export interface Message {
  id: string;
  role: "user" | "bot";
  question?: string;
  grounded?: string;
  suggested?: string;
  citations?: Citation[];
  isStreaming?: boolean;
  isCacheHit?: boolean;
  isLowConfidence?: boolean;
  error?: string;
}
