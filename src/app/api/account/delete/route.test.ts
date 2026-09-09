import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitsForTests } from "@/lib/supabase/data/rate-limit";

const USER_A = "10000000-0000-4000-8000-000000000001";
const USER_B = "10000000-0000-4000-8000-000000000002";
const authContext = vi.hoisted(() => ({ current: undefined as unknown as { client: SupabaseClient; user: { id: string } } }));
const withAuthSpy = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/data/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/data/http")>();
  return {
    ...actual,
    withAuth: withAuthSpy.mockImplementation(async (_request, handler) => {
      try {
        return await handler(authContext.current);
      } catch (error) {
        if (error instanceof actual.ApiError) {
          return actual.json({ error: { code: error.code, message: error.message } }, { status: error.status });
        }
        throw error;
      }
    }),
  };
});

import { deletePrivateStorageObjects, POST } from "./route";

type Entry = { name: string; id: string | null; metadata: object | null };

function storageClient(entriesByDirectory: Record<string, Entry[]>, failRemoveCall?: number) {
  const removed = new Set<string>();
  const events: string[] = [];
  let removeCall = 0;
  const list = vi.fn(async (directory: string, options: { limit: number; offset: number }) => {
    events.push(`list:${directory}:${options.offset}`);
    const available = (entriesByDirectory[directory] ?? []).filter((entry) => {
      const path = `${directory}/${entry.name}`;
      return entry.id === null || !removed.has(path);
    });
    return { data: available.slice(options.offset, options.offset + options.limit), error: null };
  });
  const remove = vi.fn(async (paths: string[]) => {
    removeCall += 1;
    events.push(`remove:${removeCall}`);
    if (removeCall === failRemoveCall) return { data: null, error: { message: "storage unavailable" } };
    paths.forEach((path) => removed.add(path));
    return { data: paths.map((name) => ({ name })), error: null };
  });
  const rpc = vi.fn(async () => { events.push("rpc"); return { data: null, error: null }; });
  const client = { storage: { from: vi.fn(() => ({ list, remove })) }, rpc } as unknown as SupabaseClient;
  return { client, list, remove, rpc, events, removed };
}

function file(name: string): Entry {
  return { name, id: `id-${name}`, metadata: {} };
}

beforeEach(() => {
  resetRateLimitsForTests();
  withAuthSpy.mockClear();
});

describe("account deletion storage lifecycle", () => {
  it("recursively paginates, deletes only the user prefix, verifies, then invokes the RPC", async () => {
    const root = Array.from({ length: 100 }, (_, index) => file(`file-${String(index).padStart(3, "0")}.pdf`));
    root.push({ name: "transaction", id: null, metadata: null });
    const mock = storageClient({ [USER_A]: root, [`${USER_A}/transaction`]: [file("nested.pdf")] });
    authContext.current = { client: mock.client, user: { id: USER_A } };

    const response = await POST(new Request("https://app.example/api/account/delete", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://app.example" },
      body: JSON.stringify({ confirmation: "DELETE" }),
    }));

    expect(response.status).toBe(200);
    expect(mock.list).toHaveBeenCalledWith(USER_A, expect.objectContaining({ limit: 100, offset: 100 }));
    const deletedPaths = mock.remove.mock.calls.flatMap(([paths]) => paths);
    expect(deletedPaths).toHaveLength(101);
    expect(deletedPaths.every((path) => path.startsWith(`${USER_A}/`))).toBe(true);
    expect(deletedPaths.some((path) => path.startsWith(`${USER_B}/`))).toBe(false);
    expect(mock.events.at(-1)).toBe("rpc");
    expect(withAuthSpy.mock.calls[0]?.[2]).toEqual({ mutation: true });
  });

  it("reports partial cleanup without deleting database or auth data", async () => {
    const mock = storageClient({
      [USER_A]: Array.from({ length: 101 }, (_, index) => file(`file-${index}.pdf`)),
    }, 2);

    await expect(deletePrivateStorageObjects(mock.client, USER_A)).rejects.toMatchObject({
      status: 502,
      code: "storage_cleanup_incomplete",
      message: expect.stringContaining("100 attachment file(s) were removed"),
    });
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.removed.size).toBe(100);
  });
});
