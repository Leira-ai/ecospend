import { json, withAuth } from "@/lib/supabase/data/http";
import { createAttachmentDownload, SIGNED_URL_TTL_SECONDS } from "@/lib/supabase/attachments/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ attachmentId: string }> }) {
  return withAuth(request, async ({ client, user }) => {
    const { attachmentId } = await context.params;
    const url = await createAttachmentDownload(client, user.id, attachmentId);
    return json({ data: { url, expiresIn: SIGNED_URL_TTL_SECONDS } });
  }, { mutation: true });
}
