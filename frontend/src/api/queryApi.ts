import { apiUrl } from "./client";
import { parseSseStream } from "@/lib/sse";
import type { Answer, StreamEvent } from "@/types/chat";

export async function* askQuestionStream(
  question: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const response = await fetch(apiUrl("/query"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ question }),
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : "Request failed";
    throw new Error(message);
  }

  // Cache hit or low-confidence refusal: the server sends plain JSON (the
  // Answer shape directly) even though we asked for text/event-stream.
  if (contentType.includes("application/json")) {
    const answer = (await response.json()) as Answer;
    yield { type: "instant", answer };
    return;
  }

  if (!response.body) {
    throw new Error("Empty stream");
  }

  for await (const frame of parseSseStream(response.body)) {
    const data = frame.data ? JSON.parse(frame.data) : {};
    yield { type: frame.event, ...data } as StreamEvent;
  }
}
