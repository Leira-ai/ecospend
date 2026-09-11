import type { Account, Budget, BudgetStatus, Goal, GoalProgress, Money, Rate, Transaction } from "../types";
import { money, ratioToRate, subtractMoney, sumMoney } from "./money";

export interface FinanceSummary {
  readonly income: Money;
  readonly expense: Money;
  readonly cashFlow: Money;
  readonly savingsRate: Rate;
}

export interface CashFlowForecast {
  readonly asOf: string;
  readonly through: string;
  readonly projectedIncome: Money;
  readonly projectedExpense: Money;
  readonly projectedCashFlow: Money;
}

export interface TransferValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const inRange = (date: string, from?: string, to?: string): boolean =>
  (!from || date >= from) && (!to || date <= to);

export function accountBalance(account: Account, transactions: readonly Transaction[]): Money {
  const changes = transactions.reduce((total, transaction) => {
    if (transaction.direction === "income" && transaction.accountId === account.id) return total + transaction.amount.amountMinor;
    if (transaction.direction === "expense" && transaction.accountId === account.id) return total - transaction.amount.amountMinor;
    if (transaction.direction === "transfer") {
      if (transaction.accountId === account.id) return total - transaction.amount.amountMinor;
      if (transaction.transferAccountId === account.id) return total + transaction.amount.amountMinor;
    }
    return total;
  }, 0n);
  return money(account.openingBalance.amountMinor + changes, account.openingBalance.currency);
}

export function totalBalance(accounts: readonly Account[], transactions: readonly Transaction[]): Money {
  return sumMoney(accounts.filter((account) => !account.archived).map((account) => accountBalance(account, transactions)));
}

export function financeSummary(transactions: readonly Transaction[], from?: string, to?: string): FinanceSummary {
  const included = transactions.filter((item) => inRange(item.date, from, to));
  const currency = included[0]?.amount.currency ?? "IDR";
  const income = sumMoney(included.filter((item) => item.direction === "income").map((item) => item.amount), currency);
  const expense = sumMoney(included.filter((item) => item.direction === "expense").map((item) => item.amount), currency);
  const cashFlow = subtractMoney(income, expense);
  return { income, expense, cashFlow, savingsRate: ratioToRate(cashFlow.amountMinor, income.amountMinor) };
}

export function budgetStatus(budget: Budget, transactions: readonly Transaction[]): BudgetStatus {
  const spent = sumMoney(transactions.filter((transaction) =>
    transaction.direction === "expense" && transaction.date.startsWith(budget.month) &&
    transaction.categoryId !== undefined && budget.categoryIds.includes(transaction.categoryId)
  ).map((transaction) => transaction.amount), budget.limit.currency);
  const remaining = subtractMoney(budget.limit, spent);
  return {
    budget, spent, remaining,
    utilization: ratioToRate(spent.amountMinor, budget.limit.amountMinor),
    exceeded: spent.amountMinor > budget.limit.amountMinor,
  };
}

export function goalProgress(goal: Goal): GoalProgress {
  const contributions = sumMoney(goal.contributions.map((item) => item.amount), goal.target.currency);
  const saved = money(goal.initialAmount.amountMinor + contributions.amountMinor, goal.target.currency);
  const remaining = money(goal.target.amountMinor > saved.amountMinor ? goal.target.amountMinor - saved.amountMinor : 0n, goal.target.currency);
  return {
    goal, saved, remaining,
    progress: ratioToRate(saved.amountMinor, goal.target.amountMinor),
    completed: saved.amountMinor >= goal.target.amountMinor,
  };
}

export function addGoalContribution(goal: Goal, contribution: Goal["contributions"][number]): Goal {
  if (contribution.amount.currency !== goal.target.currency) throw new Error("Mata uang kontribusi tidak sesuai.");
  if (contribution.amount.amountMinor <= 0n) throw new Error("Kontribusi harus lebih dari nol.");
  if (goal.contributions.some((item) => item.id === contribution.id)) throw new Error("ID kontribusi sudah digunakan.");
  return { ...goal, contributions: [...goal.contributions, contribution] };
}

