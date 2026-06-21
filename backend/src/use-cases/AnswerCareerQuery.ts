import type { Answer } from "../domain/entities.js";
import { checkInput } from "../domain/inputGuard.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { LlmProvider } from "../ports/LlmProvider.js";
import { ResponseCache } from "../ports/ResponseCache.js";
import type { VectorStore } from "../ports/VectorStore.js";

export class AnswerCareerQuery {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
    private llm: LlmProvider,
    private cache: ResponseCache,
    private maxQuestionTokens: number = 500,
    private maxAnswerTokens: number = 600,
  ) {}

  async execute(tenantId: string, question: string): Promise<Answer> {
    const CONFIDENCE_THRESHOLD = 0.15;

    // 1. Guard (domain — no external calls)
    const guard = checkInput(question, this.maxQuestionTokens);
    if (!guard.ok) {
      throw new Error(guard.reason);
    }

    // 2. Cache check
    const cached = await this.cache.get(tenantId, question);
    if (cached) return cached;

    // 3. Embed the question (port)
    const [queryVec] = await this.embedder.embed([question]);

    // 4. Retrieve top-k chunks scoped to this tenant (port)
    const chunks = await this.store.search(tenantId, queryVec, 3);

    // 5. Build the two-layer prompt
    const context = chunks.length
      ? chunks.map((c) => c.text).join("\n")
      : "(no relevant entries found in this knowledge base)";

    // TODO: don't run the step 2 of calling LLM if no info found in KB. Instead,
    // we can run the KB again with some modification of the search and if that fails return
    // data to user without doing anything else.
    const topScore = chunks[0]?.score ?? 0;
    if (topScore < CONFIDENCE_THRESHOLD) {
      return {
        grounded:
          "I don't have enough information in the knowledge base to answer this confidently.",
        suggested: "",
        citations: [],
      };
    }

    const system = `You are a career copilot. Use ONLY the CONTEXT below to answer.

        CONTEXT:
        ${context}

        Respond in exactly this format, nothing else:

        GROUNDED:
        (2-3 sentences answering from the context only)

        SUGGESTED:
        (2-3 sentences suggesting adjacent technologies or roles based on the context)

        Do not explain your reasoning. Do not repeat the rules. Just answer directly.`;

    // 6. Generate (port — doesn't know if it's Ollama or Claude)
    const raw = await this.llm.generate(system, question, this.maxAnswerTokens);

    // 7. Parse into structured answer
    const grounded = this.extractSection(raw, "GROUNDED:");
    const suggested = this.extractSection(raw, "SUGGESTED:");

    return {
      grounded: grounded || raw,
      suggested: suggested || "",
      citations: chunks.map((c) => ({
        chunkId: c.chunkId,
        documentId: c.documentId,
        text: c.text,
        score: c.score,
      })),
    };
  }

  private extractSection(text: string, header: string): string {
    const idx = text.indexOf(header);
    if (idx === -1) return "";

    const after = text.slice(idx + header.length);
    // Take everything until the next section header or end
    const nextHeader = after.search(/\n[A-Z]+:/);
    const section = nextHeader === -1 ? after : after.slice(0, nextHeader);
    return section.trim();
  }
}
