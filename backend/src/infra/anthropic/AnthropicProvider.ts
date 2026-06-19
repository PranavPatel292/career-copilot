import Anthropic from "@anthropic-ai/sdk";
import { LlmProvider } from "../../ports/LlmProvider";

export class AnthropicProvider implements LlmProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(
    system: string,
    question: string,
    maxTokens: number,
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: question }],
    });

    return response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  }
}
