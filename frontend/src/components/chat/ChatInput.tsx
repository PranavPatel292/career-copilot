import { useState } from "react";
import { IconArrowUp, IconPlayerStop } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_QUESTION_LENGTH } from "@/lib/validators";

interface ChatInputProps {
  onSend: (question: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  error: string | null;
}

export function ChatInput({ onSend, onStop, isStreaming, error }: ChatInputProps) {
  const [value, setValue] = useState("");

  const isEmpty = value.trim().length === 0;
  const isOverLimit = value.length > MAX_QUESTION_LENGTH;
  const sendDisabled = !isStreaming && (isEmpty || isOverLimit);

  function handleSubmit() {
    if (sendDisabled) return;
    onSend(value);
    setValue("");
  }

  return (
    <div>
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about experience, skills, projects..."
          aria-label="Ask a question"
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <Button
          type="button"
          size="icon"
          aria-label={isStreaming ? "Stop generating" : "Send"}
          disabled={sendDisabled}
          onClick={isStreaming ? onStop : handleSubmit}
          className={cn(
            "size-8 shrink-0 rounded-full",
            sendDisabled
              ? "bg-disabled-bg text-tertiary"
              : "bg-primary text-primary-foreground",
          )}
        >
          {isStreaming ? (
            <IconPlayerStop className="size-4" />
          ) : (
            <IconArrowUp className="size-4" />
          )}
        </Button>
      </div>
      {(error || isOverLimit) && (
        <p className="mt-1.5 px-1 text-xs text-status-failed-text">
          {error ??
            `Question is too long. Please keep it under ${MAX_QUESTION_LENGTH} characters.`}
        </p>
      )}
    </div>
  );
}
