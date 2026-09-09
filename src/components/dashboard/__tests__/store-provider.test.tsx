import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DemoProvider } from "../demo-store";
import { RemoteDashboardStore } from "../remote-store";
import { AuthenticatedStoreProvider, dashboardHref, useDashboardStore } from "../store-context";

const jsonResponse = (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" }, ...init });
const profile = { data: { id: "u1", display_name: "Ayu", currency_code: "IDR" } };
const endpointData: Readonly<Record<string, unknown>> = {
  "/api/profile": profile, "/api/accounts": { data: [] }, "/api/categories": { data: [] },
  "/api/transactions?page=1&pageSize=100": { data: [] }, "/api/budgets": { data: [] },
  "/api/goals": { data: [] }, "/api/recurring": { data: [] }, "/api/merchant-rules": { data: [] },
  "/api/notifications": { data: [] }, "/api/carbon": { data: [] },
};

function Probe() {
  const store = useDashboardStore();
  return <div><span>{store.isDemo ? "demo" : "authenticated"}</span><span>{store.preferences.displayName}</span><span>{store.error}</span><button onClick={() => void store.retry()}>retry</button></div>;
}

describe("dashboard providers and remote store", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/dashboard"); window.localStorage.clear(); });

  it("keeps demo entirely local and does not call APIs", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("unexpected"));
    render(<DemoProvider><Probe /></DemoProvider>);
    expect(screen.getByText("demo")).toBeInTheDocument();
    expect(screen.getByText("Pengguna Demo")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not read or write localStorage for authenticated data", async () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem"); const setSpy = vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => jsonResponse(endpointData[String(input)]));
    render(<AuthenticatedStoreProvider><Probe /></AuthenticatedStoreProvider>);
    expect(await screen.findByText("Ayu")).toBeInTheDocument();
    expect(screen.getByText("authenticated")).toBeInTheDocument();
    expect(getSpy).not.toHaveBeenCalled(); expect(setSpy).not.toHaveBeenCalled();
  });

  it("preserves the query only for demo navigation", () => {
    expect(dashboardHref("/dashboard/transaksi", true)).toBe("/dashboard/transaksi?demo=1");
    expect(dashboardHref("/dashboard/transaksi?new=1", true)).toBe("/dashboard/transaksi?new=1&demo=1");
    expect(dashboardHref("/dashboard/transaksi", false)).toBe("/dashboard/transaksi");
  });

  it("uses the dedicated transfer endpoint and JSON wire money", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input); if (url in endpointData) {
        if (url === "/api/accounts") return jsonResponse({ data: [
          { id: "10000000-0000-4000-8000-000000000001", name: "Bank", type: "bank", opening_balance_minor: "0" },
          { id: "10000000-0000-4000-8000-000000000002", name: "Dompet", type: "e_wallet", opening_balance_minor: "0" },
        ] });
        return jsonResponse(endpointData[url]);
      }
      expect(init?.headers).toEqual({ "Content-Type": "application/json" }); return jsonResponse({ data: {} }, { status: 201 });
    });
    const store = new RemoteDashboardStore(fetcher); await store.load();
    await store.addTransaction({ id: "client", date: "2026-09-08", name: "Isi saldo", category: "Transfer", account: "Bank", destinationAccount: "Dompet", type: "transfer", amount: 15000, carbonKg: 0 });
    expect(fetcher).toHaveBeenLastCalledWith("/api/transactions/transfer", expect.objectContaining({ method: "POST", body: expect.stringContaining('"amountMinor":"15000"') }));
  });

  it("surfaces API errors and allows retry", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ error: { message: "Sesi berakhir" } }, { status: 401 }));
    render(<AuthenticatedStoreProvider><Probe /></AuthenticatedStoreProvider>);
    expect(await screen.findByText("Sesi berakhir")).toBeInTheDocument();
    const calls = fetchSpy.mock.calls.length; fireEvent.click(screen.getByRole("button", { name: "retry" }));
    await waitFor(() => expect(fetchSpy.mock.calls.length).toBeGreaterThan(calls));
  });
});
