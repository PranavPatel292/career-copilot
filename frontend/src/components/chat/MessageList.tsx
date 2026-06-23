import { useEffect, useRef } from "react";

import { BotMessage } from "./BotMessage";
import type { Message } from "@/types/chat";
import { UserMessage } from "./UserMessage";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex w-full ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          {message.role === "user" ? (
            <UserMessage question={message.question ?? ""} />
          ) : (
            <BotMessage message={message} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
