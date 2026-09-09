import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding, safeOnboardingDestination } from "@/components/onboarding/model";
import { getSupabasePublicConfig } from "./config";

const authPages = new Set(["/login", "/register", "/forgot-password"]);
const protectedPrefixes = ["/dashboard"];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function requestedDashboardDestination(request: NextRequest): string {
  const pathAndQuery = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  return safeOnboardingDestination(pathAndQuery);
}

export function onboardingRedirectFor(
  request: NextRequest,
  state: { authenticated: boolean; profileExists: boolean; complete: boolean },
): URL | null {
  const pathname = request.nextUrl.pathname;
  const isDemoDashboard = isProtectedPath(pathname) && request.nextUrl.searchParams.get("demo") === "1";
  if (!state.authenticated || isDemoDashboard) return null;
  if (isProtectedPath(pathname) && (!state.profileExists || !state.complete)) {
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("next", requestedDashboardDestination(request));
    return onboardingUrl;
  }
  if (pathname === "/onboarding" && state.profileExists && state.complete) {
    return new URL(safeOnboardingDestination(request.nextUrl.searchParams.get("next")), request.url);
  }
  return null;
}

function copySessionCookies(source: NextResponse, target: NextResponse): NextResponse {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const configuration = getSupabasePublicConfig();
  if (!configuration.configured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    configuration.config.url,
    configuration.config.anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;
  const isDemoDashboard = isProtectedPath(pathname) && request.nextUrl.searchParams.get("demo") === "1";

  if (isProtectedPath(pathname) && !isDemoDashboard && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("auth_required", "1");
    return copySessionCookies(response, NextResponse.redirect(loginUrl, 303));
  }

  if (isAuthenticated && (isProtectedPath(pathname) || pathname === "/onboarding")) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData.user) {
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle();
      const profileExists = Boolean(profile);
      const isComplete = Boolean(profile?.display_name) && hasCompletedOnboarding(userData.user.user_metadata);
      const onboardingRedirect = onboardingRedirectFor(request, {
        authenticated: true,
        profileExists,
        complete: isComplete,
      });
      if (onboardingRedirect) {
        return copySessionCookies(response, NextResponse.redirect(onboardingRedirect, 303));
      }
    }
  }

  if (authPages.has(pathname) && isAuthenticated) {
    return copySessionCookies(response, NextResponse.redirect(new URL("/dashboard", request.url), 303));
  }

  return response;
}
