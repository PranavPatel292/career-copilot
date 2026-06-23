import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiUrl } from "@/api/client";
import { subscribeToEventSource } from "@/lib/sse";
import { patchDocumentInCache, removeDocumentFromCache } from "./useKnowledgeBase";
import type { DocumentStatus, ProcessingStage } from "@/types/document";

interface ProgressPayload {
  documentId: string;
  stage: ProcessingStage | null;
  chunksProcessed: number;
  totalChunks: number | null;
}

interface CompletedPayload {
  documentId: string;
  chunkCount: number;
}

interface FailedPayload {
  documentId: string;
  errorMessage: string;
}

interface DeletedPayload {
  documentId: string;
}

export function useKBEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToEventSource(apiUrl("/kb/events"), {
      "document:progress": (data) => {
        const payload = data as ProgressPayload;
        const status: DocumentStatus = payload.stage ? "processing" : "active";
        patchDocumentInCache(queryClient, payload.documentId, {
          status,
          processingStage: payload.stage,
          chunksProcessed: payload.chunksProcessed,
          totalChunks: payload.totalChunks,
        });
      },
      "document:completed": (data) => {
        const payload = data as CompletedPayload;
        patchDocumentInCache(queryClient, payload.documentId, {
          status: "completed",
          processingStage: null,
          chunkCount: payload.chunkCount,
        });
        toast.success("Document ingested");
      },
      "document:failed": (data) => {
        const payload = data as FailedPayload;
        patchDocumentInCache(queryClient, payload.documentId, {
          status: "failed",
          errorMessage: payload.errorMessage,
        });
        toast.error(payload.errorMessage);
      },
      "document:deleted": (data) => {
        const payload = data as DeletedPayload;
        removeDocumentFromCache(queryClient, payload.documentId);
        toast.success("Document deleted");
      },
      "document:delete_failed": (data) => {
        const payload = data as FailedPayload;
        patchDocumentInCache(queryClient, payload.documentId, {
          status: "delete_failed",
          errorMessage: payload.errorMessage,
        });
        toast.error(payload.errorMessage);
      },
    });

    return unsubscribe;
  }, [queryClient]);
}
