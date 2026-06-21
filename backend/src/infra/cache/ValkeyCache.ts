import IOValkey from "iovalkey";
import type { Answer } from "../../domain/entities.js";
import type { ResponseCache } from "../../ports/ResponseCache.js";

export class ValkeyCache implements ResponseCache {
  private client: IOValkey;
  private ttl: number;

  constructor(valkeyUrl: string, ttlSeconds = 3600) {
    this.client = new IOValkey(valkeyUrl);
    this.ttl = ttlSeconds;
  }

  async get(tenantId: string, question: string): Promise<Answer | null> {
    const version = await this.getVersion(tenantId);
    const key = this.buildKey(tenantId, question, version);
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(tenantId: string, question: string, answer: Answer): Promise<void> {
    const version = await this.getVersion(tenantId);
    const key = this.buildKey(tenantId, question, version);
    await this.client.set(key, JSON.stringify(answer), "EX", this.ttl);
  }

  async invalidate(tenantId: string): Promise<void> {
    await this.client.incr(`kb_version:${tenantId}`);
  }

  private async getVersion(tenantId: string): Promise<string> {
    const version = await this.client.get(`kb_version:${tenantId}`);
    return version ?? "0";
  }

  private buildKey(
    tenantId: string,
    question: string,
    version: string,
  ): string {
    const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
    return `answer:${tenantId}:v${version}:${normalized}`;
  }
}
