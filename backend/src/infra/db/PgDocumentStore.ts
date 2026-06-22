import { and, desc, eq, lt, sql } from "drizzle-orm";
import type {
  CreateDocumentInput,
  DocumentRecord,
  DocumentStatus,
  DocumentStore,
  DocumentsPage,
  ProcessingStage,
} from "../../ports/DocumentStore";

import { db } from "./index.js";
import { documents } from "./schema.js";

export class PgDocumentStore implements DocumentStore {
  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    const [row] = await db
      .insert(documents)
      .values({
        id: input.id,
        tenantId: input.tenantId,
        title: input.title,
        source: input.source,
        status: "waiting",
        jobId: input.jobId ?? null,
      })
      .returning();

    return this.toRecord(row);
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    const [row] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    return row ? this.toRecord(row) : null;
  }

  async findByTenant(
    tenantId: string,
    limit: number = 20,
    cursor?: string,
  ): Promise<DocumentsPage> {
    // Fetch one extra to determine hasMore
    const fetchLimit = limit + 1;

    // Total is scoped to tenantId only (not the cursor), so it stays stable across pages
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(documents)
        .where(
          cursor
            ? and(
                eq(documents.tenantId, tenantId),
                lt(documents.createdAt, new Date(cursor)),
              )
            : eq(documents.tenantId, tenantId),
        )
        .orderBy(desc(documents.createdAt))
        .limit(fetchLimit),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(documents)
        .where(eq(documents.tenantId, tenantId)),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    return {
      documents: pageRows.map((row) => this.toRecord(row)),
      nextCursor: hasMore
        ? pageRows[pageRows.length - 1].createdAt.toISOString()
        : null,
      hasMore,
      total: count,
      totalPages: Math.ceil(count / limit),
    };
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    fields?: {
      processingStage?: ProcessingStage | null;
      totalChunks?: number;
      chunksProcessed?: number;
      chunkCount?: number;
      errorMessage?: string | null;
      jobId?: string;
    },
  ): Promise<void> {
    await db
      .update(documents)
      .set({
        status,
        ...(fields?.processingStage !== undefined && {
          processingStage: fields.processingStage,
        }),
        ...(fields?.totalChunks !== undefined && {
          totalChunks: fields.totalChunks,
        }),
        ...(fields?.chunksProcessed !== undefined && {
          chunksProcessed: fields.chunksProcessed,
        }),
        ...(fields?.chunkCount !== undefined && {
          chunkCount: fields.chunkCount,
        }),
        ...(fields?.errorMessage !== undefined && {
          errorMessage: fields.errorMessage,
        }),
        ...(fields?.jobId !== undefined && { jobId: fields.jobId }),
      })
      .where(eq(documents.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Maps a Drizzle row to the port's DocumentRecord type
  private toRecord(row: typeof documents.$inferSelect): DocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      title: row.title,
      source: row.source as "manual" | "github",
      status: row.status as DocumentStatus,
      processingStage: row.processingStage as ProcessingStage | null,
      totalChunks: row.totalChunks,
      chunksProcessed: row.chunksProcessed ?? 0,
      chunkCount: row.chunkCount ?? 0,
      errorMessage: row.errorMessage,
      jobId: row.jobId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
