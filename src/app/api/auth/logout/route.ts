import { json, throwIfError, withAuth } from "@/lib/supabase/data/http";

export async function POST(request: Request) {
  return withAuth(request, async ({ client }) => {
    const { error } = await client.auth.signOut(); throwIfError(error);
    return json({ data: { loggedOut: true } });
  }, { mutation: true });
}
