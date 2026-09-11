import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "./http";
import { IMPORT_PREVIEW_TTL_MS } from "@/lib/schemas/import";

interface PreviewClaim { userId: string; digest: string; expiresAt: number; nonce: string }

function tokenSecret(): string {
  const configured = process.env.IMPORT_TOKEN_SECRET;
  if (configured && configured.length >= 32) return configured;
  throw new ApiError(503, "import_unavailable", "Import preview tokens are unavailable");
}

export function canonicalDigest(rows: readonly unknown[]): string {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function createPreviewToken(userId: string, digest: string, now = Date.now()): string {
  const claim: PreviewClaim = { userId, digest, expiresAt: now + IMPORT_PREVIEW_TTL_MS, nonce: randomBytes(16).toString("hex") };
  const payload = encode(JSON.stringify(claim));
  const signature = createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyPreviewToken(token: string, userId: string, digest: string, now = Date.now()): void {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) throw new ApiError(422, "invalid_preview_token", "Invalid import preview token");
  const expected = createHmac("sha256", tokenSecret()).update(payload).digest();
  let received: Buffer;
  try { received = Buffer.from(signature, "base64url"); } catch { throw new ApiError(422, "invalid_preview_token", "Invalid import preview token"); }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new ApiError(422, "invalid_preview_token", "Invalid import preview token");
  let claim: PreviewClaim;
  try { claim = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PreviewClaim; }
  catch { throw new ApiError(422, "invalid_preview_token", "Invalid import preview token"); }
  if (claim.userId !== userId || claim.digest !== digest || claim.expiresAt < now) {
    throw new ApiError(422, "invalid_preview_token", "Import preview token is expired or does not match this payload");
  }
}
