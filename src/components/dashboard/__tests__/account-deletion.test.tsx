import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearEcoSpendWorkerCaches } from "@/components/public/pwa-register";
import { createOptionalBrowserClient } from "@/lib/supabase/client";
import { AccountDeletion } from "../account-deletion";

const replace = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/components/public/pwa-register", () => ({ clearEcoSpendWorkerCaches: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/supabase/client", () => ({ createOptionalBrowserClient: vi.fn() }));

describe("AccountDeletion", () => {
  beforeEach(() => {
    vi.mocked(createOptionalBrowserClient).mockReturnValue({ configured: true, client: { auth: { signOut } } } as never);
    Object.defineProperty(window, "fetch", { configurable: true, value: vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { deleted: true } }), { status: 200 })) });
  });

  it("explains deleted data and requires the exact typed confirmation", async () => {
    const user = userEvent.setup();
    render(<AccountDeletion />);
    await user.click(screen.getByRole("button", { name: "Hapus akun permanen" }));

    expect(screen.getByText("Profil dan akun keuangan")).toBeInTheDocument();
    expect(screen.getByText(/Estimasi karbon, notifikasi/)).toBeInTheDocument();
    const confirm = screen.getAllByRole("button", { name: "Hapus akun permanen" }).at(-1);
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText("Ketik DELETE untuk mengonfirmasi"), "delete");
    expect(confirm).toBeDisabled();
    await user.clear(screen.getByLabelText("Ketik DELETE untuk mengonfirmasi"));
    await user.type(screen.getByLabelText("Ketik DELETE untuk mengonfirmasi"), "DELETE");
    expect(confirm).toBeEnabled();
  });

  it("deletes remotely before signing out and clearing EcoSpend browser data", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("ecospend-demo-state-v2", "private");
    window.localStorage.setItem("other-app", "keep");
    window.sessionStorage.setItem("ecospend-session", "private");
    render(<AccountDeletion />);
    await user.click(screen.getByRole("button", { name: "Hapus akun permanen" }));
    await user.type(screen.getByLabelText("Ketik DELETE untuk mengonfirmasi"), "DELETE");
    await user.click(screen.getAllByRole("button", { name: "Hapus akun permanen" }).at(-1)!);

    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ scope: "local" }));
    expect(fetch).toHaveBeenCalledWith("/api/account/delete", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ confirmation: "DELETE" }),
    }));
    expect(window.localStorage.getItem("ecospend-demo-state-v2")).toBeNull();
    expect(window.localStorage.getItem("other-app")).toBe("keep");
    expect(window.sessionStorage.getItem("ecospend-session")).toBeNull();
    expect(clearEcoSpendWorkerCaches).toHaveBeenCalledWith(true);
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
