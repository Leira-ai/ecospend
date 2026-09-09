import { z } from "zod";
import { carbonEstimateSchema, carbonRecalculateSchema } from "@/lib/schemas/finance";
import { ApiError, json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const actionSchema = z.discriminatedUnion("action", [
  carbonEstimateSchema.extend({ action: z.literal("estimate") }),
  carbonRecalculateSchema.extend({ action: z.literal("recalculate") }),
]);
const columns = "id,transaction_id,emission_factor_id,activity_amount,estimated_kg_co2e,factor_key_snapshot,factor_version_snapshot,factor_name_snapshot,activity_unit_snapshot,kg_co2e_per_unit_snapshot,source_snapshot,methodology_snapshot,calculated_at,created_at";

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const url = new URL(request.url); const transactionId = url.searchParams.get("transactionId");
    let query = client.from("transaction_carbon_estimates").select(columns).eq("user_id", user.id).order("calculated_at", { ascending: false });
    if (transactionId) query = query.eq("transaction_id", transactionId);
    const { data, error } = await query.limit(1_000); throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, actionSchema);
    if (input.action === "estimate") {
      await assertOwned(client, "transactions", input.transactionId, user.id);
      const { data, error } = await client.from("transaction_carbon_estimates").insert({
        user_id: user.id, transaction_id: input.transactionId, emission_factor_id: input.emissionFactorId,
        activity_amount: input.activityAmount, estimated_kg_co2e: "0", factor_key_snapshot: "pending",
        factor_version_snapshot: 1, factor_name_snapshot: "pending", activity_unit_snapshot: "pending",
        kg_co2e_per_unit_snapshot: "0", source_snapshot: {},
      }).select(columns).single();
      throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
    }
    const { data: estimate, error: findError } = await client.from("transaction_carbon_estimates").select("id").eq("id", input.id).eq("user_id", user.id).maybeSingle();
    throwIfError(findError); if (!estimate) throw new ApiError(404, "not_found", "Carbon estimate not found");
    const { data, error } = await client.from("transaction_carbon_estimates").update({ activity_amount: input.activityAmount, calculated_at: new Date().toISOString() })
      .eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
