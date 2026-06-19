import "dotenv/config";

import { LocalEmbeddingProvider } from "../infra/LocalEmbeddingProvider.js";
import { OllamaProvider } from "../infra/ollama/OllamaProvider.js";
// import { AnthropicProvider } from "../infra/anthropic/AnthropicProvider.js";
import { PgVectorStore } from "../infra/db/PgVectorStore.js";

const embedder = new LocalEmbeddingProvider();
const store = new PgVectorStore();
const llm = new OllamaProvider();

const tenantId = "t_dev";
const question = "What frontend frameworks do you know?";

// 1. Embed the question
const [queryVec] = await embedder.embed([question]);

// 2. Retrieve top-3 chunks from the store
const chunks = await store.search(tenantId, queryVec, 3);

console.log("--- Retrieved chunks ---");
chunks.forEach((c, i) =>
  console.log(`${i + 1}. [${c.score.toFixed(3)}] ${c.text}`),
);

// 3. Build the two-layer prompt
const context = chunks.map((c) => c.text).join("\n");
const system = `You are a career copilot. Answer using ONLY the CONTEXT below.

CONTEXT:
${context}

Respond in exactly this format, nothing else:

GROUNDED:
(2-3 sentences answering from the context only)

SUGGESTED:
(2-3 sentences suggesting adjacent technologies or roles based on the context)

Do not explain your reasoning. Do not repeat the rules. Just answer directly.`;

// 4. Ask the LLM
const answer = await llm.generate(system, question, 600);

console.log("\n--- Answer ---");
console.log(answer);

process.exit(0);
