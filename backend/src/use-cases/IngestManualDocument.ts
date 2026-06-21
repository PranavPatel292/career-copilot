import { IngestionQueue, JobStatus } from "../ports/IngestionQueue.js";

import { deriveDocumentId } from "../domain/documentId.js";

export class IngestManualDocument {
  constructor(private queue: IngestionQueue) {}

  async execute(
    tenantId: string,
    title: string,
    text: string,
  ): Promise<{ jobId: string; documentId: string; status: JobStatus }> {
    const documentId = deriveDocumentId(tenantId, title);

    const jobId = await this.queue.enqueue({
      tenantId,
      documentId,
      title,
      text,
    });

    return { jobId, documentId, status: "processing" };
  }
}
