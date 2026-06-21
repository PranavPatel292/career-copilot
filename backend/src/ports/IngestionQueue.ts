export type JobStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "delayed"
  | "processing";

export interface JobStatusResult {
  status: JobStatus;
  result?: { chunksStored: number };
  error?: string;
}

export interface IngestionJob {
  tenantId: string;
  documentId: string;
  title: string;
  text: string;
}

export interface IngestionQueue {
  enqueue(job: IngestionJob): Promise<string>;
  getStatus(jobId: string): Promise<JobStatusResult>;
}
