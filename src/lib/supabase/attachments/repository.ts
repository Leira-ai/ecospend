import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, throwIfError } from "@/lib/supabase/data/http";
import { assertOwned } from "@/lib/supabase/data/ownership";
import { ATTACHMENT_BUCKET, buildStoragePath, type ValidatedAttachment } from "./validation";

const PUBLIC_COLUMNS = "id,transaction_id,original_filename,content_type,size_bytes,created_at";
const INTERNAL_COLUMNS = `${PUBLIC_COLUMNS},storage_path`;
export const SIGNED_URL_TTL_SECONDS = 60;

export interface AttachmentRecord {
  id: string;
  transaction_id: string;
  original_filename: string;
  content_type: string;
  size_bytes: number | string;
  created_at: string;
}

interface InternalAttachment extends AttachmentRecord { storage_path: string }

export async function listAttachments(client: SupabaseClient, userId: string, transactionId: string): Promise<AttachmentRecord[]> {
  await assertOwned(client, "transactions", transactionId, userId);
  const { data, error } = await client.from("transaction_attachments").select(PUBLIC_COLUMNS)
    .eq("user_id", userId).eq("transaction_id", transactionId).order("created_at", { ascending: false }).limit(100);
  throwIfError(error);
  return (data ?? []) as AttachmentRecord[];
}

export async function uploadAttachment(
  client: SupabaseClient, userId: string, transactionId: string, attachmentId: string, file: ValidatedAttachment,
): Promise<AttachmentRecord> {
  await assertOwned(client, "transactions", transactionId, userId);
  const path = buildStoragePath(userId, transactionId, attachmentId, file.safeFilename);
  const { error: uploadError } = await client.storage.from(ATTACHMENT_BUCKET).upload(path, file.bytes, {
    contentType: file.contentType, upsert: false, cacheControl: "0",
  });
  throwIfError(uploadError);
  const { data, error: insertError } = await client.from("transaction_attachments").insert({
    id: attachmentId, user_id: userId, transaction_id: transactionId, storage_path: path,
    original_filename: file.originalFilename, content_type: file.contentType, size_bytes: file.sizeBytes, sha256: file.sha256,
  }).select(PUBLIC_COLUMNS).single();
  if (insertError) {
    const { error: cleanupError } = await client.storage.from(ATTACHMENT_BUCKET).remove([path]);
    if (cleanupError) throw new ApiError(500, "metadata_and_cleanup_failed", "Attachment metadata failed and uploaded object cleanup must be retried");
    throw insertError;
  }
  return data as AttachmentRecord;
}

export async function createAttachmentDownload(client: SupabaseClient, userId: string, attachmentId: string): Promise<string> {
  const attachment = await findOwnedAttachment(client, userId, attachmentId);
  const { data, error } = await client.storage.from(ATTACHMENT_BUCKET).createSignedUrl(attachment.storage_path, SIGNED_URL_TTL_SECONDS, {
    download: attachment.original_filename,
  });
  throwIfError(error);
  if (!data?.signedUrl) throw new ApiError(500, "signed_url_failed", "Could not create attachment download");
  return data.signedUrl;
}

export async function deleteAttachment(client: SupabaseClient, userId: string, attachmentId: string): Promise<void> {
  const attachment = await findOwnedAttachment(client, userId, attachmentId);
  const { error: objectError } = await client.storage.from(ATTACHMENT_BUCKET).remove([attachment.storage_path]);
  throwIfError(objectError);
  const { data, error: metadataError } = await client.from("transaction_attachments").delete()
    .eq("id", attachmentId).eq("user_id", userId).select("id").maybeSingle();
  if (metadataError) throw new ApiError(500, "object_deleted_metadata_retained", "File was deleted but metadata cleanup must be retried");
  if (!data) throw new ApiError(409, "delete_incomplete", "File was deleted but attachment metadata was already unavailable");
}

async function findOwnedAttachment(client: SupabaseClient, userId: string, attachmentId: string): Promise<InternalAttachment> {
  const { data, error } = await client.from("transaction_attachments").select(INTERNAL_COLUMNS)
    .eq("id", attachmentId).eq("user_id", userId).maybeSingle();
  throwIfError(error);
  if (!data) throw new ApiError(404, "not_found", "Attachment not found");
  return data as InternalAttachment;
}
