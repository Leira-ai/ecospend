import { accountArchiveSchema, accountCreateSchema, accountUpdateSchema } from "@/lib/schemas/finance";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,name,type,currency_code,opening_balance_minor::text,institution_name,last_four,is_archived,created_at,updated_at";
const mapping = { name: "name", type: "type", currencyCode: "currency_code", openingBalanceMinor: "opening_balance_minor", institutionName: "institution_name", lastFour: "last_four" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const includeArchived = new URL(request.url).searchParams.get("includeArchived") === "true";
    let query = client.from("accounts").select(columns).eq("user_id", user.id).order("created_at");
    if (!includeArchived) query = query.eq("is_archived", false);
    const { data, error } = await query; throwIfError(error);
    return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, accountCreateSchema);
    const { data, error } = await client.from("accounts").insert({ user_id: user.id, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, accountUpdateSchema); await assertOwned(client, "accounts", input.id, user.id);
    const { data, error } = await client.from("accounts").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, accountArchiveSchema); await assertOwned(client, "accounts", input.id, user.id);
    const { data, error } = await client.from("accounts").update({ is_archived: input.archived }).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
