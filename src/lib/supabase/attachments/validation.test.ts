import { describe, expect, it } from "vitest";
import {
  MAX_ATTACHMENT_BYTES, buildStoragePath, detectAttachmentMime, sanitizeFilename, validateAttachmentFile,
} from "./validation";

const USER = "10000000-0000-4000-8000-000000000001";
const TRANSACTION = "20000000-0000-4000-8000-000000000001";
const ATTACHMENT = "30000000-0000-4000-8000-000000000001";

describe("attachment file validation", () => {
  it.each([
    ["image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
    ["image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["image/webp", new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])],
    ["application/pdf", new TextEncoder().encode("%PDF-1.7")],
  ])("detects %s from its signature", (expected, bytes) => {
    expect(detectAttachmentMime(bytes)).toBe(expected);
  });

  it("rejects a declared MIME type that does not match the magic bytes", async () => {
    const file = new File(["%PDF-1.7"], "renamed.jpg", { type: "image/jpeg" });
    await expect(validateAttachmentFile(file)).rejects.toMatchObject({ status: 415, code: "invalid_file_signature" });
  });

  it("rejects files larger than 10 MiB before reading content", async () => {
    const file = { name: "large.pdf", type: "application/pdf", size: MAX_ATTACHMENT_BYTES + 1 } as File;
    await expect(validateAttachmentFile(file)).rejects.toMatchObject({ status: 413, code: "payload_too_large" });
  });

  it("sanitizes display and internal filenames and builds an owner-scoped path", () => {
    const names = sanitizeFilename("../../récéipt\u202e.exe.PDF", "application/pdf");
    expect(names).toEqual({ original: "récéipt.exe.PDF", safe: "receipt-exe.pdf" });
    const path = buildStoragePath(USER, TRANSACTION, ATTACHMENT, names.safe);
    expect(path).toBe(`${USER}/${TRANSACTION}/${ATTACHMENT}/receipt-exe.pdf`);
    expect(path).not.toContain("..");
  });
});
