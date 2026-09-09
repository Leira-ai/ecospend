"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { categorizeMerchant, type MerchantRule as CategorizationRule } from "@/lib/categorization";
import { DEMO_CURRENT_DATE, estimateDemoTransactionCarbon, initialDemoState } from "./demo-data";
import { DashboardStoreContext, useDashboardStore } from "./store-context";
import type { Account, DashboardNotification, DashboardStore, DemoState, Goal, MerchantRule, Preferences, Transaction } from "./types";

const STORAGE_KEY = "ecospend-demo-state-v2";

export type GoalContributionLimits = { canContribute: boolean; canWithdraw: boolean; maximumContribution: number; maximumWithdrawal: number };

export function goalContributionLimits(goal: Goal): GoalContributionLimits {
  const target = Math.max(0, Number.isFinite(goal.target) ? goal.target : 0);
  const saved = Math.min(target, Math.max(0, Number.isFinite(goal.saved) ? goal.saved : 0));
  const deadlineActive = /^\d{4}-\d{2}-\d{2}$/.test(goal.deadline) && goal.deadline >= DEMO_CURRENT_DATE;
  return { canContribute: target > 0 && saved < target && deadlineActive, canWithdraw: saved > 0, maximumContribution: deadlineActive ? Math.max(0, target - saved) : 0, maximumWithdrawal: saved };
}

export function applyMerchantRule(transaction: Transaction, rules: readonly MerchantRule[]): Transaction {
  if (transaction.type !== "pengeluaran" || !rules.length) return transaction;
  const categorizationRules: CategorizationRule[] = rules.map((rule, index) => ({
    id: rule.id, categoryId: rule.category, merchantPatterns: [rule.merchant],
    confidenceBasisPoints: 10_000n, priority: rules.length - index,
  }));
  const result = categorizeMerchant(transaction.name, categorizationRules);
  return result.categoryId ? { ...transaction, category: result.categoryId } : transaction;
}

export function normalizeDemoTransaction(transaction: Transaction, rules: readonly MerchantRule[], method: Preferences["carbonMethod"]): Transaction {
  const categorized = applyMerchantRule(transaction, rules);
  if (categorized.type === "transfer") return { ...categorized, category: "Transfer", carbonKg: 0 };
  if (categorized.type === "pemasukan") return { ...categorized, carbonKg: 0 };
  return { ...categorized, carbonKg: estimateDemoTransactionCarbon(categorized, method).carbonKg };
}

export function deriveAccountBalance(account: Account, transactions: readonly Transaction[]): number {
  return transactions.reduce((balance, transaction) => {
    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) return balance;
    if (transaction.type === "pemasukan" && transaction.account === account.name) return balance + transaction.amount;
    if (transaction.type === "pengeluaran" && transaction.account === account.name) return balance - transaction.amount;
    if (transaction.type !== "transfer" || !transaction.destinationAccount || transaction.destinationAccount === transaction.account) return balance;
    if (transaction.account === account.name) return balance - transaction.amount;
    if (transaction.destinationAccount === account.name) return balance + transaction.amount;
    return balance;
  }, account.balance);
}

export function deriveAccounts(accounts: readonly Account[], transactions: readonly Transaction[]): Account[] {
  return accounts.map((account) => ({ ...account, balance: deriveAccountBalance(account, transactions) }));
}

type DemoContextValue = Omit<DashboardStore, "isDemo" | "loading" | "error" | "notifications" | "retry" | "markNotificationsRead">;

const DemoContext = createContext<DemoContextValue | null>(null);
const initialDemoNotifications: DashboardNotification[] = [
  { id: "budget", title: "Anggaran makanan mendekati batas", detail: "Penggunaan bulan ini sudah mencapai 82%.", status: "unread" },
  { id: "goal", title: "Target dana darurat bertambah", detail: "Anda telah mencapai 65% dari target demo.", status: "unread" },
  { id: "weekly", title: "Ringkasan mingguan tersedia", detail: "Pengeluaran transportasi turun dibanding minggu lalu.", status: "unread" },
];

