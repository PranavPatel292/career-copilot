import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { ProcessingStage } from "@/types/document";

dayjs.extend(relativeTime);

export function formatRelativeDate(iso: string): string {
  return dayjs(iso).fromNow();
}

const STAGE_LABELS: Record<ProcessingStage, string> = {
  normalizing: "Normalizing",
  chunking: "Chunking",
  embedding: "Embedding",
  storing: "Storing",
};

export function formatProcessingStage(
  stage: ProcessingStage | null,
  chunksProcessed: number,
  totalChunks: number | null,
): string {
  if (!stage) return "Starting...";
  const label = STAGE_LABELS[stage];
  if (stage === "embedding" && totalChunks) {
    return `${label} ${chunksProcessed}/${totalChunks}...`;
  }
  return `${label}...`;
}

export function formatChunkCount(count: number): string {
  return count === 1 ? "1 chunk" : `${count} chunks`;
}
