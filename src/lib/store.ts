import type { Budget, DemoState, Goal, Notification, Settings, Transaction, TransactionFilters } from "../types";
import { createDemoState } from "./demoData";

export const DEMO_STORAGE_KEY = "ecospend:demo-state:v1";
export type DemoStoreListener = (state: DemoState) => void;

export interface DemoStore {
  getState(): DemoState;
  subscribe(listener: DemoStoreListener): () => void;
  reset(): DemoState;
  createTransaction(transaction: Transaction): DemoState;
  updateTransaction(id: string, update: Partial<Omit<Transaction, "id">>): DemoState;
  deleteTransaction(id: string): DemoState;
  upsertBudget(budget: Budget): DemoState;
  deleteBudget(id: string): DemoState;
  upsertGoal(goal: Goal): DemoState;
  deleteGoal(id: string): DemoState;
  updateSettings(update: Partial<Settings>): DemoState;
  addNotification(notification: Notification): DemoState;
  markNotificationRead(id: string, read?: boolean): DemoState;
  filterTransactions(filters: TransactionFilters): readonly Transaction[];
}

export function createDemoStore(storageKey = DEMO_STORAGE_KEY): DemoStore {
  let state = loadPersistedState(storageKey) ?? createDemoState();
  const listeners = new Set<DemoStoreListener>();
  const update = (next: DemoState): DemoState => {
    state = next; persistState(storageKey, state); listeners.forEach((listener) => listener(state)); return state;
  };
  return {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    reset: () => update(createDemoState()),
    createTransaction(transaction) {
      validateTransaction(transaction, state);
      if (state.transactions.some((item) => item.id === transaction.id)) throw new Error("ID transaksi sudah digunakan.");
      return update({ ...state, transactions: [transaction, ...state.transactions] });
    },
    updateTransaction(id, changes) {
      const current = state.transactions.find((item) => item.id === id);
      if (!current) throw new Error("Transaksi tidak ditemukan.");
      const transaction = { ...current, ...changes, id };
      validateTransaction(transaction, state);
      return update({ ...state, transactions: state.transactions.map((item) => item.id === id ? transaction : item) });
    },
    deleteTransaction(id) {
      if (!state.transactions.some((item) => item.id === id)) return state;
      return update({ ...state, transactions: state.transactions.filter((item) => item.id !== id) });
    },
    upsertBudget(budget) {
      validateBudget(budget, state);
      const exists = state.budgets.some((item) => item.id === budget.id);
      return update({ ...state, budgets: exists ? state.budgets.map((item) => item.id === budget.id ? budget : item) : [...state.budgets, budget] });
    },
    deleteBudget(id) { return update({ ...state, budgets: state.budgets.filter((item) => item.id !== id) }); },
    upsertGoal(goal) {
      validateGoal(goal, state);
      const exists = state.goals.some((item) => item.id === goal.id);
      return update({ ...state, goals: exists ? state.goals.map((item) => item.id === goal.id ? goal : item) : [...state.goals, goal] });
    },
    deleteGoal(id) { return update({ ...state, goals: state.goals.filter((item) => item.id !== id) }); },
    updateSettings(changes) {
      const settings = { ...state.settings, ...changes };
      if (settings.monthlyStartDay < 1 || settings.monthlyStartDay > 28) throw new Error("Tanggal awal bulan harus 1–28.");
      return update({ ...state, settings });
    },
    addNotification(notification) {
      if (state.notifications.some((item) => item.id === notification.id)) throw new Error("ID notifikasi sudah digunakan.");
      return update({ ...state, notifications: [notification, ...state.notifications] });
    },
    markNotificationRead(id, read = true) {
      return update({ ...state, notifications: state.notifications.map((item) => item.id === id ? { ...item, read } : item) });
    },
    filterTransactions: (filters) => filterTransactions(state.transactions, filters),
  };
}

