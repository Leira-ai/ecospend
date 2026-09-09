import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/supabase/data/http";
import { assertRecurringGenerationOrigin } from "./request";

describe("assertRecurringGenerationOrigin", () => {
  it("accepts an exact same-origin request", () => {
    const request = new Request("https://app.example/api/recurring/generate", {
      method: "POST", headers: { origin: "https://app.example" },
    });
    expect(() => assertRecurringGenerationOrigin(request)).not.toThrow();
  });

  it("rejects missing and cross-origin requests", () => {
    const missing = new Request("https://app.example/api/recurring/generate", { method: "POST" });
    const crossOrigin = new Request("https://app.example/api/recurring/generate", {
      method: "POST", headers: { origin: "https://evil.example" },
    });
    expect(() => assertRecurringGenerationOrigin(missing)).toThrowError(ApiError);
    expect(() => assertRecurringGenerationOrigin(crossOrigin)).toThrowError(ApiError);
  });
});
