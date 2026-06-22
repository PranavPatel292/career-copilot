import { randomUUID } from "crypto";
import { chunkText } from "../domain/chunker.js";
import { normalizeText } from "../domain/normalizer.js";
import type { DocumentStore } from "../ports/DocumentStore.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { IngestionJob } from "../ports/IngestionQueue.js";
import { ResponseCache } from "../ports/ResponseCache.js";
import type { VectorStore } from "../ports/VectorStore.js";

export class ProcessIngestionJob {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
    private cache: ResponseCache,
    private documentStore: DocumentStore,
  ) {}

  async execute(job: IngestionJob): Promise<{ chunksStored: number }> {
    const { tenantId, documentId, text } = job;

    await this.documentStore.updateStatus(documentId, "active");

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "normalizing",
    });
    const cleaned = normalizeText(text);

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "chunking",
    });
    const chunks = await chunkText(cleaned);
    await this.documentStore.updateStatus(documentId, "processing", {
      totalChunks: chunks.length,
    });

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "embedding",
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
    }

    await this.documentStore.updateStatus(documentId, "processing", {
      processingStage: "storing",
    });
    await this.store.replaceDocumentChunks(tenantId, documentId, rows);

    await this.cache.invalidate(job.tenantId);

    await this.documentStore.updateStatus(documentId, "completed", {
      chunkCount: rows.length,
      processingStage: null,
    });

    return { chunksStored: rows.length };
  }
}
