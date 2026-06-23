import { Queue } from "bullmq";
import type { DeletionJob, DeletionQueue } from "../../ports/DeletionQueue.js";

export class BullMqDeletionQueue implements DeletionQueue {
  private queue: Queue;

  constructor(valkeyUrl: string) {
    const connection = this.parseConnection(valkeyUrl);
    this.queue = new Queue("deletion", {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });
  }

  async enqueue(job: DeletionJob): Promise<string> {
    const added = await this.queue.add("delete", job, {
      jobId: job.documentId,
    });
    return added.id!;
  }

  private parseConnection(url: string) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
    };
  }
}
