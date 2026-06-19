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
  text: string;
  score: number;
}

export interface Answer {
  grounded: string;
  suggested: string;
  citations: Citation[];
}
