import { json, withAuth } from "@/lib/supabase/data/http";
import { enforceRateLimit } from "@/lib/supabase/data/rate-limit";
import { generateDueRecurringTransactions } from "@/lib/supabase/recurring/generate";
import { assertRecurringGenerationOrigin } from "@/lib/supabase/recurring/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    assertRecurringGenerationOrigin(request);
    enforceRateLimit(`recurring-generate:${user.id}`, 12, 60 * 1_000);
    const result = await generateDueRecurringTransactions(client);
    return json({ data: result });
  }, { mutation: true });
}
