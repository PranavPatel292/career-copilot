import { useState } from "react";
import { IconBrandGithub, IconFile, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatChunkCount, formatProcessingStage } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { DocumentRecord } from "@/types/document";

interface DocumentRowProps {
  document: DocumentRecord;
  onDelete: (documentId: string) => void;
}

export function DocumentRow({ document, onDelete }: DocumentRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const SourceIcon = document.source === "github" ? IconBrandGithub : IconFile;
  const isFailed =
    document.status === "failed" || document.status === "delete_failed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5",
        isFailed && "border-status-failed-border",
      )}
    >
      <SourceIcon
        className="size-[18px] shrink-0 text-tertiary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">
          {document.title}
        </p>
        <p
          className={cn(
            "text-[11px] text-tertiary",
            isFailed && "text-status-failed-text",
          )}
        >
          {subtitleFor(document)}
        </p>
      </div>
      <StatusBadge status={document.status} />
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${document.title}`}
          >
            <IconTrash className="size-4 text-tertiary" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Delete &quot;{document.title}&quot;? This removes it and all its
              chunks from the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(document.id);
                setConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function subtitleFor(document: DocumentRecord): string {
  if (document.status === "failed" || document.status === "delete_failed") {
    return document.errorMessage ?? "Something went wrong";
  }
  if (document.status === "processing" || document.status === "active") {
    return formatProcessingStage(
      document.processingStage,
      document.chunksProcessed,
      document.totalChunks,
    );
  }
  if (document.status === "completed") {
    return formatChunkCount(document.chunkCount);
  }
  if (document.status === "deleting") return "Deleting...";
  if (document.status === "delayed") return "Retrying soon";
  return "Waiting";
}
