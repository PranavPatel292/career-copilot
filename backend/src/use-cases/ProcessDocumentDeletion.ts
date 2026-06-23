import type { DeletionJob } from "../ports/DeletionQueue.js";
import type { DocumentStore } from "../ports/DocumentStore.js";
import type { ResponseCache } from "../ports/ResponseCache.js";

export class ProcessDocumentDeletion {
  constructor(
    private documentStore: DocumentStore,
    private cache: ResponseCache,
  ) {}

  async execute(job: DeletionJob): Promise<void> {
    const { tenantId, documentId } = job;

    // FK cascade on chunks.document_id removes the chunks too
    await this.documentStore.delete(documentId);
    await this.cache.invalidate(tenantId);
  }
}
