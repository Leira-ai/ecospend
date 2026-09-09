import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

export type BrowserClientResult =
  | { configured: true; client: SupabaseClient }
  | { configured: false; message: string };

let browserClient: SupabaseClient | undefined;

export function createOptionalBrowserClient(): BrowserClientResult {
  const result = getSupabasePublicConfig();

  if (!result.configured) {
    return result;
  }

  browserClient ??= createBrowserClient(
    result.config.url,
    result.config.anonKey,
  );

  return { configured: true, client: browserClient };
}
