import { randomUUID } from "crypto";
import { chunkText } from "../domain/chunker.js";
import { normalizeText } from "../domain/normalizer.js";
import type { DocumentStore } from "../ports/DocumentStore.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { EventBus } from "../ports/EventBus.js";
import type { IngestionJob } from "../ports/IngestionQueue.js";
import { ResponseCache } from "../ports/ResponseCache.js";
import type { VectorStore } from "../ports/VectorStore.js";

export class ProcessIngestionJob {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
    private cache: ResponseCache,
    private documentStore: DocumentStore,
    private eventBus: EventBus,
  ) {}

  async execute(job: IngestionJob): Promise<{ chunksStored: number }> {
    const { tenantId, documentId, text } = job;

    await this.documentStore.updateStatus(documentId, "active");
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: null,
      chunksProcessed: 0,
      totalChunks: null,
    });

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "normalizing",
    });
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: "normalizing",
      chunksProcessed: 0,
      totalChunks: null,
    });
    const cleaned = normalizeText(text);

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "chunking",
    });
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: "chunking",
      chunksProcessed: 0,
      totalChunks: null,
    });
    const chunks = await chunkText(cleaned);
    await this.documentStore.updateStatus(documentId, "processing", {
      totalChunks: chunks.length,
    });
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: "chunking",
      chunksProcessed: 0,
      totalChunks: chunks.length,
    });

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "embedding",
    });
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: "embedding",
      chunksProcessed: 0,
      totalChunks: chunks.length,
    });
    const rows: {
      id: string;
      tenantId: string;
      documentId: string;
      ordinal: number;
      text: string;
      embedding: number[];
    }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const [embedding] = await this.embedder.embed([chunks[i]]);
      rows.push({
        id: randomUUID(),
        tenantId,
        documentId,
        ordinal: i,
        text: chunks[i],
        embedding,
      });
      await this.documentStore.updateStatus(documentId, "processing", {
        chunksProcessed: i + 1,
      });
      this.eventBus.emit({
        type: "document:progress",
        tenantId,
        documentId,
        stage: "embedding",
        chunksProcessed: i + 1,
        totalChunks: chunks.length,
      });
    }

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "storing",
    });
    this.eventBus.emit({
      type: "document:progress",
      tenantId,
      documentId,
      stage: "storing",
      chunksProcessed: chunks.length,
      totalChunks: chunks.length,
    });
    await this.store.replaceDocumentChunks(tenantId, documentId, rows);

    await this.cache.invalidate(job.tenantId);

    await this.documentStore.updateStatus(documentId, "completed", {
      chunkCount: rows.length,
      processingStage: null,
    });
    this.eventBus.emit({
      type: "document:completed",
      tenantId,
      documentId,
      chunkCount: rows.length,
    });

    return { chunksStored: rows.length };
  }
}
