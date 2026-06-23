import { apiFetch } from "./client";
import type { DocumentsPage } from "@/types/document";

export async function getDocuments(
  limit: number,
  cursor?: string,
): Promise<DocumentsPage> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  return apiFetch<DocumentsPage>(`/kb/documents?${params.toString()}`);
}
