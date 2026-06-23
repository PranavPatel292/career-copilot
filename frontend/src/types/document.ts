export type JobStatus =
  | "waiting"
  | "delayed"
  | "active"
  | "processing"
  | "completed"
  | "failed";

export type DocumentStatus = JobStatus | "deleting" | "delete_failed";

export type ProcessingStage =
  | "normalizing"
  | "chunking"
  | "embedding"
  | "storing";

export interface DocumentRecord {
  id: string;
  tenantId: string;
  title: string;
  source: "manual" | "github";
  status: DocumentStatus;
  processingStage: ProcessingStage | null;
  totalChunks: number | null;
  chunksProcessed: number;
  chunkCount: number;
  errorMessage: string | null;
  jobId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsPage {
  documents: DocumentRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  totalPages: number;
}
