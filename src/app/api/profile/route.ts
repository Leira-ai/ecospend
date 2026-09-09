import { hasCompletedOnboarding } from "@/components/onboarding/model";
import { profileUpdateSchema } from "@/lib/schemas/finance";
import { json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { mapDefined, serializeDatabaseValue } from "@/lib/supabase/data/serialization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const [profileResult, accountResult] = await Promise.all([
      client.from("profiles").select("id,display_name,currency_code,locale,timezone,created_at,updated_at").eq("id", user.id).single(),
      client.from("accounts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_archived", false),
    ]);
    throwIfError(profileResult.error); throwIfError(accountResult.error);
    return json({
      data: serializeDatabaseValue(profileResult.data),
      onboarding: {
        complete: hasCompletedOnboarding(user.user_metadata),
        hasAccount: (accountResult.count ?? 0) > 0,
      },
    });
  });
}

export async function PATCH(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const input = await parseJson(request, profileUpdateSchema);
    const payload = mapDefined(input, { displayName: "display_name", currencyCode: "currency_code", locale: "locale", timezone: "timezone" });
    const { data, error } = await client.from("profiles").update(payload).eq("id", user.id)
      .select("id,display_name,currency_code,locale,timezone,created_at,updated_at").single();
    throwIfError(error);
    return json({ data: serializeDatabaseValue(data) });
  }, { mutation: true });
}
