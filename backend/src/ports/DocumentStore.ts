import type { JobStatus } from "./IngestionQueue.js";

// Extends JobStatus with document-specific delete lifecycle states
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDocumentInput {
  id: string;
  tenantId: string;
  title: string;
  source: "manual" | "github";
  jobId?: string;
}

export interface DocumentsPage {
  documents: DocumentRecord[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  totalPages: number;
}

export interface DocumentStore {
  /** Create a new document record with status 'waiting' */
  create(input: CreateDocumentInput): Promise<DocumentRecord>;

  /** Get a single document by ID */
  findById(id: string): Promise<DocumentRecord | null>;

  /** List documents for a tenant with cursor-based pagination */
  findByTenant(
    tenantId: string,
    limit: number,
    cursor?: string,
  ): Promise<DocumentsPage>;

  /** Update document status and optional fields */
  updateStatus(
    id: string,
    status: DocumentStatus,
    fields?: {
      processingStage?: ProcessingStage | null;
      totalChunks?: number;
      chunksProcessed?: number;
      chunkCount?: number;
      errorMessage?: string | null;
      jobId?: string;
    },
  ): Promise<void>;

  /** Delete a document record (FK cascade handles chunks) */
  delete(id: string): Promise<void>;
}
