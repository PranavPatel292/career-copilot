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

  async *generateStream(
    system: string,
    question: string,
    maxTokens: number,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: question }],
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  }
}
