import { randomUUID } from "crypto";
import { chunkText } from "../domain/chunker.js";
import { deriveDocumentId } from "../domain/documentId.js";
import { normalizeText } from "../domain/normalizer.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { VectorStore } from "../ports/VectorStore.js";

export class IngestManualDocument {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
  ) {}

  async execute(
    tenantId: string,
    title: string,
    text: string,
  ): Promise<{ chunksStored: number }> {
    const documentId = deriveDocumentId(tenantId, title);
    const cleaned = normalizeText(text);

    // 1. Chunk (domain logic)
    const chunks = await chunkText(cleaned);

    // 2. Embed (port — doesn't know if it's local or Voyage)
    const embeddings = await this.embedder.embed(chunks);

    // 3. Store (port — doesn't know if it's Postgres or Aurora)
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
