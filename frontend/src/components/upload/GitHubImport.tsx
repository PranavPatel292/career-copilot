import { useState } from "react";
import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateGitHubToken, validateGitHubUsername } from "@/lib/validators";

interface GitHubImportProps {
  onImport: (username: string, token?: string) => void;
  isImporting: boolean;
}

export function GitHubImport({ onImport, isImporting }: GitHubImportProps) {
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    const usernameCheck = validateGitHubUsername(username);
    if (!usernameCheck.valid) {
      setError(usernameCheck.error ?? null);
      return;
    }
    if (token) {
      const tokenCheck = validateGitHubToken(token);
      if (!tokenCheck.valid) {
        setError(tokenCheck.error ?? null);
        return;
      }
    }
    setError(null);
    onImport(username, token || undefined);
  }

  return (
    <div className="rounded-xl bg-secondary px-4 py-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <IconBrandGithub className="size-4 text-foreground" aria-hidden="true" />
        <span className="text-[13px] font-medium text-foreground">
          Import from GitHub
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="GitHub username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="PAT (optional)"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="flex-1"
        />
        <Button onClick={handleImport} disabled={isImporting}>
          Import
        </Button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-status-failed-text">{error}</p>
      )}
    </div>
  );
}
