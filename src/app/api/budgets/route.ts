import { idBodySchema } from "@/lib/schemas/common";
import { budgetCreateSchema, budgetUpdateSchema } from "@/lib/schemas/finance";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,category_id,name,amount_minor::text,currency_code,period,starts_on,ends_on,rollover_enabled,is_active,alert_threshold_percent,created_at,updated_at";
const mapping = { categoryId: "category_id", name: "name", amountMinor: "amount_minor", currencyCode: "currency_code", period: "period", startsOn: "starts_on", endsOn: "ends_on", rolloverEnabled: "rollover_enabled", isActive: "is_active", alertThresholdPercent: "alert_threshold_percent" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { data, error } = await client.from("budgets").select(columns).eq("user_id", user.id).order("starts_on", { ascending: false });
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, budgetCreateSchema);
    const { data, error } = await client.from("budgets").insert({ user_id: user.id, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, budgetUpdateSchema); await assertOwned(client, "budgets", input.id, user.id);
    const { data, error } = await client.from("budgets").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "budgets", id, user.id);
    const { error } = await client.from("budgets").delete().eq("id", id).eq("user_id", user.id); throwIfError(error); return noContent();
  }, { mutation: true });
}
