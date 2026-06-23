import {
  GitHubConnector,
  GitHubRepo,
} from "../infra/github/GitHubConnector.js";

import { deriveDocumentId } from "../domain/documentId.js";
import type { DocumentStore } from "../ports/DocumentStore.js";
import type { IngestionQueue } from "../ports/IngestionQueue.js";

export class ImportFromGitHub {
  constructor(
    private queue: IngestionQueue,
    private documentStore: DocumentStore,
  ) {}

  async execute(
    tenantId: string,
    username: string,
    token?: string,
  ): Promise<{
    imported: { repo: string; jobId: string }[];
    skipped: { repo: string; reason: string }[];
  }> {
    const github = new GitHubConnector(token);

    const repos = await github.fetchRepos(username);

    const imported: { repo: string; jobId: string }[] = [];
    const skipped: { repo: string; reason: string }[] = [];

    for (const repo of repos) {
      // Build a combined document: metadata + README
      const text = this.buildDocument(repo);

      if (!text || text.length < 50) {
        skipped.push({ repo: repo.name, reason: "Too little content" });
        continue;
      }

      const title = `github:${username}/${repo.name}`;
      const documentId = deriveDocumentId(tenantId, title);

      await this.documentStore.create({
        id: documentId,
        tenantId,
        title,
        source: "github",
      });

      const jobId = await this.queue.enqueue({
        tenantId,
        documentId,
        title,
        text,
      });

      await this.documentStore.updateStatus(documentId, "waiting", { jobId });

      imported.push({ repo: repo.name, jobId });
    }

    return { imported, skipped };
  }

  private buildDocument(repo: GitHubRepo): string {
    const parts: string[] = [];

    // Metadata section
    const meta = [
      `Project: ${repo.name}`,
      repo.description ? `Description: ${repo.description}` : null,
      repo.language ? `Primary language: ${repo.language}` : null,
      repo.topics.length ? `Topics: ${repo.topics.join(", ")}` : null,
      `Stars: ${repo.stars}`,
      `Last updated: ${repo.updatedAt}`,
    ]
      .filter(Boolean)
      .join("\n");

    parts.push(meta);

    // README content
    if (repo.readmeContent) {
      parts.push(repo.readmeContent);
    }

    return parts.join("\n\n");
  }
}
