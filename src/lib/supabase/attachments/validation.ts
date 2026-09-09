import { createHash } from "node:crypto";
import { ApiError } from "@/lib/supabase/data/http";

export const ATTACHMENT_BUCKET = "transaction-attachments";
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

const MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export type AttachmentMimeType = (typeof MIME_TYPES)[number];

const EXTENSIONS: Record<AttachmentMimeType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export interface ValidatedAttachment {
  bytes: Uint8Array;
  contentType: AttachmentMimeType;
  originalFilename: string;
  safeFilename: string;
  sizeBytes: number;
  sha256: string;
}

export function sanitizeFilename(filename: string, contentType: AttachmentMimeType): { original: string; safe: string } {
  const normalized = filename.normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim();
  const leaf = normalized.split(/[\\/]/).pop()?.replace(/[<>:"|?*]+/g, "-").replace(/\s+/g, " ").replace(/^\.+/, "").trim() ?? "";
  const original = (leaf || `attachment${EXTENSIONS[contentType]}`).slice(0, 255);
  const withoutExtension = original.replace(/\.[^.]*$/, "");
  const stem = withoutExtension.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "attachment";
  return { original, safe: `${stem}${EXTENSIONS[contentType]}` };
}

export function detectAttachmentMime(bytes: Uint8Array): AttachmentMimeType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export async function validateAttachmentFile(file: File): Promise<ValidatedAttachment> {
  if (file.size < 1) throw new ApiError(422, "empty_file", "Attachment cannot be empty");
  if (file.size > MAX_ATTACHMENT_BYTES) throw new ApiError(413, "payload_too_large", "Attachment must not exceed 10 MiB");
  const declared = file.type.toLowerCase();
  if (!MIME_TYPES.includes(declared as AttachmentMimeType)) throw new ApiError(415, "unsupported_media_type", "Only JPEG, PNG, WebP, and PDF attachments are allowed");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) throw new ApiError(413, "payload_too_large", "Attachment must not exceed 10 MiB");
  const detected = detectAttachmentMime(bytes);
  if (!detected || detected !== declared) throw new ApiError(415, "invalid_file_signature", "Attachment content does not match its declared type");
  const names = sanitizeFilename(file.name, detected);
  return {
    bytes, contentType: detected, originalFilename: names.original, safeFilename: names.safe,
    sizeBytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function buildStoragePath(userId: string, transactionId: string, attachmentId: string, safeFilename: string): string {
  return `${userId}/${transactionId}/${attachmentId}/${safeFilename}`;
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.subarray(start, end));
}
