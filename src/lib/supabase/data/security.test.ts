import { afterEach, describe, expect, it } from "vitest";
import { assertMutationOrigin, ApiError } from "./http";
import { canonicalDigest, createPreviewToken, verifyPreviewToken } from "./import-token";
import { enforceRateLimit, getRateLimitHeaders, resetRateLimitsForTests } from "./rate-limit";
import { serializeDatabaseValue } from "./serialization";

const USER_A = "10000000-0000-4000-8000-000000000001";
const USER_B = "10000000-0000-4000-8000-000000000002";

describe("mutation request security", () => {
  it("rejects a mismatched Origin and cross-site fetch", () => {
    const request = new Request("https://app.example/api/accounts", { headers: { origin: "https://evil.example" } });
    expect(() => assertMutationOrigin(request)).toThrowError(ApiError);
    const fetchRequest = new Request("https://app.example/api/accounts", { headers: { "sec-fetch-site": "cross-site" } });
    expect(() => assertMutationOrigin(fetchRequest)).toThrowError(ApiError);
  });

  it("allows same-origin requests", () => {
    const request = new Request("https://app.example/api/accounts", { headers: { origin: "https://app.example", "sec-fetch-site": "same-origin" } });
    expect(() => assertMutationOrigin(request)).not.toThrow();
  });
});

describe("import preview token", () => {
  afterEach(() => { delete process.env.IMPORT_TOKEN_SECRET; });

  it("binds a token to user, digest, signature, and expiry", () => {
    process.env.IMPORT_TOKEN_SECRET = "test-secret-that-is-at-least-32-characters";
    const digest = canonicalDigest([{ amountMinor: "9007199254740993" }]);
    const token = createPreviewToken(USER_A, digest, 1_000);
    expect(() => verifyPreviewToken(token, USER_A, digest, 1_001)).not.toThrow();
    expect(() => verifyPreviewToken(token, USER_B, digest, 1_001)).toThrowError(ApiError);
    expect(() => verifyPreviewToken(`${token}x`, USER_A, digest, 1_001)).toThrowError(ApiError);
    expect(() => verifyPreviewToken(token, USER_A, digest, 1_000 + 15 * 60 * 1_000 + 1)).toThrowError(ApiError);
  });
});

describe("response safety and rate limiting", () => {
  afterEach(resetRateLimitsForTests);

  it("stringifies database money fields recursively", () => {
    expect(serializeDatabaseValue({ amount_minor: 9_007_199_254_740_992, nested: [{ target_amount_minor: 10n }] }))
      .toEqual({ amount_minor: "9007199254740992", nested: [{ target_amount_minor: "10" }] });
  });

  it("enforces the documented best-effort in-memory limit", () => {
    enforceRateLimit("user", 1, 1_000);
    expect(() => enforceRateLimit("user", 1, 1_000)).toThrowError(ApiError);
  });

  it("exposes typed RateLimit headers", () => {
    expect(getRateLimitHeaders("new-key", 60)["RateLimit-Limit"]).toBe("60");
    enforceRateLimit("typed-key", 5, 60_000);
    expect(getRateLimitHeaders("typed-key", 5)["RateLimit-Remaining"]).toBe("4");
  });

  it("treats mutation origin comparison as case-insensitive", () => {
    const request = new Request("https://APP.EXAMPLE/api/accounts", { headers: { origin: "https://app.example", "sec-fetch-site": "same-origin" } });
    expect(() => assertMutationOrigin(request)).not.toThrow();
  });
});
