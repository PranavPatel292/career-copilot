export interface SseFrame {
  event: string;
  data: string;
}

// Manual SSE frame parser over a fetch() ReadableStream. Needed for /query:
// EventSource can't send POST bodies or a custom Accept header, which /query
// requires, so the stream has to be read by hand instead.
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseFrame> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawFrame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const frame = parseFrame(rawFrame);
      if (frame) yield frame;
    }
  }
}

function parseFrame(raw: string): SseFrame | null {
  let event = "";
  const dataLines: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith(":")) continue; // comment (heartbeat/connected)
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!event && dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

// EventSource wrapper for /kb/events: that endpoint is a plain GET with no
// special headers, so the native EventSource API (with its built-in
// reconnection) works directly, unlike /query.
export function subscribeToEventSource(
  url: string,
  handlers: Record<string, (data: unknown) => void>,
): () => void {
  const source = new EventSource(url);

  for (const [eventName, handler] of Object.entries(handlers)) {
    source.addEventListener(eventName, (event) => {
      handler(JSON.parse((event as MessageEvent<string>).data));
    });
  }

  return () => source.close();
}
