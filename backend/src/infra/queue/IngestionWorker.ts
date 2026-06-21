import { Worker } from "bullmq";
import type { IngestionJob } from "../../ports/IngestionQueue.js";
import type { ProcessIngestionJob } from "../../use-cases/ProcessIngestionJob.js";

export function startIngestionWorker(
  valkeyUrl: string,
  processJob: ProcessIngestionJob,
) {
  const parsed = new URL(valkeyUrl);
  const connection = {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
  };

  const worker = new Worker(
    "ingestion",
    async (job) => {
      const data = job.data as IngestionJob;
      console.log(`[worker] Processing: ${data.title} (${data.documentId})`);
      const result = await processJob.execute(data);
      console.log(`[worker] Done: ${result.chunksStored} chunks stored`);
      return result;
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on("error", (err) => {
    console.error(`[worker] Worker error: ${err.message}`);
  });

  console.log("[worker] Ingestion worker started");
  return worker;
}
