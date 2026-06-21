import { FastifyInstance } from "fastify";
import type { ResponseCache } from "../../../ports/ResponseCache.js";
import type { VectorStore } from "../../../ports/VectorStore.js";

export function deleteRoutes(
  app: FastifyInstance,
  store: VectorStore,
  cache: ResponseCache,
) {
  app.delete("/ingest/:documentId", async (req, reply) => {
    const { documentId } = req.params as { documentId: string };

    await store.deleteByDocument(req.tenantId, documentId);
    await cache.invalidate(req.tenantId);

    return reply.send({ deleted: true, documentId });
  });
}