export function validateTransfer(transaction: Transaction, accounts: readonly Account[]): TransferValidation {
  const errors: string[] = [];
  if (transaction.direction !== "transfer") errors.push("Transaksi bukan transfer.");
  if (!transaction.transferAccountId) errors.push("Rekening tujuan wajib diisi.");
  if (transaction.transferAccountId === transaction.accountId) errors.push("Rekening asal dan tujuan harus berbeda.");
  const source = accounts.find((item) => item.id === transaction.accountId);
  const destination = accounts.find((item) => item.id === transaction.transferAccountId);
  if (!source) errors.push("Rekening asal tidak ditemukan.");
  if (!destination) errors.push("Rekening tujuan tidak ditemukan.");
  if (source && destination && source.openingBalance.currency !== destination.openingBalance.currency) {
    errors.push("Transfer lintas mata uang belum didukung.");
  }
  if (transaction.amount.amountMinor <= 0n) errors.push("Jumlah transfer harus lebih dari nol.");
  if (transaction.categoryId) errors.push("Transfer tidak boleh memiliki kategori pendapatan/belanja.");
  return { valid: errors.length === 0, errors };
}

export function forecastCashFlow(transactions: readonly Transaction[], asOf: string, through: string): CashFlowForecast {
  if (through < asOf) throw new Error("Tanggal akhir proyeksi harus setelah tanggal awal.");
  const history = transactions.filter((item) => item.date <= asOf && item.direction !== "transfer");
  const earliest = history.reduce<string | undefined>((value, item) => !value || item.date < value ? item.date : value, undefined);
  const historyDays = earliest ? Math.max(1, daysBetween(earliest, asOf) + 1) : 1;
  const forecastDays = Math.max(0, daysBetween(asOf, through));
  const summary = financeSummary(history);
  const projectedIncome = money(summary.income.amountMinor * BigInt(forecastDays) / BigInt(historyDays), summary.income.currency);
  const projectedExpense = money(summary.expense.amountMinor * BigInt(forecastDays) / BigInt(historyDays), summary.expense.currency);
  return { asOf, through, projectedIncome, projectedExpense, projectedCashFlow: subtractMoney(projectedIncome, projectedExpense) };
}

function daysBetween(from: string, to: string): number {
  return Math.trunc((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function getCashFlowStatus(
  income: Money,
  expense: Money,
): { status: "surplus" | "deficit" | "balanced"; label: string; tone: "emerald" | "rose" | "slate" } {
  if (income.amountMinor > expense.amountMinor) {
    return { status: "surplus", label: "Surplus kas sehat", tone: "emerald" };
  }
  if (income.amountMinor < expense.amountMinor) {
    return { status: "deficit", label: "Pengeluaran melebihi pemasukan", tone: "rose" };
  }
  return { status: "balanced", label: "Arus kas seimbang", tone: "slate" };
}

export function computePercentageChange(current: bigint | number, previous: bigint | number): number {
  const c = typeof current === "bigint" ? Number(current) : current;
  const p = typeof previous === "bigint" ? Number(previous) : previous;
  if (p === 0) return c > 0 ? 100 : c < 0 ? -100 : 0;
  return Math.round(((c - p) / Math.abs(p)) * 100);
}

export function getBudgetThresholdStatus(spent: Money, limit: Money): "normal" | "warning" | "exceeded" {
  if (limit.amountMinor <= 0n) return "normal";
  if (spent.amountMinor >= limit.amountMinor) return "exceeded";
  if (spent.amountMinor * 10n >= limit.amountMinor * 8n) return "warning";
  return "normal";
}

const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  "Makanan & Minuman": "#10b981",
  "Transportasi": "#0ea5e9",
  "Belanja": "#f59e0b",
  "Tagihan": "#ef4444",
  "Hiburan": "#8b5cf6",
  "Kesehatan": "#ec4899",
  "Pendidikan": "#6366f1",
  "Investasi": "#14b8a6",
  "Lainnya": "#64748b",
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "#10b981";
}

