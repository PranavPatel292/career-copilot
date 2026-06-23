import { IconCheck } from "@tabler/icons-react";
import { SourceChips } from "./SourceChips";
import type { Citation } from "@/types/chat";

interface GroundedSectionProps {
  text: string;
  citations: Citation[];
  isGenerating: boolean;
}

export function GroundedSection({
  text,
  citations,
  isGenerating,
}: GroundedSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <IconCheck className="size-3.5 text-grounded" aria-hidden="true" />
          <span className="text-xs font-medium tracking-wide text-grounded uppercase">
            Grounded answer
          </span>
        </div>
        {isGenerating && (
          <span className="text-xs text-tertiary">generating...</span>
        )}
      </div>
      <p className="mt-1.5 text-sm leading-[1.7] text-body">
        {text}
        <SourceChips citations={citations} variant="inline" />
      </p>
    </div>
  );
}
