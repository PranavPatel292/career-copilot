import { Worker } from "bullmq";
import type { DeletionJob } from "../../ports/DeletionQueue.js";
import type { DocumentStore } from "../../ports/DocumentStore.js";
import type { EventBus } from "../../ports/EventBus.js";
import type { ProcessDocumentDeletion } from "../../use-cases/ProcessDocumentDeletion.js";

export function startDeletionWorker(
  valkeyUrl: string,
  processDeletion: ProcessDocumentDeletion,
  documentStore: DocumentStore,
  eventBus: EventBus,
) {
  const parsed = new URL(valkeyUrl);
  const connection = {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
  };

  const worker = new Worker(
    "deletion",
    async (job) => {
      const data = job.data as DeletionJob;
      console.log(`[worker] Deleting document: ${data.documentId}`);
      await processDeletion.execute(data);
      console.log(`[worker] Deleted: ${data.documentId}`);
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on("failed", async (job, err) => {
    console.error(`[worker] Delete job ${job?.id} failed: ${err.message}`);
    if (!job) return;

    const isTerminal = job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!isTerminal) return; // BullMQ will retry; leave status alone

    const data = job.data as DeletionJob;
    await documentStore.updateStatus(data.documentId, "delete_failed", {
      errorMessage: err.message,
    });
    eventBus.emit({
      type: "document:delete_failed",
      tenantId: data.tenantId,
      documentId: data.documentId,
      errorMessage: err.message,
    });
  });

  worker.on("error", (err) => {
    console.error(`[worker] Deletion worker error: ${err.message}`);
  });

  console.log("[worker] Deletion worker started");
  return worker;
}
