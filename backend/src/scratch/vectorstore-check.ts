import { randomUUID } from "crypto";
import { LocalEmbeddingProvider } from "../infra/LocalEmbeddingProvider.js";
import { PgVectorStore } from "../infra/db/PgVectorStore.js";

const embedder = new LocalEmbeddingProvider();
const store = new PgVectorStore();
const tenantId = "t_dev";
const docId = "doc_test";

// 1. Embed three chunks
const texts = [
  "3 years of React, Next.js, and React Native experience",
  "Built event-driven microservices with RabbitMQ and BullMQ",
  "AWS services: Lambda, S3, API Gateway, Cognito, Bedrock",
];
const embeddings = await embedder.embed(texts);

// 2. Upsert them into the store
const rows = texts.map((text, i) => ({
  id: randomUUID(),
  tenantId,
  documentId: docId,
  ordinal: i,
  text,
  embedding: embeddings[i],
}));
await store.upsert(rows);
console.log(`Inserted ${rows.length} chunks`);

// 3. Search — embed a question, find nearest chunks
const [queryVec] = await embedder.embed([
  "what frontend frameworks do you know?",
]);
const results = await store.search(tenantId, queryVec, 3);

console.log("\nSearch: 'what frontend frameworks do you know?'\n");
results.forEach((r, i) => {
  console.log(`${i + 1}. [score: ${r.score.toFixed(3)}] ${r.text}`);
});

process.exit(0);
