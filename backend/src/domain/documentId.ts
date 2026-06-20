import { createHash } from "crypto";

export function deriveDocumentId(tenantId: string, title: string): string {
  return createHash("sha256")
    .update(`${tenantId}:${title}`)
    .digest("hex")
    .slice(0, 32);
}
