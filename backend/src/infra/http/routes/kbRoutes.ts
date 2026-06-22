import { FastifyInstance } from "fastify";
import type { DocumentStore } from "../../../ports/DocumentStore.js";
import { validate } from "../middleware/validateRequest.js";
import { kbDocumentsQuerySchema } from "../schema/index.js";

export function kbRoutes(app: FastifyInstance, documentStore: DocumentStore) {
  app.get(
    "/kb/documents",
    {
      preHandler: validate(kbDocumentsQuerySchema, "query"),
    },
    async (req, reply) => {
      const { limit, cursor } = req.query as {
        limit: number;
        cursor?: string;
      };

      const page = await documentStore.findByTenant(
        req.tenantId,
        limit,
        cursor,
      );

      return reply.send(page);
    },
  );
}
