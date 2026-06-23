export type TenantId = string;

export interface Document {
  id: string;
  tenantId: TenantId;
  sourceType: "manual" | "github";
  title: string;
  text: string;
}

export interface Chunk {
  id: string;
  tenantId: TenantId;
  documentId: string;
  ordinal: number;
  text: string;
  embedding?: number[];
}

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

export type StreamEvent =
  | { type: "instant"; answer: Answer }
  | { type: "grounded"; text: string }
  | { type: "suggested"; text: string }
  | { type: "citations"; citations: Citation[] }
  | { type: "done" };
