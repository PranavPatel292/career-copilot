import { randomUUID } from "crypto";
import { chunkText } from "../domain/chunker.js";
import { normalizeText } from "../domain/normalizer.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { IngestionJob } from "../ports/IngestionQueue.js";
import type { VectorStore } from "../ports/VectorStore.js";

export class ProcessIngestionJob {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
  ) {}

  async execute(job: IngestionJob): Promise<{ chunksStored: number }> {
    const { tenantId, documentId, text } = job;

    const cleaned = normalizeText(text);
    const chunks = await chunkText(cleaned);
    const embeddings = await this.embedder.embed(chunks);

    const rows = chunks.map((chunkText, i) => ({
      id: randomUUID(),
      tenantId,
      documentId,
      ordinal: i,
      text: chunkText,
      embedding: embeddings[i],
    }));

    await this.store.replaceDocumentChunks(tenantId, documentId, rows);

    return { chunksStored: rows.length };
  }
}
