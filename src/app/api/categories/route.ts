import { categoryCreateSchema, categoryUpdateSchema } from "@/lib/schemas/finance";
import { idBodySchema } from "@/lib/schemas/common";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,user_id,name,slug,kind,parent_id,icon,color,is_system,sort_order,created_at,updated_at";
const mapping = { name: "name", slug: "slug", kind: "kind", parentId: "parent_id", icon: "icon", color: "color", sortOrder: "sort_order" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { data, error } = await client.from("categories").select(columns).or(`is_system.eq.true,user_id.eq.${user.id}`).order("sort_order").order("name");
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, categoryCreateSchema);
    const { data, error } = await client.from("categories").insert({ user_id: user.id, is_system: false, ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, categoryUpdateSchema); await assertOwned(client, "categories", input.id, user.id);
    const { data, error } = await client.from("categories").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).eq("is_system", false).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "categories", id, user.id);
    const { error } = await client.from("categories").delete().eq("id", id).eq("user_id", user.id).eq("is_system", false); throwIfError(error);
    return noContent();
  }, { mutation: true });
}
