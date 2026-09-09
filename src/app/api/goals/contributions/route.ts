import { idBodySchema } from "@/lib/schemas/common";
import { contributionCreateSchema } from "@/lib/schemas/finance";
import { json, noContent, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, contributionCreateSchema);
    await assertOwned(client, "financial_goals", input.goalId, user.id);
    if (input.transactionId) await assertOwned(client, "transactions", input.transactionId, user.id);
    const { data, error } = await client.from("goal_contributions").insert({
      user_id: user.id, goal_id: input.goalId, transaction_id: input.transactionId,
      amount_minor: input.amountMinor, contributed_at: input.contributedAt, note: input.note,
    }).select("id,goal_id,transaction_id,amount_minor::text,contributed_at,note,created_at").single();
    throwIfError(error); return json({ data: serializeDatabaseValue(data) }, { status: 201 });
  }, { mutation: true });
}
export async function DELETE(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const { id } = await parseJson(request, idBodySchema);
    const { data, error: findError } = await client.from("goal_contributions").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
    throwIfError(findError); if (!data) return noContent();
    const { error } = await client.from("goal_contributions").delete().eq("id", id).eq("user_id", user.id); throwIfError(error); return noContent();
  }, { mutation: true });
}
