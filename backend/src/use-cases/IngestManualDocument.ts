import { IngestionQueue, JobStatus } from "../ports/IngestionQueue.js";
import { DocumentStore } from "../ports/DocumentStore.js";

import { deriveDocumentId } from "../domain/documentId.js";

export class IngestManualDocument {
  constructor(
    private queue: IngestionQueue,
    private documentStore: DocumentStore,
  ) {}

  async execute(
    tenantId: string,
    title: string,
    text: string,
  ): Promise<{ jobId: string; documentId: string; status: JobStatus }> {
    const documentId = deriveDocumentId(tenantId, title);

    await this.documentStore.create({
      id: documentId,
      tenantId,
      title,
      source: "manual",
    });

    const jobId = await this.queue.enqueue({
      tenantId,
      documentId,
      title,
      text,
    });

    await this.documentStore.updateStatus(documentId, "waiting", { jobId });

    return { jobId, documentId, status: "waiting" };
  }
}