function normalizeState(state: DemoState): DemoState {
  const preferences = state.preferences ?? initialDemoState.preferences;
  const rules = state.rules ?? [];
  return {
    ...state, preferences, rules,
    transactions: state.transactions.map((item) => normalizeDemoTransaction(item, rules, preferences.carbonMethod)),
    goals: state.goals.filter((goal) => Number.isFinite(goal.target) && goal.target > 0).map((goal) => ({ ...goal, saved: Math.min(goal.target, Math.max(0, goal.saved)) })),
  };
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(() => {
    if (typeof window === "undefined") return initialDemoState;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? normalizeState(JSON.parse(stored) as DemoState) : initialDemoState;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return initialDemoState;
    }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  const update = useCallback((recipe: (current: DemoState) => DemoState) => setState(recipe), []);
  const accounts = useMemo(() => deriveAccounts(state.accounts, state.transactions), [state.accounts, state.transactions]);
  const value = useMemo<DemoContextValue>(() => ({
    ...state, accounts,
    addTransaction: async (item) => update((current) => ({ ...current, transactions: [normalizeDemoTransaction(item, current.rules, current.preferences.carbonMethod), ...current.transactions] })),
    updateTransaction: async (item) => update((current) => ({ ...current, transactions: current.transactions.map((row) => row.id === item.id ? normalizeDemoTransaction(item, current.rules, current.preferences.carbonMethod) : row) })),
    deleteTransactions: async (ids) => update((current) => ({ ...current, transactions: current.transactions.filter((row) => !ids.includes(row.id)) })),
    importTransactions: async (items) => update((current) => ({ ...current, transactions: [...items.map((item) => normalizeDemoTransaction(item, current.rules, current.preferences.carbonMethod)), ...current.transactions] })),
    bulkCategorize: async (ids, category) => update((current) => ({ ...current, transactions: current.transactions.map((row) => ids.includes(row.id) ? normalizeDemoTransaction({ ...row, category }, current.rules, current.preferences.carbonMethod) : row) })),
    recalculateCarbon: async () => update((current) => ({ ...current, transactions: current.transactions.map((item) => normalizeDemoTransaction(item, current.rules, current.preferences.carbonMethod)) })),
    categorizeTransaction: (item) => normalizeDemoTransaction(item, state.rules, state.preferences.carbonMethod),
    saveBudget: async (item) => { if (!Number.isFinite(item.limit) || item.limit <= 0) return; update((current) => ({ ...current, budgets: current.budgets.some((row) => row.id === item.id) ? current.budgets.map((row) => row.id === item.id ? item : row) : [...current.budgets, item] })); },
    deleteBudget: async (id) => update((current) => ({ ...current, budgets: current.budgets.filter((row) => row.id !== id) })),
    saveGoal: async (item) => { if (!Number.isFinite(item.target) || item.target <= 0) return; const goal = { ...item, saved: Math.min(item.target, Math.max(0, item.saved)) }; update((current) => ({ ...current, goals: current.goals.some((row) => row.id === goal.id) ? current.goals.map((row) => row.id === goal.id ? goal : row) : [...current.goals, goal] })); },
    contributeGoal: async (id, amount) => { if (!Number.isFinite(amount) || amount <= 0) return; update((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === id ? { ...goal, saved: Math.min(goal.target, goal.saved + Math.min(amount, goalContributionLimits(goal).maximumContribution)) } : goal) })); },
    withdrawGoal: async (id, amount) => { if (!Number.isFinite(amount) || amount <= 0) return; update((current) => ({ ...current, goals: current.goals.map((goal) => goal.id === id ? { ...goal, saved: Math.max(0, goal.saved - Math.min(amount, goalContributionLimits(goal).maximumWithdrawal)) } : goal) })); },
    saveAccount: async (item) => update((current) => ({ ...current, accounts: current.accounts.some((row) => row.id === item.id) ? current.accounts.map((row) => row.id === item.id ? item : row) : [...current.accounts, item] })),
    deleteAccount: async (id) => update((current) => ({ ...current, accounts: current.accounts.filter((row) => row.id !== id) })),
    saveRecurring: async (item) => update((current) => ({ ...current, recurring: current.recurring.some((row) => row.id === item.id) ? current.recurring.map((row) => row.id === item.id ? item : row) : [...current.recurring, item] })),
    deleteRecurring: async (id) => update((current) => ({ ...current, recurring: current.recurring.filter((row) => row.id !== id) })),
    setPreferences: async (preferences) => update((current) => ({
      ...current, preferences,
      transactions: preferences.carbonMethod === current.preferences.carbonMethod
        ? current.transactions
        : current.transactions.map((item) => normalizeDemoTransaction(item, current.rules, preferences.carbonMethod)),
    })),
    setRules: async (rules) => update((current) => ({ ...current, rules })),
    resetData: async () => setState(initialDemoState),
  }), [accounts, state, update]);
  const [notifications, setNotifications] = useState(initialDemoNotifications);
  const dashboardValue = useMemo<DashboardStore>(() => ({ ...value, isDemo: true, loading: false, error: null, notifications,
    retry: async () => undefined,
    markNotificationsRead: async (ids) => setNotifications((current) => current.map((item) => ids.includes(item.id) ? { ...item, status: "read" } : item)),
  }), [notifications, value]);
  return <DemoContext.Provider value={value}><DashboardStoreContext.Provider value={dashboardValue}>{children}</DashboardStoreContext.Provider></DemoContext.Provider>;
}

export function useDemoStore(): DashboardStore {
  return useDashboardStore();
}
