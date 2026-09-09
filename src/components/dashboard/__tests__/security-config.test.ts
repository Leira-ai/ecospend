import { describe, expect, it } from "vitest";
import { createSecurityHeaders } from "../../../../next.config";

describe("security headers", () => {
  it("sets restrictive production browser policies", () => {
    const headers = new Map(createSecurityHeaders(true).map(({ key, value }) => [key, value]));
    const csp = headers.get("Content-Security-Policy") ?? "";

    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
  });

  it("does not add HSTS outside production", () => {
    expect(createSecurityHeaders(false).some(({ key }) => key === "Strict-Transport-Security")).toBe(false);
  });
});
