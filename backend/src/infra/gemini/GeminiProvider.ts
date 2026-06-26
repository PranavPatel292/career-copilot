import { GoogleGenAI } from "@google/genai";
import { LlmProvider } from "../../ports/LlmProvider";

export class GeminiProvider implements LlmProvider {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model = "gemini-2.5-flash") {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async generate(
    system: string,
    question: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: question,
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
      },
    });

    return response.text ?? "";
  }

  async *generateStream(
    system: string,
    question: string,
    maxTokens: number,
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.models.generateContentStream({
      model: this.model,
      contents: question,
      config: {
        systemInstruction: system,
        maxOutputTokens: maxTokens,
      },
    });

    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
  }
}
