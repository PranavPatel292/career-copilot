import { apiFetch } from "./client";
import type { JobStatusResponse } from "@/types/api";

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  return apiFetch<JobStatusResponse>(`/ingest/status/${jobId}`);
}
