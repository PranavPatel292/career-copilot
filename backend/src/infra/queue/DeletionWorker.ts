import { Worker } from "bullmq";
import type { DeletionJob } from "../../ports/DeletionQueue.js";
import type { ProcessDocumentDeletion } from "../../use-cases/ProcessDocumentDeletion.js";

export function startDeletionWorker(
  valkeyUrl: string,
  processDeletion: ProcessDocumentDeletion,
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

  worker.on("failed", (job, err) => {
    console.error(`[worker] Delete job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error(`[worker] Deletion worker error: ${err.message}`);
  });

  console.log("[worker] Deletion worker started");
  return worker;
}
