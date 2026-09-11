import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeOnboardingDestination } from "@/components/onboarding/model";
import { createOptionalServerClient } from "@/lib/supabase/server";

function destinationFrom(url: URL): string {
  const requested = url.searchParams.get("next");
  if (requested === "/reset-password") return "/reset-password";
  return safeOnboardingDestination(requested);
}

function errorRedirect(url: URL, code: string, recovery: boolean): NextResponse {
  const destination = new URL(recovery ? "/forgot-password" : "/login", url.origin);
  destination.searchParams.set("auth_error", code);
  return NextResponse.redirect(destination, 303);
}

function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = destinationFrom(requestUrl);
  const isRecovery = next === "/reset-password";
  const code = requestUrl.searchParams.get("code");

  if (!code || requestUrl.searchParams.has("error")) {
    return noStore(errorRedirect(requestUrl, "callback_invalid", isRecovery));
  }

  const result = createOptionalServerClient(await cookies());
  if (!result.configured) {
    return noStore(errorRedirect(requestUrl, "config_missing", isRecovery));
  }

  const { error } = await result.client.auth.exchangeCodeForSession(code);
  if (error) {
    return noStore(errorRedirect(requestUrl, "callback_failed", isRecovery));
  }

  return noStore(NextResponse.redirect(new URL(next, requestUrl.origin), 303));
}
