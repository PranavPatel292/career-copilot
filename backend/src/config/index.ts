import "dotenv/config";

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/career_copilot",
  valkeyUrl: process.env.VALKEY_URL ?? "redis://localhost:6379",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",

  embeddingProvider: (process.env.EMBEDDING_PROVIDER ?? "local") as
    | "local"
    | "voyage",
  llmProvider: (process.env.LLM_PROVIDER ?? "anthropic") as
    | "anthropic"
    | "ollama",
  ollamaUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",

  auth: { mode: (process.env.AUTH_MODE ?? "dev") as "dev" | "jwt" },
  rateLimit: {
    enabled: (process.env.RATE_LIMIT_ENABLED ?? "true") === "true",
    max: Number(process.env.RATE_LIMIT_MAX ?? 60),
    window: process.env.RATE_LIMIT_WINDOW ?? "1 minute",
  },
  limits: {
    maxQuestionTokens: Number(process.env.MAX_QUESTION_TOKENS ?? 500),
    maxAnswerTokens: Number(process.env.MAX_ANSWER_TOKENS ?? 600),
  },
} as const;
