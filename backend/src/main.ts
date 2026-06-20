import Fastify from "fastify";
import { AnswerCareerQuery } from "./use-cases/AnswerCareerQuery.js";
// Use cases
import { PgVectorStore } from "./infra/db/PgVectorStore.js";
import { LocalEmbeddingProvider } from "./infra/LocalEmbeddingProvider.js";
import { OllamaProvider } from "./infra/ollama/OllamaProvider.js";
import { IngestManualDocument } from "./use-cases/IngestManualDocument.js";
// Adapters (infra)
import multipart from "@fastify/multipart";
import { config } from "./config/index.js";
import { queryRoutes } from "./infra/http/routes/queryRoutes.js";
// Routes (infra/http)
import { rateLimiter } from "./infra/http/middleware/rateLimiter.js";
// Middleware (infra/http)
import { tenantContext } from "./infra/http/middleware/tenantContext.js";
import { uploadRoutes } from "./infra/http/routes/uploadRoutes.js";

async function bootstrap() {
  const app = Fastify({ logger: true });

  // 1. Middleware (order matters: rate limit → tenant context)
  await app.register(rateLimiter);
  await app.register(tenantContext);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  });

  // 2. Create adapters
  const embedder = new LocalEmbeddingProvider();
  const store = new PgVectorStore();
  const llm = new OllamaProvider(config.ollamaUrl);

  // 3. Create use cases (inject ports)
  const ingest = new IngestManualDocument(embedder, store);
  const answerQuery = new AnswerCareerQuery(
    embedder,
    store,
    llm,
    config.limits.maxQuestionTokens,
    config.limits.maxAnswerTokens,
  );

  // 4. Register routes (pass use cases in)
  uploadRoutes(app, ingest);
  queryRoutes(app, answerQuery);

  // 5. Health check
  app.get("/health", async () => ({ status: "ok" }));

  // 6. Start
  const port = 3000;
  await app.listen({ port });
  app.log.info(`Career Copilot API up on :${port} (auth=${config.auth.mode})`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
