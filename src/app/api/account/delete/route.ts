import type { SupabaseClient } from "@supabase/supabase-js";
import { accountDeleteSchema } from "@/lib/schemas/finance";
import { ApiError, json, parseJson, throwIfError, withAuth } from "@/lib/supabase/data/http";
import { enforceRateLimit } from "@/lib/supabase/data/rate-limit";

const ATTACHMENT_BUCKET = "transaction-attachments";
const LIST_PAGE_SIZE = 100;
const DELETE_BATCH_SIZE = 100;

type StorageEntry = {
  name: string;
  id?: string | null;
  metadata?: unknown | null;
};

function childPath(parent: string, entry: StorageEntry, userId: string): string {
  if (!entry.name || entry.name === "." || entry.name === ".." || entry.name.includes("/") || entry.name.includes("\0")) {
    throw new ApiError(409, "unsafe_storage_entry", "Account was not deleted because attachment cleanup could not be verified safely");
  }
  const path = `${parent}/${entry.name}`;
  if (!path.startsWith(`${userId}/`)) {
    throw new ApiError(409, "unsafe_storage_entry", "Account was not deleted because attachment ownership could not be verified");
  }
  return path;
}

export async function listPrivateStorageObjects(client: SupabaseClient, userId: string): Promise<string[]> {
  const bucket = client.storage.from(ATTACHMENT_BUCKET);
  const directories = [userId];
  const visited = new Set<string>();
  const files = new Set<string>();

  while (directories.length > 0) {
    const directory = directories.shift();
    if (!directory || visited.has(directory)) continue;
    visited.add(directory);

    for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
      const { data, error } = await bucket.list(directory, {
        limit: LIST_PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      throwIfError(error);
      const entries = (data ?? []) as StorageEntry[];
      for (const entry of entries) {
        const path = childPath(directory, entry, userId);
        if (entry.id == null && entry.metadata == null) directories.push(path);
        else files.add(path);
      }
      if (entries.length < LIST_PAGE_SIZE) break;
    }
  }

  return [...files];
}

async function remainingObjectCount(client: SupabaseClient, userId: string): Promise<number | null> {
  try {
    return (await listPrivateStorageObjects(client, userId)).length;
  } catch {
    return null;
  }
}

export async function deletePrivateStorageObjects(client: SupabaseClient, userId: string): Promise<number> {
  const bucket = client.storage.from(ATTACHMENT_BUCKET);
  const objects = await listPrivateStorageObjects(client, userId);
  let deletedCount = 0;

  for (let index = 0; index < objects.length; index += DELETE_BATCH_SIZE) {
    const batch = objects.slice(index, index + DELETE_BATCH_SIZE);
    const { data, error } = await bucket.remove(batch);
    if (error) {
      const remaining = await remainingObjectCount(client, userId);
      const detail = remaining === null ? "the remaining files could not be counted" : `${remaining} file(s) remain`;
      throw new ApiError(502, "storage_cleanup_incomplete", `Account was not deleted. ${deletedCount} attachment file(s) were removed; ${detail}. Retry deletion.`);
    }
    deletedCount += data?.length ?? batch.length;
  }

  const remaining = await remainingObjectCount(client, userId);
  if (remaining === null) {
    throw new ApiError(502, "storage_verification_failed", "Account was not deleted because attachment cleanup could not be verified. Retry deletion.");
  }
  if (remaining > 0) {
    throw new ApiError(409, "storage_cleanup_incomplete", `Account was not deleted. ${deletedCount} attachment file(s) were removed; ${remaining} file(s) remain. Retry deletion.`);
  }
  return deletedCount;
}

export async function POST(request: Request) {
  return withAuth(request, async ({ client, user }) => {
    enforceRateLimit(`delete-account:${user.id}`, 3, 60 * 60 * 1_000);
    await parseJson(request, accountDeleteSchema);
    const deletedAttachmentCount = await deletePrivateStorageObjects(client, user.id);
    const { error } = await client.rpc("delete_my_account");
    throwIfError(error);
    return json({ data: { deleted: true, deletedAttachmentCount } });
  }, { mutation: true });
}
