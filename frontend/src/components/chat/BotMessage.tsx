import { IconBolt, IconBriefcase, IconInfoCircle } from "@tabler/icons-react";

import { CopilotTake } from "./CopilotTake";
import { GroundedSection } from "./GroundedSection";
import { LoadingDots } from "@/components/shared/LoadingDots";
import type { Message } from "@/types/chat";
import { SourceChips } from "./SourceChips";

interface BotMessageProps {
  message: Message;
}

export function BotMessage({ message }: BotMessageProps) {
  const hasContent = Boolean(message.grounded) || Boolean(message.error);

  // Gap between sending and the first SSE event (InputGuard -> cache check
  // -> embed -> hybrid search) — no content to show yet, so render a
  // generic loading state instead of an empty message card.
  if (message.isStreaming && !hasContent) {
    return <LoadingDots />;
  }

  // isCacheHit/isLowConfidence are only ever set on the "instant" branch —
  // a normal streaming answer always has a suggested section coming.
  const expectsSuggested = !message.isCacheHit && !message.isLowConfidence;
  const isGroundedPhase = Boolean(message.isStreaming) && !message.suggested;
  const showCopilotTake =
    Boolean(message.suggested) ||
    (expectsSuggested && Boolean(message.isStreaming));

  return (
    <div className="max-w-[90%] rounded-xl border border-border bg-card px-5 py-4">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chip-bg">
            <IconBriefcase
              className="size-3.5 text-chip-text"
              aria-hidden="true"
            />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Career Copilot
            </p>
            <p className="text-xs text-tertiary">
              RAG-powered career assistant
            </p>
          </div>
        </div>
        {message.isCacheHit && (
          <IconBolt
            className="size-4 text-tertiary"
            aria-label="Cached answer"
          />
        )}
        {message.isLowConfidence && (
          <IconInfoCircle
            className="size-4 text-tertiary"
            aria-label="Low confidence answer"
          />
        )}
      </div>

      {message.error ? (
        <p className="text-sm text-status-failed-text">{message.error}</p>
      ) : (
        <>
          <GroundedSection
            text={message.grounded ?? ""}
            citations={message.citations ?? []}
            isGenerating={isGroundedPhase}
          />
          {showCopilotTake && (
            <CopilotTake
              text={message.suggested ?? ""}
              isPending={isGroundedPhase}
            />
          )}
          {(message.citations?.length ?? 0) > 0 && (
            <div className="mt-3.5 border-t border-border pt-3">
              <p className="mb-1.5 text-xs text-tertiary">Sources</p>
              <SourceChips
                citations={message.citations ?? []}
                variant="footer"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
