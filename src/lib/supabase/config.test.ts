import { afterEach, describe, expect, it } from "vitest";
import { getSupabasePublicConfig } from "./config";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

afterEach(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;

  if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
});

describe("getSupabasePublicConfig", () => {
  it("gracefully reports missing configuration", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(getSupabasePublicConfig()).toMatchObject({ configured: false });
  });

  it("rejects an insecure remote Supabase URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://example.com";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    expect(getSupabasePublicConfig()).toMatchObject({ configured: false });
  });

  it("accepts HTTPS public configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    expect(getSupabasePublicConfig()).toEqual({
      configured: true,
      config: {
        url: "https://project.supabase.co",
        anonKey: "public-anon-key",
      },
    });
  });
});
