CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"source" varchar NOT NULL,
	"status" varchar DEFAULT 'waiting' NOT NULL,
	"processing_stage" varchar,
	"total_chunks" integer,
	"chunks_processed" integer DEFAULT 0,
	"chunk_count" integer DEFAULT 0,
	"error_message" text,
	"job_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "documents_tenant_created_idx" ON "documents" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;