import { FastifyInstance } from "fastify";
import { JobStatus } from "../../../ports/IngestionQueue.js";
import { IngestManualDocument } from "../../../use-cases/IngestManualDocument.js";

const ALLOWED_EXTENSIONS = [".md", ".txt"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function uploadRoutes(
  app: FastifyInstance,
  ingest: IngestManualDocument,
) {
  app.post("/ingest/upload", async (req, reply) => {
    const files = (req as any).files();
    const results: {
      file: string;
      jobId: string;
      documentId: string;
      status: JobStatus;
    }[] = [];
    const errors: { file: string; error: string }[] = [];

    for await (const file of files) {
      // 1. Validate extension
      const ext = file.filename
        .slice(file.filename.lastIndexOf("."))
        .toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push({
          file: file.filename,
          error: `Unsupported format. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        });
        continue;
      }

      // 2. Read content as text
      const buffer = await file.toBuffer();

      if (buffer.length > MAX_FILE_SIZE) {
        errors.push({ file: file.filename, error: "File too large (max 5MB)" });
        continue;
      }

      const text = buffer.toString("utf-8");

      if (text.trim().length < 10) {
        errors.push({
          file: file.filename,
          error: "File too short to be useful",
        });
        continue;
      }

      // 3. Title from filename (strip extension)
      const title = file.filename.replace(/\.[^.]+$/, "");

      // 4. Call the same use case — it doesn't know this came from a file
      const result = await ingest.execute(req.tenantId, title, text);
      results.push({ file: file.filename, ...result });
    }

    return reply.status(201).send({ ingested: results, errors });
  });
}
