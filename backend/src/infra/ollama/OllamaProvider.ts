import { LlmProvider } from "../../ports/LlmProvider";

export class OllamaProvider implements LlmProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl = "http://localhost:11434", model = "qwen3:4b") {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async generate(
    system: string,
    question: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
        stream: false,
        think: false,
        options: { num_predict: maxTokens },
      }),
    });

    const data = await response.json();
    // console.log("Ollama raw:", JSON.stringify(data, null, 2));
    return data.message.content;
  }

  async *generateStream(
    system: string,
    question: string,
    maxTokens: number,
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
        stream: true,
        think: false,
        options: { num_predict: maxTokens },
      }),
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Ollama NDJSON: one JSON object per line, but a chunk boundary can
      // land mid-line — split on \n and keep the trailing partial line buffered.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parsed = JSON.parse(trimmed);
        if (parsed.message?.content) {
          yield parsed.message.content;
        }
        if (parsed.done) return;
      }
    }

    const trimmed = buffer.trim();
    if (trimmed) {
      const parsed = JSON.parse(trimmed);
      if (parsed.message?.content) yield parsed.message.content;
    }
  }
}
