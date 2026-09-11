import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createOptionalServerClient: vi.fn(() => ({
    configured: true,
    client: {
      auth: {
        exchangeCodeForSession: vi.fn(async (code: string) => {
          if (code === "valid-code") return { error: null };
          return { error: new Error("invalid code") };
        }),
      },
    },
  })),
}));

describe("auth callback route", () => {
  it("redirects to dashboard when no next parameter is provided", async () => {
    const request = new Request("https://ecospend.local/auth/callback?code=valid-code");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://ecospend.local/dashboard");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("preserves safe sub-dashboard destinations", async () => {
    const request = new Request("https://ecospend.local/auth/callback?code=valid-code&next=%2Fdashboard%2Ftransaksi");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://ecospend.local/dashboard/transaksi");
  });

  it("prevents open redirects and falls back to /dashboard", async () => {
    const request = new Request("https://ecospend.local/auth/callback?code=valid-code&next=https%3A%2F%2Fevil.com");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://ecospend.local/dashboard");
  });

  it("handles password recovery destination correctly", async () => {
    const request = new Request("https://ecospend.local/auth/callback?code=valid-code&next=%2Freset-password");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://ecospend.local/reset-password");
  });

  it("redirects with auth_error when code is missing", async () => {
    const request = new Request("https://ecospend.local/auth/callback");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/login?auth_error=callback_invalid");
  });

  it("redirects to forgot-password when recovery callback fails", async () => {
    const request = new Request("https://ecospend.local/auth/callback?code=bad-code&next=%2Freset-password");
    const response = await GET(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/forgot-password?auth_error=callback_failed");
  });
});
