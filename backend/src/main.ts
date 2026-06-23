import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { config } from "./config/index.js";
import { ValkeyCache } from "./infra/cache/ValkeyCache.js";
import { PgDocumentStore } from "./infra/db/PgDocumentStore.js";
import { PgVectorStore } from "./infra/db/PgVectorStore.js";
import { InProcessEventBus } from "./infra/events/InProcessEventBus.js";
import { rateLimiter } from "./infra/http/middleware/rateLimiter.js";
import { tenantContext } from "./infra/http/middleware/tenantContext.js";
import { deleteRoutes } from "./infra/http/routes/deleteRoutes.js";
import { githubRoutes } from "./infra/http/routes/githubRoutes.js";
import { kbEventsRoutes } from "./infra/http/routes/kbEventsRoutes.js";
import { kbRoutes } from "./infra/http/routes/kbRoutes.js";
import { queryRoutes } from "./infra/http/routes/queryRoutes.js";
import { statusRoutes } from "./infra/http/routes/statusRoutes.js";
import { uploadRoutes } from "./infra/http/routes/uploadRoutes.js";
import { LocalEmbeddingProvider } from "./infra/LocalEmbeddingProvider.js";
import { OllamaProvider } from "./infra/ollama/OllamaProvider.js";
import { BullMqDeletionQueue } from "./infra/queue/BullMqDeletionQueue.js";
import { BullMqQueue } from "./infra/queue/BullMqQueue.js";
import { startDeletionWorker } from "./infra/queue/DeletionWorker.js";
import { startIngestionWorker } from "./infra/queue/IngestionWorker.js";
import { AnswerCareerQuery } from "./use-cases/AnswerCareerQuery.js";
import { DeleteDocument } from "./use-cases/DeleteDocument.js";
import { ImportFromGitHub } from "./use-cases/ImportFromGitHub.js";
import { IngestManualDocument } from "./use-cases/IngestManualDocument.js";
import { ProcessDocumentDeletion } from "./use-cases/ProcessDocumentDeletion.js";
import { ProcessIngestionJob } from "./use-cases/ProcessIngestionJob.js";

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: config.cors.origin,
    allowedHeaders: ["Content-Type", "Accept", "Cache-Control"],
  });
  await app.register(rateLimiter);
  await app.register(tenantContext);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  });

  const embedder = new LocalEmbeddingProvider();
  const store = new PgVectorStore();
  const cache = new ValkeyCache(config.valkeyUrl);
  const llm = new OllamaProvider(config.ollamaUrl);
  const queue = new BullMqQueue(config.valkeyUrl);
  const deletionQueue = new BullMqDeletionQueue(config.valkeyUrl);
  const documentStore = new PgDocumentStore();
  const eventBus = new InProcessEventBus();
  const importGithub = new ImportFromGitHub(queue, documentStore);

  const ingest = new IngestManualDocument(queue, documentStore);
  const processJob = new ProcessIngestionJob(
    embedder,
    store,
    cache,
    documentStore,
    eventBus,
  );
  const deleteDocument = new DeleteDocument(documentStore, deletionQueue);
  const processDeletion = new ProcessDocumentDeletion(
    documentStore,
    cache,
    eventBus,
  );
  const answerQuery = new AnswerCareerQuery(
    embedder,
    store,
    llm,
    cache,
    documentStore,
    config.limits.maxQuestionTokens,
    config.limits.maxAnswerTokens,
  );

  startIngestionWorker(config.valkeyUrl, processJob, documentStore, eventBus);
  startDeletionWorker(config.valkeyUrl, processDeletion, documentStore, eventBus);

  uploadRoutes(app, ingest);
  queryRoutes(app, answerQuery);
  statusRoutes(app, queue);
  deleteRoutes(app, deleteDocument);
  githubRoutes(app, importGithub);
  kbRoutes(app, documentStore);
  kbEventsRoutes(app, eventBus);
  app.get("/health", async () => ({ status: "ok" }));

  const port = 3000;
  await app.listen({ port });
  app.log.info(`Career Copilot API up on :${port} (auth=${config.auth.mode})`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
