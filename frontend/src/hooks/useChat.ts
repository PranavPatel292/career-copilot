import { useCallback, useRef, useState } from "react";
import { askQuestionStream } from "@/api/queryApi";
import { validateChatInput } from "@/lib/validators";
import type { Message } from "@/types/chat";

function createId(): string {
  return Math.random().toString(36).slice(2);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (question: string) => {
    const validation = validateChatInput(question);
    if (!validation.valid) {
      setInputError(validation.error ?? null);
      return;
    }
    setInputError(null);

    const userMessage: Message = { id: createId(), role: "user", question };
    const botMessageId = createId();
    const botMessage: Message = {
      id: botMessageId,
      role: "bot",
      grounded: "",
      suggested: "",
      citations: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);

    const controller = new AbortController();
    abortRef.current = controller;

    const patchBotMessage = (patch: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === botMessageId ? { ...m, ...patch } : m)),
      );
    };

    const appendBotMessage = (
      field: "grounded" | "suggested",
      text: string,
    ) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? { ...m, [field]: (m[field] ?? "") + text }
            : m,
        ),
      );
    };

    try {
      for await (const event of askQuestionStream(
        question,
        controller.signal,
      )) {
        switch (event.type) {
          case "instant": {
            const isLowConfidence =
              event.answer.suggested === "" &&
              event.answer.citations.length === 0;
            patchBotMessage({
              grounded: event.answer.grounded,
              suggested: event.answer.suggested,
              citations: event.answer.citations,
              isStreaming: false,
              isCacheHit: !isLowConfidence,
              isLowConfidence,
            });
            break;
          }
          case "grounded":
            appendBotMessage("grounded", event.text);
            break;
          case "suggested":
            appendBotMessage("suggested", event.text);
            break;
          case "citations":
            patchBotMessage({ citations: event.citations });
            break;
          case "done":
            patchBotMessage({ isStreaming: false });
            break;
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        patchBotMessage({ isStreaming: false });
        return;
      }
      patchBotMessage({
        isStreaming: false,
        error: (error as Error).message || "Something went wrong",
      });
    } finally {
      abortRef.current = null;
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    sendMessage,
    stopStreaming,
    isStreaming: messages.some((m) => m.isStreaming),
    inputError,
  };
}
