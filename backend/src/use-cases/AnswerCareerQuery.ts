import type { Answer, Citation, StreamEvent } from "../domain/entities.js";
import { checkInput } from "../domain/inputGuard.js";
import type { DocumentStore } from "../ports/DocumentStore.js";
import type { EmbeddingProvider } from "../ports/EmbeddingProvider.js";
import type { LlmProvider } from "../ports/LlmProvider.js";
import { ResponseCache } from "../ports/ResponseCache.js";
import type { RetrievedChunk, VectorStore } from "../ports/VectorStore.js";

const CONFIDENCE_THRESHOLD = 0.15;
const GROUNDED_MARKER = "GROUNDED:";
const SUGGESTED_MARKER = "SUGGESTED:";
// Longest marker length minus 1 chars must always be held back unflushed so a
// marker split across two streamed chunks is never partially emitted as content.
const SAFETY_MARGIN =
  Math.max(GROUNDED_MARKER.length, SUGGESTED_MARKER.length) - 1;

type PreparedAnswer =
  | { kind: "instant"; answer: Answer }
  | { kind: "needs-llm"; system: string; chunks: RetrievedChunk[] };

export class AnswerCareerQuery {
  constructor(
    private embedder: EmbeddingProvider,
    private store: VectorStore,
    private llm: LlmProvider,
    private cache: ResponseCache,
    private documentStore: DocumentStore,
    private maxQuestionTokens: number = 500,
    private maxAnswerTokens: number = 600,
  ) {}

  async execute(tenantId: string, question: string): Promise<Answer> {
    const prepared = await this.prepare(tenantId, question);
    if (prepared.kind === "instant") {
      return prepared.answer;
    }

    const raw = await this.llm.generate(
      prepared.system,
      question,
      this.maxAnswerTokens,
    );

    const answer = await this.buildAnswer(raw, prepared.chunks);
    await this.cache.set(tenantId, question, answer);
    return answer;
  }

  async *executeStream(
    tenantId: string,
    question: string,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const prepared = await this.prepare(tenantId, question);
    if (prepared.kind === "instant") {
      yield { type: "instant", answer: prepared.answer };
      return;
    }

    yield* this.streamSplitAnswer(prepared, tenantId, question);
  }

  // Shared guard → cache check → embed → search → confidence check, used by
  // both execute() and executeStream() so the two paths can never drift.
  private async prepare(
    tenantId: string,
    question: string,
  ): Promise<PreparedAnswer> {
    // 1. Guard (domain — no external calls)
    const guard = checkInput(question, this.maxQuestionTokens);
    if (!guard.ok) {
      throw new Error(guard.reason);
    }

    // 2. Cache check
    const cached = await this.cache.get(tenantId, question);
    if (cached) return { kind: "instant", answer: cached };

    // 3. Embed the question (port)
    const [queryVec] = await this.embedder.embed([question]);

    // 4. Retrieve top-k chunks scoped to this tenant (port)
    const chunks = await this.store.hybridSearch(
      tenantId,
      queryVec,
      question,
      3,
    );

    // 5. Confidence check
    const topScore = chunks[0]?.score ?? 0;
    if (topScore < CONFIDENCE_THRESHOLD) {
      return {
        kind: "instant",
        answer: {
          grounded:
            "I don't have enough information in the knowledge base to answer this confidently.",
          suggested: "",
          citations: [],
        },
      };
    }

    // 6. Build the two-layer prompt
    const context = chunks.length
      ? chunks.map((c) => c.text).join("\n")
      : "(no relevant entries found in this knowledge base)";

    const system = `You are a career copilot. Use ONLY the CONTEXT below to answer.

        CONTEXT:
        ${context}

        Respond in exactly this format, nothing else:

        GROUNDED:
        (2-3 sentences answering from the context only)

        SUGGESTED:
        (2-3 sentences suggesting adjacent technologies or roles based on the context)

        Do not explain your reasoning. Do not repeat the rules. Just answer directly.`;

    return { kind: "needs-llm", system, chunks };
  }

  private async buildAnswer(
    raw: string,
    chunks: RetrievedChunk[],
  ): Promise<Answer> {
    const grounded = this.extractSection(raw, GROUNDED_MARKER);
    const suggested = this.extractSection(raw, SUGGESTED_MARKER);

    return {
      grounded: grounded || raw,
      suggested: suggested || "",
      citations: await this.toCitations(chunks),
    };
  }

