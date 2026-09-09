"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { initialDemoState } from "./demo-data";
import { DashboardApiError, RemoteDashboardStore } from "./remote-store";
import type { DashboardStore, DashboardState } from "./types";

export const DashboardStoreContext = createContext<DashboardStore | null>(null);
const emptyState: DashboardState = { ...initialDemoState, transactions: [], budgets: [], goals: [], accounts: [], recurring: [], rules: [] };

export function dashboardHref(href: string, isDemo: boolean): string {
  if (!isDemo) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}demo=1`;
}

function errorMessage(error: unknown): string {
  return error instanceof DashboardApiError || error instanceof Error ? error.message : "Data dasbor tidak dapat diproses";
}

export function AuthenticatedStoreProvider({ children }: { children: React.ReactNode }) {
  const remote = useRef(new RemoteDashboardStore()).current;
  const [state, setState] = useState<DashboardState>(emptyState);
  const [notifications, setNotifications] = useState<DashboardStore["notifications"]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const next = await remote.load(); setState(next); setNotifications(next.notifications); }
    catch (caught) { setError(errorMessage(caught)); }
    finally { setLoading(false); }
  }, [remote]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const execute = useCallback((operation: () => Promise<void>, options: { reload?: boolean } = { reload: true }): Promise<void> => {
    return operation().then(async () => { if (options.reload !== false) await load(); }).catch((caught: unknown) => {
      const message = errorMessage(caught); setError(message); toast.error(message);
    });
  }, [load]);
  const value = useMemo<DashboardStore>(() => ({
    ...state, notifications, isDemo: false, loading, error, retry: load,
    categorizeTransaction: (item) => remote.categorizeTransaction(item),
    addTransaction: (item) => execute(() => remote.addTransaction(item)),
    updateTransaction: (item) => execute(() => remote.updateTransaction(item)),
    deleteTransactions: (ids) => execute(() => remote.deleteTransactions(ids)),
    importTransactions: (items) => execute(() => remote.importTransactions(items)),
    bulkCategorize: (ids, category) => execute(() => remote.bulkCategorize(ids, category)),
    recalculateCarbon: () => execute(() => remote.recalculateCarbon()),
    saveBudget: (item) => execute(() => remote.saveBudget(item)), deleteBudget: (id) => execute(() => remote.deleteBudget(id)),
    saveGoal: (item) => execute(() => remote.saveGoal(item)), contributeGoal: (id, amount) => execute(() => remote.contributeGoal(id, amount)),
    withdrawGoal: (id, amount) => execute(() => remote.withdrawGoal(id, amount)),
    saveAccount: (item) => execute(() => remote.saveAccount(item)), deleteAccount: (id) => execute(() => remote.deleteAccount(id)),
    saveRecurring: (item) => execute(() => remote.saveRecurring(item)), deleteRecurring: (id) => execute(() => remote.deleteRecurring(id)),
    setPreferences: (item) => {
      setState((current) => ({ ...current, preferences: item }));
      return execute(() => remote.setPreferences(item), { reload: false });
    },
    setRules: (items) => execute(() => remote.setRules(items)),
    markNotificationsRead: (ids) => execute(() => remote.markNotificationsRead(ids)),
    resetData: async () => { const message = "Reset data hanya tersedia dalam mode demo"; setError(message); toast.error(message); },
  }), [error, execute, load, loading, notifications, remote, state]);
  return <DashboardStoreContext.Provider value={value}>{children}</DashboardStoreContext.Provider>;
}

export function useDashboardStore(): DashboardStore {
  const value = useContext(DashboardStoreContext);
  if (!value) throw new Error("useDashboardStore harus digunakan di dalam DashboardStoreProvider");
  return value;
}
