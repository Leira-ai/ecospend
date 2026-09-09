import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, throwIfError } from "./http";

export type OwnedResource =
  | "accounts" | "categories" | "transactions" | "merchant_rules" | "budgets"
  | "financial_goals" | "recurring_transactions" | "notifications";

export async function assertOwned(
  client: SupabaseClient,
  table: OwnedResource,
  id: string,
  userId: string,
): Promise<void> {
  let query = client.from(table).select("id").eq("id", id);
  if (table === "categories") query = query.eq("user_id", userId).eq("is_system", false);
  else query = query.eq("user_id", userId);
  const { data, error } = await query.maybeSingle();
  throwIfError(error);
  if (!data) throw new ApiError(404, "not_found", "Resource not found");
}

export async function assertAllOwned(
  client: SupabaseClient,
  table: Exclude<OwnedResource, "categories">,
  ids: readonly string[],
  userId: string,
): Promise<void> {
  const uniqueIds = [...new Set(ids)];
  const { data, error } = await client.from(table).select("id").eq("user_id", userId).in("id", uniqueIds);
  throwIfError(error);
  if (!data || data.length !== uniqueIds.length) throw new ApiError(404, "not_found", "One or more resources were not found");
}
