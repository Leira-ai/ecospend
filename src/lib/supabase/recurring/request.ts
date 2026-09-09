import { ApiError } from "@/lib/supabase/data/http";

export function assertRecurringGenerationOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    throw new ApiError(403, "cross_site_request", "Same-origin request required");
  }
}
