import { notificationBulkSchema, notificationUpdateSchema } from "@/lib/schemas/finance";
import { json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertAllOwned, assertOwned } from "@/lib/supabase/data/ownership";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,type,status,title,body,data,read_at,created_at,updated_at";

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const status = new URL(request.url).searchParams.get("status");
    let query = client.from("notifications").select(columns).eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (status) query = query.eq("status", status);
    const { data, error } = await query; throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const value: unknown = await request.clone().json().catch(() => null);
    const isBulk = typeof value === "object" && value !== null && "ids" in value;
    const input = isBulk
      ? await parseJson(request, notificationBulkSchema)
      : await parseJson(request, notificationUpdateSchema);
    const ids: string[] = "ids" in input ? input.ids : [input.id];
    if (ids.length === 1) await assertOwned(client, "notifications", ids[0], user.id);
    else await assertAllOwned(client, "notifications", ids, user.id);
    const { data, error } = await client.from("notifications").update({ status: input.status }).eq("user_id", user.id).in("id", ids).select(columns);
    throwIfError(error); return json({ data: serializeDatabaseValue(data), affected: data?.length ?? 0 });
  }, { mutation: true });
}
