import { idBodySchema } from "@/lib/schemas/common";
import { merchantRuleCreateSchema, merchantRuleUpdateSchema } from "@/lib/schemas/finance";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,account_id,category_id,pattern,match_type,case_sensitive,priority,is_enabled,created_at,updated_at";
const mapping = { accountId: "account_id", categoryId: "category_id", pattern: "pattern", matchType: "match_type", caseSensitive: "case_sensitive", priority: "priority", isEnabled: "is_enabled" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { data, error } = await client.from("merchant_rules").select(columns).eq("user_id", user.id).order("priority");
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, merchantRuleCreateSchema);
    const { data, error } = await client.from("merchant_rules").insert({ user_id: user.id, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, merchantRuleUpdateSchema); await assertOwned(client, "merchant_rules", input.id, user.id);
    const { data, error } = await client.from("merchant_rules").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "merchant_rules", id, user.id);
    const { error } = await client.from("merchant_rules").delete().eq("id", id).eq("user_id", user.id); throwIfError(error);
    return noContent();
  }, { mutation: true });
}
