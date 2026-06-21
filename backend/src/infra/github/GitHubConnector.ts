import { Octokit } from "@octokit/rest";

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  updatedAt: string;
  readmeContent: string | null;
}

export class GitHubConnector {
  private client: Octokit;
  private isAuthenticated: boolean;

  constructor(token?: string) {
    this.client = new Octokit(token ? { auth: token } : {});
    this.isAuthenticated = !!token;
  }

  async fetchRepos(username: string): Promise<GitHubRepo[]> {
    const repos = this.isAuthenticated
      ? await this.client.paginate(this.client.repos.listForAuthenticatedUser, {
          type: "owner",
          sort: "updated",
          per_page: 100,
        })
      : (
          await this.client.repos.listForUser({
            username,
            type: "owner",
            sort: "updated",
            per_page: 100,
          })
        ).data;

    // Filter: skip forks, archived, empty
    const eligible = repos.filter(
      (r) => !r.fork && !r.archived && (r.size ?? 0) > 0,
    );

    const results: GitHubRepo[] = [];

    for (const repo of eligible) {
      const readme = await this.fetchReadme(username, repo.name);

      results.push({
        name: repo.name,
        description: repo.description,
        language: repo.language ? repo.language : null,
        topics: repo.topics ?? [],
        stars: repo.stargazers_count ?? 0,
        updatedAt: repo.updated_at ?? "",
        readmeContent: readme,
      });
    }

    return results;
  }

  private async fetchReadme(
    owner: string,
    repo: string,
  ): Promise<string | null> {
    try {
      const { data } = await this.client.repos.getReadme({
        owner,
        repo,
        mediaType: { format: "raw" },
      });
      return typeof data === "string" ? data : null;
    } catch {
      // No README exists — skip, don't fail
      return null;
    }
  }
}
