import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { importFromGitHub } from "@/api/ingestApi";
import { validateGitHubToken, validateGitHubUsername } from "@/lib/validators";
import { kbDocumentsQueryKey } from "./useKnowledgeBase";

export function useGitHubImport() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      username,
      token,
    }: {
      username: string;
      token?: string;
    }) => {
      const usernameCheck = validateGitHubUsername(username);
      if (!usernameCheck.valid) throw new Error(usernameCheck.error);
      if (token) {
        const tokenCheck = validateGitHubToken(token);
        if (!tokenCheck.valid) throw new Error(tokenCheck.error);
      }
      return importFromGitHub(username, token);
    },
    onSuccess: (response) => {
      // The import response has no documentId (unlike upload), so there's
      // nothing to optimistically insert — refetch instead.
      queryClient.invalidateQueries({ queryKey: kbDocumentsQueryKey });

      for (const skipped of response.skipped) {
        toast.info(`${skipped.repo}: ${skipped.reason}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "GitHub import failed");
    },
  });

  return {
    importRepos: mutation.mutate,
    isImporting: mutation.isPending,
  };
}
