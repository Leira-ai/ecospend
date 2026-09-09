import { idBodySchema } from "@/lib/schemas/common";
import { recurringCreateSchema, recurringUpdateSchema } from "@/lib/schemas/finance";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,account_id,category_id,kind,amount_minor::text,currency_code,merchant_name,description,frequency,interval_count,next_due_on,ends_on,last_generated_at,is_active,created_at,updated_at";
const mapping = { accountId: "account_id", categoryId: "category_id", kind: "kind", amountMinor: "amount_minor", currencyCode: "currency_code", merchantName: "merchant_name", description: "description", frequency: "frequency", intervalCount: "interval_count", nextDueOn: "next_due_on", endsOn: "ends_on", isActive: "is_active" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { data, error } = await client.from("recurring_transactions").select(columns).eq("user_id", user.id).order("next_due_on");
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, recurringCreateSchema);
    const { data, error } = await client.from("recurring_transactions").insert({ user_id: user.id, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, recurringUpdateSchema); await assertOwned(client, "recurring_transactions", input.id, user.id);
    const { data, error } = await client.from("recurring_transactions").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "recurring_transactions", id, user.id);
    const { error } = await client.from("recurring_transactions").delete().eq("id", id).eq("user_id", user.id); throwIfError(error); return noContent();
  }, { mutation: true });
}
