import { idBodySchema } from "@/lib/schemas/common";
import { goalCreateSchema, goalUpdateSchema } from "@/lib/schemas/finance";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,account_id,name,target_amount_minor::text,currency_code,target_date,status,notes,created_at,updated_at,goal_contributions(id,transaction_id,amount_minor::text,contributed_at,note,created_at)";
const mapping = { accountId: "account_id", name: "name", targetAmountMinor: "target_amount_minor", currencyCode: "currency_code", targetDate: "target_date", status: "status", notes: "notes" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { data, error } = await client.from("financial_goals").select(columns).eq("user_id", user.id).order("created_at");
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, goalCreateSchema);
    const { data, error } = await client.from("financial_goals").insert({ user_id: user.id, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, goalUpdateSchema); await assertOwned(client, "financial_goals", input.id, user.id);
    const { data, error } = await client.from("financial_goals").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "financial_goals", id, user.id);
    const { error } = await client.from("financial_goals").delete().eq("id", id).eq("user_id", user.id); throwIfError(error); return noContent();
  }, { mutation: true });
}
