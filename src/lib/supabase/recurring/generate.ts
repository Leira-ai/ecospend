import type { SupabaseClient } from "@supabase/supabase-js";

interface GenerateDueRecurringRpcRow {
  created_draft_ids: unknown;
  skipped_count: unknown;
  skipped_duplicate_count: unknown;
  skipped_invalid_count: unknown;
}

export interface RecurringGenerationResult {
  createdDraftIds: string[];
  skippedCount: number;
  skippedDuplicateCount: number;
  skippedInvalidCount: number;
}

const isUuid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function count(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export async function generateDueRecurringTransactions(
  client: SupabaseClient,
): Promise<RecurringGenerationResult> {
  const { data, error } = await client.rpc("generate_due_recurring_transactions");
  if (error) throw error;

  const row = (Array.isArray(data) ? data[0] : data) as GenerateDueRecurringRpcRow | null;
  const ids = Array.isArray(row?.created_draft_ids) ? row.created_draft_ids.filter(isUuid) : [];
  return {
    createdDraftIds: ids,
    skippedCount: count(row?.skipped_count),
    skippedDuplicateCount: count(row?.skipped_duplicate_count),
    skippedInvalidCount: count(row?.skipped_invalid_count),
  };
}
