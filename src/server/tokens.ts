import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Random opaque token for cookies/links; only its hash is ever stored. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
