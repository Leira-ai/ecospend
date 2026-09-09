import { initialDemoState } from "./demo-data";
import {
  buildDashboardState, mapNotifications, toMinorString, unwrapList, type ApiRecord,
} from "./store-adapters";
import type {
  Account, Budget, DashboardNotification, DashboardState, Goal, MerchantRule,
  Preferences, Recurring, Transaction,
} from "./types";

export class DashboardApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

export type RemoteSnapshot = DashboardState & { notifications: DashboardNotification[] };
export type DashboardFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const endpoints = [
  "/api/profile", "/api/accounts", "/api/categories", "/api/transactions?page=1&pageSize=100",
  "/api/budgets", "/api/goals", "/api/recurring", "/api/merchant-rules", "/api/notifications", "/api/carbon",
] as const;

const messageFromError = async (response: Response): Promise<string> => {
  const value: unknown = await response.clone().json().catch(() => null);
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = (value as Readonly<Record<string, unknown>>).error;
    if (typeof error === "object" && error !== null && "message" in error) return String((error as Readonly<Record<string, unknown>>).message);
  }
  return `Permintaan gagal (${response.status})`;
};

async function request(fetcher: DashboardFetch, url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try { response = await fetcher(url, init); } catch { throw new DashboardApiError("Tidak dapat terhubung ke layanan EcoSpend"); }
  if (!response.ok) throw new DashboardApiError(await messageFromError(response), response.status);
  if (response.status === 204) return null;
  return response.json().catch(() => { throw new DashboardApiError("Respons layanan EcoSpend tidak valid", response.status); });
}

const mutate = (fetcher: DashboardFetch, url: string, method: "POST" | "PATCH" | "DELETE", body: unknown): Promise<unknown> => request(fetcher, url, {
  method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
});
const accountKind = (type: Account["type"]): "cash" | "bank" | "e_wallet" => type === "Tunai" ? "cash" : type === "Dompet digital" ? "e_wallet" : "bank";
const transactionKind = (type: Transaction["type"]): "expense" | "income" => type === "pemasukan" ? "income" : "expense";
const isoDate = (date: string): string => `${date}T00:00:00.000Z`;
const nextMonthlyDate = (day: number): string => `2026-10-${String(Math.min(28, Math.max(1, Math.trunc(day)))).padStart(2, "0")}`;

export class RemoteDashboardStore {
  private snapshot?: RemoteSnapshot;
  constructor(private readonly fetcher: DashboardFetch = fetch) {}

  private requireSnapshot(): RemoteSnapshot {
    if (!this.snapshot) throw new DashboardApiError("Data dasbor belum dimuat");
    return this.snapshot;
  }
  private accountId(name: string): string {
    const account = this.requireSnapshot().accounts.find((item) => item.name === name);
    if (!account) throw new DashboardApiError(`Akun ${name} tidak tersedia`);
    return account.id;
  }
  private categoryId(name: string): string {
    const category = this.categories.find((item) => String(item.name) === name);
    if (!category) throw new DashboardApiError(`Kategori ${name} tidak tersedia`);
    return String(category.id);
  }
  private categories: ApiRecord[] = [];

  async load(): Promise<RemoteSnapshot> {
    const [profile, accounts, categories, transactions, budgets, goals, recurring, rules, notifications, carbon] = await Promise.all(
      endpoints.map((url) => request(this.fetcher, url)),
    );
    this.categories = unwrapList(categories, "categories");
    this.snapshot = {
      ...buildDashboardState({
        profile, accounts: unwrapList(accounts, "accounts"), categories: this.categories,
        transactions: unwrapList(transactions, "transactions"), budgets: unwrapList(budgets, "budgets"),
        goals: unwrapList(goals, "goals"), recurring: unwrapList(recurring, "recurring"),
        rules: unwrapList(rules, "merchant-rules"), carbon: unwrapList(carbon, "carbon"),
        fallbackPreferences: initialDemoState.preferences,
      }), notifications: mapNotifications(unwrapList(notifications, "notifications")),
    };
    return this.snapshot;
  }

