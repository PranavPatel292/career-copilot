export interface LlmProvider {
  generate(
    system: string,
    question: string,
    maxTokens: number,
  ): Promise<string>;
}
