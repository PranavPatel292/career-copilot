import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

// Library-based profanity detection
const profanityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

// Custom additions — things the library might miss
const CUSTOM_BLOCKED: string[] = [
  // add any domain-specific blocked terms here
];

// Injection patterns — these stay manual, no library covers this
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|your)\s+(instructions|rules|prompts)/i,
  /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions|rules)/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you\s+are|to\s+be)\s+/i,
  /reveal\s+(your|the)\s+(system|hidden|secret)\s+(prompt|instructions)/i,
  /dump\s+(the\s+)?(context|prompt|system)/i,
];

export function checkInput(text: string, maxTokens: number): GuardResult {
  // 1. Length check
  const wordCount = text.split(/\s+/).length;
  if (wordCount > maxTokens) {
    return {
      ok: false,
      reason: `Question too long (${wordCount} words, max ${maxTokens})`,
    };
  }

  // 2. Injection check
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        ok: false,
        reason: "Input rejected: potential prompt injection",
      };
    }
  }

  // 3. Profanity — library first
  if (profanityMatcher.hasMatch(text)) {
    return { ok: false, reason: "Input rejected: inappropriate language" };
  }

  // 4. Custom blocked terms
  const lower = text.toLowerCase();
  for (const term of CUSTOM_BLOCKED) {
    if (lower.includes(term)) {
      return { ok: false, reason: "Input rejected: blocked content" };
    }
  }

  return { ok: true };
}
