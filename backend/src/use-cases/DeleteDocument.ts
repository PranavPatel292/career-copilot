import type { DeletionQueue } from "../ports/DeletionQueue.js";
import type { DocumentStore } from "../ports/DocumentStore.js";

export class DeleteDocument {
  constructor(
    private documentStore: DocumentStore,
    private queue: DeletionQueue,
  ) {}

  async execute(
    tenantId: string,
    documentId: string,
  ): Promise<{ documentId: string; status: "deleting" }> {
    const doc = await this.documentStore.findById(documentId);

    if (!doc || doc.tenantId !== tenantId) {
      throw { statusCode: 404, message: `Document ${documentId} not found` };
    }

    await this.documentStore.updateStatus(documentId, "deleting");
    await this.queue.enqueue({ tenantId, documentId });

    return { documentId, status: "deleting" };
  }
}