  categorizeTransaction(item: Transaction): Transaction {
    if (item.type !== "pengeluaran") return item.type === "transfer" ? { ...item, category: "Transfer", carbonKg: 0 } : { ...item, carbonKg: 0 };
    const rule = this.requireSnapshot().rules.find((candidate) => item.name.toLocaleLowerCase("id-ID").includes(candidate.merchant.toLocaleLowerCase("id-ID")));
    return rule ? { ...item, category: rule.category } : item;
  }
  async addTransaction(item: Transaction): Promise<void> {
    if (item.type === "transfer") {
      if (!item.destinationAccount) throw new DashboardApiError("Akun tujuan transfer wajib dipilih");
      await mutate(this.fetcher, "/api/transactions/transfer", "POST", {
        sourceAccountId: this.accountId(item.account), destinationAccountId: this.accountId(item.destinationAccount),
        amountMinor: toMinorString(item.amount), transactedAt: isoDate(item.date), description: item.name, notes: item.notes ?? null,
      }); return;
    }
    await mutate(this.fetcher, "/api/transactions", "POST", this.transactionBody(item));
  }
  async updateTransaction(item: Transaction): Promise<void> {
    if (item.type === "transfer") throw new DashboardApiError("Transfer yang tersimpan tidak dapat diedit melalui API");
    await mutate(this.fetcher, "/api/transactions", "PATCH", { id: item.id, ...this.transactionBody(item) });
  }
  private transactionBody(item: Transaction): Readonly<Record<string, unknown>> {
    return { accountId: this.accountId(item.account), categoryId: this.categoryId(item.category), kind: transactionKind(item.type), status: "cleared",
      amountMinor: toMinorString(item.amount), currencyCode: "IDR", merchantName: item.name, description: item.name,
      notes: item.notes ?? null, transactedAt: isoDate(item.date), postedAt: null };
  }
  async deleteTransactions(ids: string[]): Promise<void> {
    if (ids.length === 1) { await mutate(this.fetcher, "/api/transactions", "DELETE", { id: ids[0] }); return; }
    await mutate(this.fetcher, "/api/transactions/bulk", "POST", { operation: "delete", ids });
  }
  async importTransactions(items: Transaction[]): Promise<void> {
    for (const item of items) await this.addTransaction(item);
  }
  async bulkCategorize(ids: string[], category: string): Promise<void> {
    await mutate(this.fetcher, "/api/transactions/bulk", "POST", { operation: "category", ids, categoryId: this.categoryId(category) });
  }
  async recalculateCarbon(): Promise<void> {
    throw new DashboardApiError("API karbon memerlukan faktor dan aktivitas per transaksi; hitung ulang massal belum tersedia");
  }
  async saveBudget(item: Budget): Promise<void> {
    const exists = this.requireSnapshot().budgets.some((row) => row.id === item.id);
    const body = { categoryId: this.categoryId(item.category), name: item.category, amountMinor: toMinorString(item.limit), currencyCode: "IDR",
      period: "monthly", startsOn: "2026-09-01", endsOn: null, rolloverEnabled: false, isActive: true, alertThresholdPercent: 80 };
    await mutate(this.fetcher, "/api/budgets", exists ? "PATCH" : "POST", exists ? { id: item.id, ...body } : body);
  }
  async deleteBudget(id: string): Promise<void> { await mutate(this.fetcher, "/api/budgets", "DELETE", { id }); }
  async saveGoal(item: Goal): Promise<void> {
    const exists = this.requireSnapshot().goals.some((row) => row.id === item.id);
    const body = { accountId: null, name: item.name, targetAmountMinor: toMinorString(item.target), currencyCode: "IDR",
      targetDate: item.deadline, status: item.saved >= item.target ? "completed" : "active", notes: null };
    await mutate(this.fetcher, "/api/goals", exists ? "PATCH" : "POST", exists ? { id: item.id, ...body } : body);
  }
  async contributeGoal(id: string, amount: number): Promise<void> {
    await mutate(this.fetcher, "/api/goals/contributions", "POST", { goalId: id, amountMinor: toMinorString(amount) });
  }
  async withdrawGoal(id?: string, amount?: number): Promise<void> {
    void id; void amount;
    throw new DashboardApiError("API hanya dapat menghapus kontribusi berdasarkan ID kontribusi; penarikan nominal belum tersedia");
  }
  async saveAccount(item: Account): Promise<void> {
    const exists = this.requireSnapshot().accounts.some((row) => row.id === item.id);
    const body = { name: item.name, type: accountKind(item.type), currencyCode: "IDR", openingBalanceMinor: toMinorString(item.balance),
      institutionName: null, lastFour: null };
    await mutate(this.fetcher, "/api/accounts", exists ? "PATCH" : "POST", exists ? { id: item.id, ...body } : body);
  }
  async deleteAccount(id: string): Promise<void> { await mutate(this.fetcher, "/api/accounts", "DELETE", { id, archived: true }); }
  async saveRecurring(item: Recurring): Promise<void> {
    const exists = this.requireSnapshot().recurring.some((row) => row.id === item.id);
    const account = this.requireSnapshot().accounts[0];
    if (!account) throw new DashboardApiError("Tambahkan akun sebelum membuat transaksi berulang");
    const body = { accountId: account.id, categoryId: this.categoryId(item.category), kind: "expense", amountMinor: toMinorString(item.amount),
      currencyCode: "IDR", merchantName: item.name, description: item.name, frequency: "monthly", intervalCount: 1,
      nextDueOn: nextMonthlyDate(item.day), endsOn: null, isActive: item.active };
    await mutate(this.fetcher, "/api/recurring", exists ? "PATCH" : "POST", exists ? { id: item.id, ...body } : body);
  }
  async deleteRecurring(id: string): Promise<void> { await mutate(this.fetcher, "/api/recurring", "DELETE", { id }); }
  async setPreferences(item: Preferences): Promise<void> {
    const current = this.requireSnapshot().preferences;
    if (item.displayName !== current.displayName) await mutate(this.fetcher, "/api/profile", "PATCH", { displayName: item.displayName });
  }
  async setRules(items: MerchantRule[]): Promise<void> {
    const current = this.requireSnapshot().rules;
    const removed = current.filter((rule) => !items.some((item) => item.id === rule.id));
    const added = items.filter((item) => !current.some((rule) => rule.id === item.id));
    for (const rule of removed) await mutate(this.fetcher, "/api/merchant-rules", "DELETE", { id: rule.id });
    for (const rule of added) await mutate(this.fetcher, "/api/merchant-rules", "POST", {
      accountId: null, categoryId: this.categoryId(rule.category), pattern: rule.merchant,
      matchType: "contains", caseSensitive: false, priority: 100, isEnabled: true,
    });
  }
  async markNotificationsRead(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await mutate(this.fetcher, "/api/notifications", "PATCH", { ids, status: "read" });
  }
}
