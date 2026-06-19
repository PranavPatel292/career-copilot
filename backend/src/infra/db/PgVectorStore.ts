import { eq, sql } from "drizzle-orm";
import type { RetrievedChunk, VectorStore } from "../../ports/VectorStore.js";

import { db } from "./index.js";
import { chunks } from "./schema.js";

export class PgVectorStore implements VectorStore {
  // Job 1: save chunks — plain INSERT
  async upsert(
    rows: {
      id: string;
      tenantId: string;
      documentId: string;
      ordinal: number;
      text: string;
      embedding: number[];
    }[],
  ): Promise<void> {
    // Drizzle doesn't natively handle vector inserts,
    // so we use a raw SQL insert for the embedding column.
    for (const row of rows) {
      await db.insert(chunks).values({
        id: row.id,
        tenantId: row.tenantId,
        documentId: row.documentId,
        ordinal: row.ordinal,
        text: row.text,
        embedding: row.embedding,
      });
    }
  }

  // Job 2: find nearest chunks — SELECT + ORDER BY cosine distance
  async search(
    tenantId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const vectorStr = `[${queryEmbedding.join(",")}]`;

    const results = await db
      .select({
        chunkId: chunks.id,
        documentId: chunks.documentId,
        text: chunks.text,
        score: sql<number>`1 - (${chunks.embedding} <=> ${vectorStr}::vector)`,
      })
      .from(chunks)
      .where(eq(chunks.tenantId, tenantId))
      .orderBy(sql`${chunks.embedding} <=> ${vectorStr}::vector`)
      .limit(topK);

    return results;
  }
}
