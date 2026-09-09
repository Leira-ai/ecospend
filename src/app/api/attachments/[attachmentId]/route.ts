import { noContent, withAuth } from "@/lib/supabase/data/http";
import { deleteAttachment } from "@/lib/supabase/attachments/repository";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ attachmentId: string }> }) {
  return withAuth(request, async ({ client, user }) => {
    const { attachmentId } = await context.params;
    await deleteAttachment(client, user.id, attachmentId);
    return noContent();
  }, { mutation: true });
}
