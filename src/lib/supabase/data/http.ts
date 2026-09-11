import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { createOptionalServerClient } from "@/lib/supabase/server";

const JSON_LIMIT_BYTES = 128 * 1024;

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

export interface AuthContext {
  client: SupabaseClient;
  user: User;
}

function responseHeaders(): HeadersInit {
  return {
    "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    "X-Content-Type-Options": "nosniff",
  };
}

export function json(data: unknown, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_key, value: unknown) => typeof value === "bigint" ? value.toString() : value);
  const headers = new Headers(init?.headers);
  for (const [key, value] of Object.entries(responseHeaders())) headers.set(key, value);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new NextResponse(body, { ...init, headers });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: responseHeaders() });
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message } }, { status: error.status });
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String(error.code);
    const message = "message" in error ? String(error.message) : "";
    if (code === "PGRST116" || code === "P0002") return json({ error: { code: "not_found", message: "Resource not found" } }, { status: 404 });
    if (code === "23505" || code === "23503" && /attachment objects/i.test(message)) {
      return json({ error: { code: "conflict", message: "Resource conflicts with existing data" } }, { status: 409 });
    }
    if (["22001", "23503", "23514", "22P02"].includes(code)) return json({ error: { code: "invalid_data", message: "Database rejected the supplied data" } }, { status: 422 });
    if (code === "42501") return json({ error: { code: "forbidden", message: "Operation is not permitted" } }, { status: 403 });
  }
  return json({ error: { code: "internal_error", message: "Request could not be completed" } }, { status: 500 });
}

export function assertMutationOrigin(request: Request): void {
  const requestOrigin = new URL(request.url).origin.toLowerCase();
  const origin = request.headers.get("origin")?.toLowerCase();
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestOrigin) || fetchSite === "cross-site") {
    throw new ApiError(403, "cross_site_request", "Cross-site mutation rejected");
  }
}

export async function authenticate(): Promise<AuthContext> {
  const result = createOptionalServerClient(await cookies());
  if (!result.configured) throw new ApiError(503, "supabase_not_configured", "Data service is unavailable");
  const { data, error } = await result.client.auth.getUser();
  if (error || !data.user) throw new ApiError(401, "unauthorized", "Authentication required");
  return { client: result.client, user: data.user };
}

export async function withAuth(
  request: Request,
  handler: (context: AuthContext) => Promise<Response>,
  options: { mutation?: boolean } = {},
): Promise<Response> {
  try {
    if (options.mutation) assertMutationOrigin(request);
    return await handler(await authenticate());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function parseJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const type = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (type !== "application/json") throw new ApiError(415, "unsupported_media_type", "Expected application/json");
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > JSON_LIMIT_BYTES) throw new ApiError(413, "payload_too_large", "JSON body is too large");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > JSON_LIMIT_BYTES) throw new ApiError(413, "payload_too_large", "JSON body is too large");
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new ApiError(400, "invalid_json", "Malformed JSON body"); }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new ApiError(422, "validation_failed", parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; "));
  }
  return parsed.data;
}

export function throwIfError(error: unknown): asserts error is null {
  if (error) throw error;
}
