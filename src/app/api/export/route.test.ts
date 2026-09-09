import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitsForTests } from "@/lib/supabase/data/rate-limit";

const USER_A = "10000000-0000-4000-8000-000000000001";
const USER_B = "10000000-0000-4000-8000-000000000002";
const authContext = vi.hoisted(() => ({ current: undefined as unknown as { client: SupabaseClient; user: { id: string } } }));
const withAuthSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/data/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/data/http")>();
  return {
    ...actual,
    withAuth: withAuthSpy.mockImplementation(async (_request, handler) => handler(authContext.current)),
  };
});

import { createAccountExport, GET } from "./route";

type Row = Record<string, unknown>;

function databaseClient(rowsByTable: Record<string, Row[]>) {
  const calls: Array<{ table: string; ownerColumn?: string; ownerId?: string; columns?: string }> = [];
  const client = {
    from: vi.fn((table: string) => {
      const call = { table } as { table: string; ownerColumn?: string; ownerId?: string; columns?: string };
      calls.push(call);
      const builder = {
        select: vi.fn((columns: string) => { call.columns = columns; return builder; }),
        eq: vi.fn((column: string, value: string) => { call.ownerColumn = column; call.ownerId = value; return builder; }),
        order: vi.fn(() => builder),
        range: vi.fn(async (from: number, to: number) => ({ data: (rowsByTable[table] ?? []).slice(from, to + 1), error: null })),
      };
      return builder;
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

beforeEach(() => {
  resetRateLimitsForTests();
  withAuthSpy.mockClear();
});

describe("account export", () => {
  it("uses owner-scoped queries and returns separate finance/carbon sections with safe values", async () => {
    const mock = databaseClient({
      profiles: [{ id: USER_A, display_name: "=HYPERLINK(\"https://evil.example\")", currency_code: "IDR" }],
      accounts: [{ id: "account-a", user_id: USER_A, opening_balance_minor: 9_007_199_254_740_992 }],
      transactions: [{ id: "tx-a", amount_minor: "9007199254740993", notes: "+SUM(1,1)", user_id: USER_A }],
      import_jobs: [{ id: "job-a", original_filename: "@payload.csv", options: { token: "secret" }, file_sha256: "hash" }],
      transaction_attachments: [{ id: "attachment-a", original_filename: "-invoice.pdf", storage_path: `${USER_A}/private.pdf`, sha256: "hash" }],
      transaction_carbon_estimates: [{
        id: "carbon-a", transaction_id: "tx-a", emission_factor_id: "factor-a",
        activity_amount: "2.000000000", estimated_kg_co2e: "3.500000000",
        factor_key_snapshot: "transport.bus", factor_version_snapshot: 2,
        factor_name_snapshot: "Bus", activity_unit_snapshot: "passenger-km",
        kg_co2e_per_unit_snapshot: "1.750000000",
        source_snapshot: { name: "Inventory", url: "https://example.com", metadata: { scope: "national" } },
        methodology_snapshot: "Published average",
      }],
    });

    const exported = await createAccountExport(mock.client, USER_A, "2026-09-08T00:00:00.000Z") as {
      profile: Row; finance: Record<string, Row[]>; carbon: { estimates: Row[] };
    };

    expect(exported.profile.display_name).toBe("'=HYPERLINK(\"https://evil.example\")");
    expect(exported.finance.accounts[0]?.opening_balance_minor).toBe("9007199254740992");
    expect(exported.finance.transactions[0]?.amount_minor).toBe("9007199254740993");
    expect(exported.finance.transactions[0]?.notes).toBe("'+SUM(1,1)");
    expect(exported.carbon.estimates[0]?.factor_snapshot).toEqual(expect.objectContaining({
      factor_key: "transport.bus",
      version: 2,
      provenance: expect.objectContaining({ name: "Inventory" }),
      methodology: "Published average",
    }));
    const serialized = JSON.stringify(exported);
    expect(serialized).not.toContain("storage_path");
    expect(serialized).not.toContain("file_sha256");
    expect(serialized).not.toContain("sha256");
    expect(serialized).not.toContain("\"options\"");
    expect(serialized).not.toContain(USER_B);
    expect(mock.calls.every((call) => call.ownerId === USER_A)).toBe(true);
    expect(mock.calls.find((call) => call.table === "profiles")?.ownerColumn).toBe("id");
    expect(mock.calls.filter((call) => call.table !== "profiles").every((call) => call.ownerColumn === "user_id")).toBe(true);
    expect(mock.calls.every((call) => !call.columns?.includes("*"))).toBe(true);
  });

  it("returns a no-store attachment and applies same-origin protection through withAuth", async () => {
    const mock = databaseClient({});
    authContext.current = { client: mock.client, user: { id: USER_A } };
    const response = await GET(new Request("https://app.example/api/export", {
      headers: { origin: "https://app.example", "sec-fetch-site": "same-origin" },
    }));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toContain("ecospend-export-");
    expect(withAuthSpy.mock.calls[0]?.[2]).toEqual({ mutation: true });
  });
});
