import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { createAttachmentDownload, deleteAttachment, listAttachments, uploadAttachment } from "./repository";
import type { ValidatedAttachment } from "./validation";

const USER = "10000000-0000-4000-8000-000000000001";
const TRANSACTION = "20000000-0000-4000-8000-000000000001";
const ATTACHMENT = "30000000-0000-4000-8000-000000000001";
const PATH = `${USER}/${TRANSACTION}/${ATTACHMENT}/receipt.pdf`;

function ownershipQuery(owned: boolean) {
  const query = {
    select: vi.fn(() => query), eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: owned ? { id: TRANSACTION } : null, error: null })),
  };
  return query;
}

function validatedFile(): ValidatedAttachment {
  return {
    bytes: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), contentType: "application/pdf",
    originalFilename: "receipt.pdf", safeFilename: "receipt.pdf", sizeBytes: 5, sha256: "a".repeat(64),
  };
}

describe("attachment ownership and compensation", () => {
  it("checks transaction ownership before listing metadata", async () => {
    const owner = ownershipQuery(false);
    const from = vi.fn((table: string) => {
      if (table === "transactions") return owner;
      throw new Error("metadata query must not run");
    });
    const client = { from } as unknown as SupabaseClient;

    await expect(listAttachments(client, USER, TRANSACTION)).rejects.toMatchObject({ status: 404 });
    expect(owner.eq).toHaveBeenCalledWith("user_id", USER);
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("removes the private object when metadata insertion fails", async () => {
    const owner = ownershipQuery(true);
    const insertError = { code: "23514", message: "metadata rejected" };
    const metadata = {
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: insertError })) })) })),
    };
    const upload = vi.fn(async () => ({ error: null }));
    const remove = vi.fn(async () => ({ error: null }));
    const client = {
      from: vi.fn((table: string) => table === "transactions" ? owner : metadata),
      storage: { from: vi.fn(() => ({ upload, remove })) },
    } as unknown as SupabaseClient;

    await expect(uploadAttachment(client, USER, TRANSACTION, ATTACHMENT, validatedFile())).rejects.toBe(insertError);
    expect(upload).toHaveBeenCalledWith(PATH, expect.any(Uint8Array), expect.objectContaining({ contentType: "application/pdf", upsert: false }));
    expect(remove).toHaveBeenCalledWith([PATH]);
  });

  it("returns a cleanup-specific error if compensation also fails", async () => {
    const owner = ownershipQuery(true);
    const metadata = {
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: null, error: { code: "23514" } })) })) })),
    };
    const client = {
      from: vi.fn((table: string) => table === "transactions" ? owner : metadata),
      storage: { from: vi.fn(() => ({ upload: vi.fn(async () => ({ error: null })), remove: vi.fn(async () => ({ error: { message: "remove failed" } })) })) },
    } as unknown as SupabaseClient;

    await expect(uploadAttachment(client, USER, TRANSACTION, ATTACHMENT, validatedFile()))
      .rejects.toMatchObject({ code: "metadata_and_cleanup_failed" });
  });

  it("retains metadata when object deletion fails so deletion can be retried", async () => {
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: {
        id: ATTACHMENT, transaction_id: TRANSACTION, original_filename: "receipt.pdf", content_type: "application/pdf",
        size_bytes: 5, created_at: "2026-09-08T00:00:00Z", storage_path: PATH,
      }, error: null })),
    };
    const metadataDelete = vi.fn();
    const client = {
      from: vi.fn(() => ({ ...query, delete: metadataDelete })),
      storage: { from: vi.fn(() => ({ remove: vi.fn(async () => ({ error: { message: "remove failed" } })) })) },
    } as unknown as SupabaseClient;

    await expect(deleteAttachment(client, USER, ATTACHMENT)).rejects.toMatchObject({ message: "remove failed" });
    expect(metadataDelete).not.toHaveBeenCalled();
  });

  it("filters metadata by owner before creating a short-lived signed URL", async () => {
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: {
        id: ATTACHMENT, transaction_id: TRANSACTION, original_filename: "receipt.pdf", content_type: "application/pdf",
        size_bytes: 5, created_at: "2026-09-08T00:00:00Z", storage_path: PATH,
      }, error: null })),
    };
    const createSignedUrl = vi.fn(async () => ({ data: { signedUrl: "https://signed.example/file" }, error: null }));
    const client = {
      from: vi.fn(() => query), storage: { from: vi.fn(() => ({ createSignedUrl })) },
    } as unknown as SupabaseClient;

    await expect(createAttachmentDownload(client, USER, ATTACHMENT)).resolves.toBe("https://signed.example/file");
    expect(query.eq).toHaveBeenCalledWith("user_id", USER);
    expect(createSignedUrl).toHaveBeenCalledWith(PATH, 60, { download: "receipt.pdf" });
  });
});
