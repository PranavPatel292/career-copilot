import { FastifyInstance } from "fastify";
import type { IngestionQueue } from "../../../ports/IngestionQueue.js";

export function statusRoutes(app: FastifyInstance, queue: IngestionQueue) {
  app.get("/ingest/status/:jobId", async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const status = await queue.getStatus(jobId);
    return reply.send(status);
  });
}
