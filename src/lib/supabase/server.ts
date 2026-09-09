import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export type ServerClientResult =
  | { configured: true; client: SupabaseClient }
  | { configured: false; message: string };

export function createOptionalServerClient(
  cookieStore: CookieStore,
): ServerClientResult {
  const result = getSupabasePublicConfig();

  if (!result.configured) {
    return result;
  }

  const client = createServerClient(result.config.url, result.config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });

  return { configured: true, client };
}
