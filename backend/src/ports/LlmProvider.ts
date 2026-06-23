export interface LlmProvider {
  generate(
    system: string,
    question: string,
    maxTokens: number,
  ): Promise<string>;

  generateStream(
    system: string,
    question: string,
    maxTokens: number,
  ): AsyncGenerator<string, void, unknown>;
}
