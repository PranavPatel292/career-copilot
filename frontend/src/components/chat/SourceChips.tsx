import { IconBrandGithub, IconFile } from "@tabler/icons-react";
import { formatChunkCount } from "@/lib/formatters";
import type { Citation } from "@/types/chat";

interface SourceChipsProps {
  citations: Citation[];
  variant?: "inline" | "footer";
}

interface GroupedSource {
  documentId: string;
  title: string;
  source: "manual" | "github";
  chunkCount: number;
}

function groupCitations(citations: Citation[]): GroupedSource[] {
  const map = new Map<string, GroupedSource>();
  for (const citation of citations) {
    const existing = map.get(citation.documentId);
    if (existing) {
      existing.chunkCount += 1;
    } else {
      map.set(citation.documentId, {
        documentId: citation.documentId,
        title: citation.title,
        source: citation.source,
        chunkCount: 1,
      });
    }
  }
  return [...map.values()];
}

export function SourceChips({ citations, variant = "footer" }: SourceChipsProps) {
  const sources = groupCitations(citations);

  if (sources.length === 0) return null;

  if (variant === "inline") {
    return (
      <>
        {sources.map((source) => {
          const Icon = source.source === "github" ? IconBrandGithub : IconFile;
          return (
            <span
              key={source.documentId}
              className="ml-1 inline-flex items-center gap-1 rounded bg-chip-bg px-1.5 py-0.5 text-[11px] text-chip-text"
            >
              <Icon className="size-[11px]" aria-hidden="true" />
              {source.title}
            </span>
          );
        })}
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((source) => {
        const Icon = source.source === "github" ? IconBrandGithub : IconFile;
        return (
          <span
            key={source.documentId}
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
          >
            <Icon className="size-3 text-tertiary" aria-hidden="true" />
            {source.title}
            <span className="text-tertiary">
              · {formatChunkCount(source.chunkCount)}
            </span>
          </span>
        );
      })}
    </div>
  );
}
