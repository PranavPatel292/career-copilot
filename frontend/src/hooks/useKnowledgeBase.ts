import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDocument as deleteDocumentApi } from "@/api/ingestApi";
import { getDocuments } from "@/api/kbApi";
import type { DocumentsPage } from "@/types/document";

export const kbDocumentsQueryKey = ["kb", "documents"] as const;

const PAGE_SIZE = 20;

export function useKnowledgeBase() {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: kbDocumentsQueryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getDocuments(PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: DocumentsPage) => lastPage.nextCursor ?? undefined,
  });

  const documents = query.data?.pages.flatMap((page) => page.documents) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const hasMore = query.data?.pages.at(-1)?.hasMore ?? false;

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteDocumentApi(documentId),
    onMutate: (documentId: string) => {
      patchDocumentInCache(queryClient, documentId, { status: "deleting" });
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  return {
    documents,
    total,
    hasMore,
    isLoading: query.isLoading,
    loadMore: () => query.fetchNextPage(),
    deleteDocument: deleteMutation.mutate,
  };
}

type InfiniteDocumentsData = { pages: DocumentsPage[]; pageParams: unknown[] };

export function patchDocumentInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
  patch: Partial<DocumentsPage["documents"][number]>,
) {
  queryClient.setQueryData<InfiniteDocumentsData>(kbDocumentsQueryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        documents: page.documents.map((doc) =>
          doc.id === documentId ? { ...doc, ...patch } : doc,
        ),
      })),
    };
  });
}

export function removeDocumentFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  documentId: string,
) {
  queryClient.setQueryData<InfiniteDocumentsData>(kbDocumentsQueryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        documents: page.documents.filter((doc) => doc.id !== documentId),
      })),
    };
  });
}

export function prependDocumentsToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  newDocuments: DocumentsPage["documents"],
) {
  queryClient.setQueryData<InfiniteDocumentsData>(kbDocumentsQueryKey, (old) => {
    if (!old || old.pages.length === 0) return old;
    const [firstPage, ...rest] = old.pages;
    return {
      ...old,
      pages: [
        { ...firstPage, documents: [...newDocuments, ...firstPage.documents] },
        ...rest,
      ],
    };
  });
}
