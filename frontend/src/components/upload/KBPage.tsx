import { useDocumentUpload } from "@/hooks/useDocumentUpload";
import { useGitHubImport } from "@/hooks/useGitHubImport";
import { useKBEvents } from "@/hooks/useKBEvents";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { DocumentList } from "./DocumentList";
import { DropZone } from "./DropZone";
import { GitHubImport } from "./GitHubImport";
import { StatsBar } from "./StatsBar";

export function KBPage() {
  useKBEvents();
  const { documents, total, hasMore, loadMore, deleteDocument } =
    useKnowledgeBase();
  const { upload } = useDocumentUpload();
  const { importRepos, isImporting } = useGitHubImport();

  const chunkCount = documents.reduce((sum, doc) => sum + doc.chunkCount, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <StatsBar documentCount={total} chunkCount={chunkCount} />
      <DropZone onFilesSelected={upload} />
      <GitHubImport
        onImport={(username, token) => importRepos({ username, token })}
        isImporting={isImporting}
      />
      <DocumentList
        documents={documents}
        total={total}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onDelete={deleteDocument}
      />
    </div>
  );
}
