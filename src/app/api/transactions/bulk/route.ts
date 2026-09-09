import { transactionBulkSchema } from "@/lib/schemas/finance";
import { ApiError, json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertAllOwned } from "@/lib/supabase/data/ownership";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, transactionBulkSchema);
    await assertAllOwned(client, "transactions", input.ids, user.id);
    const { data: existing, error: existingError } = await client.from("transactions").select("id,source").eq("user_id", user.id).in("id", input.ids);
    throwIfError(existingError);
    if (existing?.some((row) => row.source === "transfer")) throw new ApiError(409, "immutable_transfer", "Transfer rows cannot be changed in bulk");
    if (input.operation === "delete") {
      const { error } = await client.from("transactions").delete().eq("user_id", user.id).in("id", input.ids); throwIfError(error);
      return json({ data: { affected: input.ids.length } });
    }
    const patch = input.operation === "status" ? { status: input.status } : { category_id: input.categoryId };
    const { data, error } = await client.from("transactions").update(patch).eq("user_id", user.id).in("id", input.ids)
      .select("id,account_id,category_id,kind,status,source,amount_minor::text,currency_code,merchant_name,description,notes,transacted_at,updated_at");
    throwIfError(error); return json({ data: serializeDatabaseValue(data), affected: data?.length ?? 0 });
  }, { mutation: true });
}
