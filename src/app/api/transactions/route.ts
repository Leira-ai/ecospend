import { idBodySchema, paginationSchema } from "@/lib/schemas/common";
import { transactionCreateSchema, transactionUpdateSchema } from "@/lib/schemas/finance";
import { ApiError, json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";
const columns = "id,account_id,category_id,import_job_id,transfer_group_id,kind,status,source,amount_minor::text,currency_code,merchant_name,description,notes,external_id,transacted_at,posted_at,created_at,updated_at";
const mapping = { accountId: "account_id", categoryId: "category_id", kind: "kind", status: "status", amountMinor: "amount_minor", currencyCode: "currency_code", merchantName: "merchant_name", description: "description", notes: "notes", externalId: "external_id", transactedAt: "transacted_at", postedAt: "posted_at" };

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const url = new URL(request.url);
    const parsed = paginationSchema.safeParse({ page: url.searchParams.get("page") ?? undefined, pageSize: url.searchParams.get("pageSize") ?? undefined });
    if (!parsed.success) throw new ApiError(422, "validation_failed", "Invalid pagination");
    const { page, pageSize } = parsed.data; const from = (page - 1) * pageSize;
    let query = client.from("transactions").select(columns, { count: "exact" }).eq("user_id", user.id)
      .order("transacted_at", { ascending: false }).range(from, from + pageSize - 1);
    const accountId = url.searchParams.get("accountId"); const kind = url.searchParams.get("kind");
    const fromDate = url.searchParams.get("from"); const toDate = url.searchParams.get("to");
    if (accountId) query = query.eq("account_id", accountId);
    if (kind) query = query.eq("kind", kind);
    if (fromDate) query = query.gte("transacted_at", fromDate);
    if (toDate) query = query.lte("transacted_at", toDate);
    const { data, error, count } = await query; throwIfError(error);
    return json({ data: serializeDatabaseValue(data), page, pageSize, total: count ?? 0 });
  });
}
export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, transactionCreateSchema);
    const { data, error } = await client.from("transactions").insert({ user_id: user.id, source: "manual", ...mapDefined(input, mapping) }).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, transactionUpdateSchema); await assertOwned(client, "transactions", input.id, user.id);
    const { data: existing, error: findError } = await client.from("transactions").select("source").eq("id", input.id).eq("user_id", user.id).single();
    throwIfError(findError); if (existing.source === "transfer") throw new ApiError(409, "immutable_transfer", "Transfer rows cannot be edited independently");
    const { data, error } = await client.from("transactions").update(mapDefined(input, mapping)).eq("id", input.id).eq("user_id", user.id).select(columns).single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema); await assertOwned(client, "transactions", id, user.id);
    const { data: existing, error: findError } = await client.from("transactions").select("source").eq("id", id).eq("user_id", user.id).single();
    throwIfError(findError); if (existing.source === "transfer") throw new ApiError(409, "immutable_transfer", "Transfer rows cannot be deleted independently");
    const { error } = await client.from("transactions").delete().eq("id", id).eq("user_id", user.id); throwIfError(error);
    return noContent();
  }, { mutation: true });
}