export function filterTransactions(transactions: readonly Transaction[], filters: TransactionFilters): readonly Transaction[] {
  const search = filters.search?.trim().toLocaleLowerCase("id-ID");
  return transactions.filter((item) =>
    (!filters.from || item.date >= filters.from) && (!filters.to || item.date <= filters.to) &&
    (!filters.direction || item.direction === filters.direction) &&
    (!filters.accountIds?.length || filters.accountIds.includes(item.accountId)) &&
    (!filters.categoryIds?.length || (item.categoryId !== undefined && filters.categoryIds.includes(item.categoryId))) &&
    (!filters.paymentMethods?.length || filters.paymentMethods.includes(item.paymentMethod)) &&
    (!filters.tags?.length || filters.tags.every((tag) => item.tags.includes(tag))) &&
    (!search || `${item.merchant} ${item.note ?? ""} ${item.tags.join(" ")}`.toLocaleLowerCase("id-ID").includes(search))
  );
}

function validateTransaction(transaction: Transaction, state: DemoState): void {
  if (transaction.amount.amountMinor <= 0n) throw new Error("Nominal harus lebih dari nol.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(transaction.date)) throw new Error("Tanggal transaksi tidak valid.");
  const account = state.accounts.find((item) => item.id === transaction.accountId);
  if (!account) throw new Error("Akun tidak ditemukan.");
  if (account.openingBalance.currency !== transaction.amount.currency) throw new Error("Mata uang transaksi tidak sesuai akun.");
  if (transaction.direction === "transfer") {
    if (!transaction.transferAccountId || transaction.transferAccountId === transaction.accountId) throw new Error("Tujuan transfer tidak valid.");
  } else {
    const category = state.categories.find((item) => item.id === transaction.categoryId);
    if (!category || category.kind !== transaction.direction) throw new Error("Kategori transaksi tidak valid.");
  }
}
function validateBudget(budget: Budget, state: DemoState): void {
  if (budget.limit.amountMinor <= 0n) throw new Error("Batas anggaran harus lebih dari nol.");
  if (!/^\d{4}-\d{2}$/.test(budget.month)) throw new Error("Bulan anggaran tidak valid.");
  if (!budget.categoryIds.length || budget.categoryIds.some((id) => !state.categories.some((item) => item.id === id && item.kind === "expense"))) throw new Error("Kategori anggaran tidak valid.");
}
function validateGoal(goal: Goal, state: DemoState): void {
  if (goal.target.amountMinor <= 0n || goal.initialAmount.amountMinor < 0n) throw new Error("Nilai target tidak valid.");
  if (goal.contributions.some((item) => item.amount.amountMinor <= 0n || !state.accounts.some((account) => account.id === item.accountId))) throw new Error("Kontribusi target tidak valid.");
}

function getBrowserStorage(): Storage | undefined {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined" ? window.localStorage : undefined;
}
function persistState(key: string, state: DemoState): void {
  try { getBrowserStorage()?.setItem(key, stringifyState(state)); } catch { /* Storage may be unavailable or full. */ }
}
function loadPersistedState(key: string): DemoState | undefined {
  try {
    const serialized = getBrowserStorage()?.getItem(key);
    return serialized ? parseState(serialized) : undefined;
  } catch { return undefined; }
}
export function stringifyState(state: DemoState): string {
  return JSON.stringify(state, (_key, value: unknown) => typeof value === "bigint" ? { $bigint: value.toString() } : value);
}
export function parseState(serialized: string): DemoState | undefined {
  try {
    const parsed: unknown = JSON.parse(serialized, (_key, value: unknown) => isBigIntEnvelope(value) ? BigInt(value.$bigint) : value);
    return isDemoState(parsed) ? parsed : undefined;
  } catch { return undefined; }
}
function isBigIntEnvelope(value: unknown): value is { readonly $bigint: string } {
  return typeof value === "object" && value !== null && "$bigint" in value && typeof (value as { readonly $bigint?: unknown }).$bigint === "string";
}
function isDemoState(value: unknown): value is DemoState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<DemoState>;
  return candidate.schemaVersion === 1 && Array.isArray(candidate.accounts) && Array.isArray(candidate.categories) &&
    Array.isArray(candidate.transactions) && Array.isArray(candidate.budgets) && Array.isArray(candidate.goals) &&
    Array.isArray(candidate.recurringTransactions) && Array.isArray(candidate.emissionFactors) &&
    Array.isArray(candidate.notifications) && typeof candidate.settings === "object" && candidate.settings !== null;
}
