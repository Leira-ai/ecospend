import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { generateDueRecurringTransactions } from "./generate";

function clientWith(data: unknown, error: unknown = null): SupabaseClient {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) } as unknown as SupabaseClient;
}

describe("generateDueRecurringTransactions", () => {
  it("maps the RPC row to the API contract", async () => {
    const client = clientWith([{
      created_draft_ids: ["10000000-0000-4000-8000-000000000001"],
      skipped_count: 2,
      skipped_duplicate_count: 1,
      skipped_invalid_count: 1,
    }]);

    await expect(generateDueRecurringTransactions(client)).resolves.toEqual({
      createdDraftIds: ["10000000-0000-4000-8000-000000000001"],
      skippedCount: 2,
      skippedDuplicateCount: 1,
      skippedInvalidCount: 1,
    });
    expect(client.rpc).toHaveBeenCalledWith("generate_due_recurring_transactions");
  });

  it("uses safe empty values for a missing row", async () => {
    await expect(generateDueRecurringTransactions(clientWith([]))).resolves.toEqual({
      createdDraftIds: [], skippedCount: 0, skippedDuplicateCount: 0, skippedInvalidCount: 0,
    });
  });

  it("propagates RPC errors", async () => {
    const error = { code: "42501", message: "Authentication required" };
    await expect(generateDueRecurringTransactions(clientWith(null, error))).rejects.toBe(error);
  });
});
