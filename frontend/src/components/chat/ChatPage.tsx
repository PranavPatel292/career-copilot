import { IconBriefcase } from "@tabler/icons-react";
import { useChat } from "@/hooks/useChat";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

const STARTER_QUESTIONS = [
  "What backend technologies does Pranav work with?",
  "Tell me about a recent project",
  "What's his experience with system design?",
];

export function ChatPage() {
  const { messages, sendMessage, stopStreaming, isStreaming, inputError } =
    useChat();

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] max-w-2xl flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-chip-bg">
            <IconBriefcase className="size-6 text-chip-text" aria-hidden="true" />
          </span>
          <div>
            <p className="text-base font-medium text-foreground">
              Career Copilot
            </p>
            <p className="text-xs text-tertiary">
              Ask me anything about Pranav&apos;s experience
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {STARTER_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
      )}
      <div className="px-6 py-4">
        <ChatInput
          onSend={sendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          error={inputError}
        />
      </div>
    </div>
  );
}
