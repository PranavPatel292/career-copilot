import type { JobStatus } from "./document";

export interface ValidationErrorResponse {
  error: "Validation failed";
  details: { field: string; message: string }[];
}

export interface UploadResponse {
  ingested: {
    file: string;
    jobId: string;
    documentId: string;
    status: JobStatus;
  }[];
  errors: { file: string; error: string }[];
}

export interface GitHubImportResponse {
  imported: { repo: string; jobId: string }[];
  skipped: { repo: string; reason: string }[];
}

export interface DeleteResponse {
  documentId: string;
  status: "deleting";
}

export interface JobStatusResponse {
  status: JobStatus;
  result?: { chunksStored: number };
  error?: string;
}
