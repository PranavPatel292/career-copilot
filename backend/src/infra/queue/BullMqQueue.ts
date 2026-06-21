import { Job, Queue } from "bullmq";
import type {
  IngestionJob,
  IngestionQueue,
  JobStatus,
  JobStatusResult,
} from "../../ports/IngestionQueue.js";

export class BullMqQueue implements IngestionQueue {
  private queue: Queue;

  constructor(valkeyUrl: string) {
    const connection = this.parseConnection(valkeyUrl);
    this.queue = new Queue("ingestion", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });
  }

  async enqueue(job: IngestionJob): Promise<string> {
    const added = await this.queue.add("ingest", job, {
      jobId: job.documentId,
    });
    return added.id!;
  }

  async getStatus(jobId: string): Promise<JobStatusResult> {
    const job = await Job.fromId(this.queue, jobId);
    if (!job) return { status: "failed", error: "Job not found" };

    const state = await job.getState();
    const status: JobStatus =
      state === "unknown" ? "failed" : (state as JobStatus);

    return {
      status,
      result: status === "completed" ? job.returnvalue : undefined,
      error: status === "failed" ? job.failedReason : undefined,
    };
  }

  private parseConnection(url: string) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
    };
  }
}
