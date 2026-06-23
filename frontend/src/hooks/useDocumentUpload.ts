import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { toast } from "sonner";
import { uploadDocuments } from "@/api/ingestApi";
import { validateUploadFiles } from "@/lib/validators";
import { prependDocumentsToCache } from "./useKnowledgeBase";
import type { DocumentRecord } from "@/types/document";

export function useDocumentUpload() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      const validation = validateUploadFiles(files);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      return uploadDocuments(files);
    },
    onSuccess: (response) => {
      const now = dayjs().toISOString();
      const placeholders: DocumentRecord[] = response.ingested.map((item) => ({
        id: item.documentId,
        tenantId: "",
        title: item.file.replace(/\.[^.]+$/, ""),
        source: "manual",
        status: item.status,
        processingStage: null,
        totalChunks: null,
        chunksProcessed: 0,
        chunkCount: 0,
        errorMessage: null,
        jobId: item.jobId,
        createdAt: now,
        updatedAt: now,
      }));
      prependDocumentsToCache(queryClient, placeholders);

      for (const error of response.errors) {
        toast.error(`${error.file}: ${error.error}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Upload failed");
    },
  });

  return {
    upload: mutation.mutate,
    isUploading: mutation.isPending,
  };
}
