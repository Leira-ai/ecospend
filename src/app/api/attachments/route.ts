import { randomUUID } from "node:crypto";
import { ApiError, json, withAuth } from "@/lib/supabase/data/http";
import { listAttachments, uploadAttachment } from "@/lib/supabase/attachments/repository";
import { MAX_ATTACHMENT_BYTES, validateAttachmentFile } from "@/lib/supabase/attachments/validation";

export const dynamic = "force-dynamic";
const MAX_MULTIPART_BYTES = MAX_ATTACHMENT_BYTES + 1024 * 1024;

export async function GET(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const transactionId = requiredTransactionId(new URL(request.url).searchParams.get("transactionId"));
    return json({ data: await listAttachments(client, user.id, transactionId) });
  });
}

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    const type = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!type.startsWith("multipart/form-data;")) throw new ApiError(415, "unsupported_media_type", "Expected multipart form data");
    const length = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(length) && length > MAX_MULTIPART_BYTES) throw new ApiError(413, "payload_too_large", "Attachment must not exceed 10 MiB");
    let form: FormData;
    try { form = await request.formData(); } catch { throw new ApiError(400, "invalid_multipart", "Malformed attachment upload"); }
    const transactionId = requiredTransactionId(form.get("transactionId"));
    const value = form.get("file");
    if (!(value instanceof File)) throw new ApiError(422, "file_required", "Attachment file is required");
    const file = await validateAttachmentFile(value);
    return json({ data: await uploadAttachment(client, user.id, transactionId, randomUUID(), file) }, { status: 201 });
  }, { mutation: true });
}

function requiredTransactionId(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError(422, "validation_failed", "A valid transactionId is required");
  }
  return value;
}
