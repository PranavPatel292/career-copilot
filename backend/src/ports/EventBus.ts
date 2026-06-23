import type { ProcessingStage } from "./DocumentStore.js";

export type DocumentLifecycleEvent =
  | {
      type: "document:progress";
      tenantId: string;
      documentId: string;
      stage: ProcessingStage | null;
      chunksProcessed: number;
      totalChunks: number | null;
    }
  | {
      type: "document:completed";
      tenantId: string;
      documentId: string;
      chunkCount: number;
    }
  | {
      type: "document:failed";
      tenantId: string;
      documentId: string;
      errorMessage: string;
    }
  | {
      type: "document:deleted";
      tenantId: string;
      documentId: string;
    }
  | {
      type: "document:delete_failed";
      tenantId: string;
      documentId: string;
      errorMessage: string;
    };

export interface EventBus {
  emit(event: DocumentLifecycleEvent): void;
  subscribe(listener: (event: DocumentLifecycleEvent) => void): () => void;
}
