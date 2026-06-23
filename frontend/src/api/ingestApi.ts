import { apiFetch } from "./client";
import type {
  DeleteResponse,
  GitHubImportResponse,
  UploadResponse,
} from "@/types/api";

export async function uploadDocuments(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }
  return apiFetch<UploadResponse>("/ingest/upload", {
    method: "POST",
    body: formData,
  });
}

export async function importFromGitHub(
  username: string,
  token?: string,
): Promise<GitHubImportResponse> {
  return apiFetch<GitHubImportResponse>("/ingest/github", {
    method: "POST",
    body: JSON.stringify({ username, token }),
  });
}

export async function deleteDocument(
  documentId: string,
): Promise<DeleteResponse> {
  return apiFetch<DeleteResponse>(`/ingest/${documentId}`, {
    method: "DELETE",
  });
}
