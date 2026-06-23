import { DocumentRow } from "./DocumentRow";
import { Pagination } from "./Pagination";
import type { DocumentRecord } from "@/types/document";

interface DocumentListProps {
  documents: DocumentRecord[];
  total: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (documentId: string) => void;
}

export function DocumentList({
  documents,
  total,
  hasMore,
  onLoadMore,
  onDelete,
}: DocumentListProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-foreground">Documents</h2>
        <span className="text-xs text-tertiary">{total} documents</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {documents.map((document) => (
          <DocumentRow
            key={document.id}
            document={document}
            onDelete={onDelete}
          />
        ))}
      </div>
      <Pagination hasMore={hasMore} onLoadMore={onLoadMore} />
    </div>
  );
}
