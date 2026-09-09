import { transferCreateSchema } from "@/lib/schemas/finance";
import { json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export async function POST(request: Request) {
  return withAuth(request, async ({ client }) => {
    const input = await parseJson(request, transferCreateSchema);
    const { data, error } = await client.rpc("create_transfer", {
      p_source_account_id: input.sourceAccountId,
      p_destination_account_id: input.destinationAccountId,
      p_amount_minor: input.amountMinor,
      p_transacted_at: input.transactedAt,
      p_description: input.description,
      p_notes: input.notes,
    });
    throwIfError(error); return json({ data: serializeDatabaseValue(Array.isArray(data) ? data[0] : data) }, { status: 201 });
  }, { mutation: true });
}
