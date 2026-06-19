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
}
