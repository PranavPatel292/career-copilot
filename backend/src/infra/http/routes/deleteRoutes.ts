import { FastifyInstance } from "fastify";
import type { DeleteDocument } from "../../../use-cases/DeleteDocument.js";

export function deleteRoutes(
  app: FastifyInstance,
  deleteDocument: DeleteDocument,
) {
  app.delete("/ingest/:documentId", async (req, reply) => {
    const { documentId } = req.params as { documentId: string };

    const result = await deleteDocument.execute(req.tenantId, documentId);

    return reply.status(202).send(result);
  });
}
