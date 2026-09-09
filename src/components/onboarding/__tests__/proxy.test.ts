import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { onboardingRedirectFor } from "@/lib/supabase/proxy";

describe("onboarding proxy routing", () => {
  it("sends an incomplete authenticated user to onboarding and preserves a safe dashboard path", () => {
    const request = new NextRequest("https://ecospend.test/dashboard/transaksi?new=1");
    const result = onboardingRedirectFor(request, { authenticated: true, profileExists: true, complete: false });
    expect(result?.pathname).toBe("/onboarding");
    expect(result?.searchParams.get("next")).toBe("/dashboard/transaksi?new=1");
  });

  it("treats a missing profile as incomplete", () => {
    const request = new NextRequest("https://ecospend.test/dashboard");
    expect(onboardingRedirectFor(request, { authenticated: true, profileExists: false, complete: false })?.pathname).toBe("/onboarding");
  });

  it("keeps demo mode accessible without an onboarding loop", () => {
    const request = new NextRequest("https://ecospend.test/dashboard?demo=1");
    expect(onboardingRedirectFor(request, { authenticated: true, profileExists: false, complete: false })).toBeNull();
  });

  it("routes completed users away from onboarding and rejects external destinations", () => {
    const request = new NextRequest("https://ecospend.test/onboarding?next=https%3A%2F%2Fevil.test");
    expect(onboardingRedirectFor(request, { authenticated: true, profileExists: true, complete: true })?.href).toBe("https://ecospend.test/dashboard");
  });

  it("does not redirect guests from onboarding", () => {
    const request = new NextRequest("https://ecospend.test/onboarding");
    expect(onboardingRedirectFor(request, { authenticated: false, profileExists: false, complete: false })).toBeNull();
  });
});
