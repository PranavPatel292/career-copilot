import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { vector } from "drizzle-orm/pg-core";

// ─── Documents ──────────────────────────────────────────────────────────────────
// Tracks document lifecycle from upload to completion.
// Primary key is a deterministic SHA-256 hash of (tenant_id + normalized title),
// ensuring re-uploads of the same file replace cleanly.

export const documents = pgTable(
  "documents",
  {
    id: varchar("id").primaryKey(), // SHA-256(tenant + title)
    tenantId: varchar("tenant_id").notNull(),
    title: varchar("title").notNull(), // Original filename or repo name
    source: varchar("source").notNull(), // 'manual' | 'github'
    status: varchar("status").notNull().default("waiting"), // Aligns with JobStatus: 'waiting' | 'delayed' | 'active' | 'processing' | 'completed' | 'failed' + document-specific: 'deleting' | 'delete_failed'
    processingStage: varchar("processing_stage"), // 'normalizing' | 'chunking' | 'embedding' | 'storing' | null when not processing
    totalChunks: integer("total_chunks"), // Set after chunking step
    chunksProcessed: integer("chunks_processed").default(0), // Incremented after each embedding
    chunkCount: integer("chunk_count").default(0), // Final count after successful storage
    errorMessage: text("error_message"), // Populated on failure
    jobId: varchar("job_id"), // BullMQ job reference (1:1 with document)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("documents_tenant_created_idx").on(table.tenantId, table.createdAt),
  ],
);

// ─── Chunks ─────────────────────────────────────────────────────────────────────
// Each chunk belongs to a document. FK cascades deletes — removing a document
// automatically removes all its chunks.

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: varchar("tenant_id").notNull(),
    documentId: varchar("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    text: text("text").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("chunks_tenant_doc_idx").on(table.tenantId, table.documentId),
  ],
);
