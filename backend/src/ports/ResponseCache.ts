import type { Answer } from "../domain/entities.js";

export interface ResponseCache {
  get(tenantId: string, question: string): Promise<Answer | null>;
  set(tenantId: string, question: string, answer: Answer): Promise<void>;
  invalidate(tenantId: string): Promise<void>;
}
