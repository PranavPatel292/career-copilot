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

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: varchar("tenant_id").notNull(),
    documentId: varchar("document_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    text: text("text").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("chunks_tenant_doc_idx").on(table.tenantId, table.documentId),
  ],
);