  // Citations need the document title for the frontend's sources footer —
  // looked up here (not stored on the chunk) so the chunks table doesn't
  // need to duplicate document metadata. At most 3 lookups (top-3 search).
  private async toCitations(chunks: RetrievedChunk[]): Promise<Citation[]> {
    const uniqueDocumentIds = [...new Set(chunks.map((c) => c.documentId))];
    const documents = await Promise.all(
      uniqueDocumentIds.map((id) => this.documentStore.findById(id)),
    );
    const titleById = new Map(
      uniqueDocumentIds.map((id, i) => [id, documents[i]?.title]),
    );

    return chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      title: titleById.get(c.documentId) ?? "Unknown document",
      text: c.text,
      score: c.score,
    }));
  }

  // Consumes the raw LLM token stream and re-segments it into `grounded`
  // then `suggested` SSE events in real time, given the single raw stream
  // literally contains "GROUNDED:\n...\n\nSUGGESTED:\n...".
  private async *streamSplitAnswer(
    prepared: { system: string; chunks: RetrievedChunk[] },
    tenantId: string,
    question: string,
  ): AsyncGenerator<StreamEvent, void, unknown> {
    type Phase = "before-grounded" | "in-grounded" | "in-suggested";
    let phase: Phase = "before-grounded";
    let buffer = "";
    let groundedText = "";
    let suggestedText = "";

    for await (const token of this.llm.generateStream(
      prepared.system,
      question,
      this.maxAnswerTokens,
    )) {
      buffer += token;

      if (phase === "before-grounded") {
        const idx = buffer.indexOf(GROUNDED_MARKER);
        if (idx === -1) {
          // Could be a partial marker at the tail — hold back the safety
          // margin, discard anything older (nothing meaningful precedes
          // GROUNDED: in the prompt format).
          if (buffer.length > SAFETY_MARGIN) {
            buffer = buffer.slice(-SAFETY_MARGIN);
          }
          continue;
        }
        buffer = buffer
          .slice(idx + GROUNDED_MARKER.length)
          .replace(/^\n/, "");
        phase = "in-grounded";
        // Deliberate fallthrough into "in-grounded" below — a single chunk
        // can contain the entire "GROUNDED:...SUGGESTED:..." string at once.
      }

      if (phase === "in-grounded") {
        const idx = buffer.indexOf(SUGGESTED_MARKER);
        if (idx === -1) {
          if (buffer.length > SAFETY_MARGIN) {
            const flush = buffer.slice(0, buffer.length - SAFETY_MARGIN);
            buffer = buffer.slice(buffer.length - SAFETY_MARGIN);
            if (flush) {
              groundedText += flush;
              yield { type: "grounded", text: flush };
            }
          }
          continue;
        }
        const finalGroundedChunk = buffer.slice(0, idx);
        if (finalGroundedChunk) {
          groundedText += finalGroundedChunk;
          yield { type: "grounded", text: finalGroundedChunk };
        }
        buffer = buffer
          .slice(idx + SUGGESTED_MARKER.length)
          .replace(/^\n/, "");
        phase = "in-suggested";
        // Deliberate fallthrough into "in-suggested" below, same reason.
      }

      if (phase === "in-suggested") {
        if (buffer) {
          suggestedText += buffer;
          yield { type: "suggested", text: buffer };
          buffer = "";
        }
      }
    }

    // End of stream — flush whatever's left in buffer per current phase.
    if (phase === "before-grounded") {
      // LLM never emitted "GROUNDED:" at all — treat the whole buffer as
      // grounded content rather than silently dropping it.
      if (buffer) {
        groundedText += buffer;
        yield { type: "grounded", text: buffer };
      }
    } else if (phase === "in-grounded") {
      // LLM never emitted "SUGGESTED:" — flush the held-back safety margin
      // as grounded content, matching extractSection's -1 fallback today.
      if (buffer) {
        groundedText += buffer;
        yield { type: "grounded", text: buffer };
      }
    } else if (buffer) {
      suggestedText += buffer;
      yield { type: "suggested", text: buffer };
    }

    const citations = await this.toCitations(prepared.chunks);
    yield { type: "citations", citations };
    yield { type: "done" };

    const answer: Answer = {
      grounded: groundedText || "(no answer generated)",
      suggested: suggestedText,
      citations,
    };
    await this.cache.set(tenantId, question, answer);
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
