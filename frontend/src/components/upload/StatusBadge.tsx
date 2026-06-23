import { IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/document";

const STATUS_LABELS: Record<DocumentStatus, string> = {
  waiting: "Waiting",
  delayed: "Retrying soon",
  active: "Active",
  processing: "Processing",
  completed: "Ingested",
  failed: "Failed",
  deleting: "Deleting",
  delete_failed: "Delete failed",
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  waiting: "bg-secondary text-tertiary",
  delayed: "bg-secondary text-tertiary",
  active: "bg-suggested-bg text-suggested-label",
  processing: "bg-suggested-bg text-suggested-label",
  completed: "bg-grounded-bg text-grounded",
  failed:
    "bg-status-failed-bg text-status-failed-text border border-status-failed-border",
  deleting: "bg-secondary text-tertiary",
  delete_failed:
    "bg-status-failed-bg text-status-failed-text border border-status-failed-border",
};

const SPINNER_STATUSES: DocumentStatus[] = ["active", "processing", "deleting"];

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      aria-label={STATUS_LABELS[status]}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status],
      )}
    >
      {SPINNER_STATUSES.includes(status) && (
        <IconLoader2 className="size-3 animate-spin" aria-hidden="true" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
