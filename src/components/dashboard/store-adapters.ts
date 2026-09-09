import type {
  Account, Budget, DashboardNotification, DashboardState, Goal, MerchantRule,
  Preferences, Recurring, Transaction,
} from "./types";

export type ApiRecord = Readonly<Record<string, unknown>>;
export type Lookup = ReadonlyMap<string, string>;

const objectRecord = (value: unknown, label: string): ApiRecord => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label} tidak valid`);
  return value as ApiRecord;
};
const text = (record: ApiRecord, key: string, fallback = ""): string => {
  const value = record[key];
  return typeof value === "string" ? value : fallback;
};
const optionalText = (record: ApiRecord, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};
const bool = (record: ApiRecord, key: string, fallback = false): boolean => {
  const value = record[key];
  return typeof value === "boolean" ? value : fallback;
};
const integer = (record: ApiRecord, key: string, fallback: number): number => {
  const value = record[key];
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
};

export function parseSafeMinor(value: unknown, field = "amount_minor"): number {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) throw new Error(`${field} harus berupa string bilangan bulat`);
  const parsed = BigInt(value);
  if (parsed > BigInt(Number.MAX_SAFE_INTEGER) || parsed < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(`${field} berada di luar rentang aman tampilan`);
  }
  return Number(parsed);
}

export function toMinorString(value: number, field = "amount"): string {
  if (!Number.isSafeInteger(value)) throw new Error(`${field} harus berupa bilangan bulat aman`);
  return BigInt(value).toString();
}

export function unwrapData(value: unknown, label: string): unknown {
  return objectRecord(value, label).data;
}

export function unwrapList(value: unknown, label: string): ApiRecord[] {
  const data = unwrapData(value, label);
  if (!Array.isArray(data)) throw new Error(`${label}.data harus berupa array`);
  return data.map((item, index) => objectRecord(item, `${label}.data[${index}]`));
}

export function mapProfile(value: unknown, fallback: Preferences): Preferences {
  const record = objectRecord(unwrapData(value, "profile"), "profile.data");
  const currency = text(record, "currency_code", "IDR");
  if (currency !== "IDR") throw new Error("Dasbor saat ini hanya mendukung mata uang IDR");
  return { ...fallback, displayName: optionalText(record, "display_name") ?? "Pengguna EcoSpend", currency: "IDR" };
}

export function mapCategories(records: readonly ApiRecord[]): Map<string, string> {
  return new Map(records.map((record) => [text(record, "id"), text(record, "name", "Tanpa kategori")]));
}

const accountType = (value: string): Account["type"] => value === "cash" ? "Tunai" : value === "e_wallet" ? "Dompet digital" : "Bank";
const accountColor = (type: Account["type"]): string => type === "Tunai" ? "#d97706" : type === "Dompet digital" ? "#2563eb" : "#167a5b";

export function mapAccounts(records: readonly ApiRecord[]): Account[] {
  return records.map((record) => {
    const type = accountType(text(record, "type"));
    return { id: text(record, "id"), name: text(record, "name", "Akun"), type,
      balance: parseSafeMinor(record.opening_balance_minor, "opening_balance_minor"), color: accountColor(type) };
  });
}

export type CarbonLookup = ReadonlyMap<string, number>;
export function mapCarbon(records: readonly ApiRecord[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const record of records) {
    const raw = record.estimated_kg_co2e;
    if (typeof raw !== "string" && typeof raw !== "number") throw new Error("estimated_kg_co2e tidak valid");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) throw new Error("estimated_kg_co2e tidak aman ditampilkan");
    result.set(text(record, "transaction_id"), value);
  }
  return result;
}

export function mapTransactions(records: readonly ApiRecord[], accounts: Lookup, categories: Lookup, carbon: CarbonLookup): Transaction[] {
  const transfers = new Map<string, ApiRecord[]>();
  const ordinary: Transaction[] = [];
  for (const record of records) {
    const source = text(record, "source");
    const kind = text(record, "kind");
    const group = optionalText(record, "transfer_group_id");
    if (source === "transfer" && group && (kind === "transfer_debit" || kind === "transfer_credit")) {
      transfers.set(group, [...(transfers.get(group) ?? []), record]);
      continue;
    }
    ordinary.push({
      id: text(record, "id"), date: text(record, "transacted_at").slice(0, 10),
      name: optionalText(record, "merchant_name") ?? text(record, "description", "Transaksi"),
      category: categories.get(text(record, "category_id")) ?? "Tanpa kategori",
      account: accounts.get(text(record, "account_id")) ?? "Akun tidak tersedia",
      type: kind === "income" ? "pemasukan" : "pengeluaran",
      amount: parseSafeMinor(record.amount_minor), carbonKg: carbon.get(text(record, "id")) ?? 0,
      notes: optionalText(record, "notes"),
    });
  }
  const mappedTransfers = [...transfers.entries()].map(([group, rows]): Transaction => {
    const debit = rows.find((row) => text(row, "kind") === "transfer_debit");
    const credit = rows.find((row) => text(row, "kind") === "transfer_credit");
    if (!debit || !credit) throw new Error(`Transfer ${group} tidak memiliki pasangan lengkap`);
    return {
      id: group, date: text(debit, "transacted_at").slice(0, 10), name: text(debit, "description", "Transfer antar akun"),
      category: "Transfer", account: accounts.get(text(debit, "account_id")) ?? "Akun tidak tersedia",
      destinationAccount: accounts.get(text(credit, "account_id")) ?? "Akun tidak tersedia", type: "transfer",
      amount: parseSafeMinor(debit.amount_minor), carbonKg: 0, notes: optionalText(debit, "notes"),
    };
  });
  return [...ordinary, ...mappedTransfers].sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));
}

export function mapBudgets(records: readonly ApiRecord[], categories: Lookup): Budget[] {
  return records.filter((record) => bool(record, "is_active", true)).map((record) => ({
    id: text(record, "id"), category: categories.get(text(record, "category_id")) ?? text(record, "name", "Anggaran"),
    limit: parseSafeMinor(record.amount_minor),
  }));
}

export function mapGoals(records: readonly ApiRecord[]): Goal[] {
  return records.filter((record) => !["cancelled"].includes(text(record, "status"))).map((record) => {
    const contributions = record.goal_contributions;
    if (!Array.isArray(contributions)) throw new Error("goal_contributions harus berupa array");
    const saved = contributions.reduce((sum, item, index) => sum + parseSafeMinor(objectRecord(item, `goal_contributions[${index}]`).amount_minor), 0);
    const target = parseSafeMinor(record.target_amount_minor, "target_amount_minor");
    if (!Number.isSafeInteger(saved)) throw new Error("Total kontribusi berada di luar rentang aman tampilan");
    return { id: text(record, "id"), name: text(record, "name", "Target"), target, saved: Math.min(target, Math.max(0, saved)),
      deadline: optionalText(record, "target_date") ?? "2099-12-31", icon: "leaf" };
  });
}

export function mapRecurring(records: readonly ApiRecord[], categories: Lookup): Recurring[] {
  return records.map((record) => ({
    id: text(record, "id"), name: optionalText(record, "merchant_name") ?? text(record, "description", "Transaksi berulang"),
    category: categories.get(text(record, "category_id")) ?? "Tanpa kategori", amount: parseSafeMinor(record.amount_minor),
    day: Math.min(28, Math.max(1, Number(text(record, "next_due_on").slice(8, 10)) || 1)), active: bool(record, "is_active", true),
  }));
}

export function mapRules(records: readonly ApiRecord[], categories: Lookup): MerchantRule[] {
  return records.filter((record) => bool(record, "is_enabled", true)).map((record) => ({
    id: text(record, "id"), merchant: text(record, "pattern"), category: categories.get(text(record, "category_id")) ?? "Tanpa kategori",
  }));
}

export function mapNotifications(records: readonly ApiRecord[]): DashboardNotification[] {
  return records.map((record) => {
    const status = text(record, "status");
    if (status !== "unread" && status !== "read" && status !== "archived") throw new Error("Status notifikasi tidak valid");
    return { id: text(record, "id"), title: text(record, "title", "Notifikasi"), detail: text(record, "body"), status };
  });
}

export function buildDashboardState(input: {
  profile: unknown; accounts: readonly ApiRecord[]; categories: readonly ApiRecord[]; transactions: readonly ApiRecord[];
  budgets: readonly ApiRecord[]; goals: readonly ApiRecord[]; recurring: readonly ApiRecord[]; rules: readonly ApiRecord[];
  carbon: readonly ApiRecord[]; fallbackPreferences: Preferences;
}): DashboardState {
  const categoryNames = mapCategories(input.categories); const accountRows = mapAccounts(input.accounts);
  const accountNames = new Map(accountRows.map((account) => [account.id, account.name]));
  return {
    preferences: mapProfile(input.profile, input.fallbackPreferences), accounts: accountRows,
    transactions: mapTransactions(input.transactions, accountNames, categoryNames, mapCarbon(input.carbon)),
    budgets: mapBudgets(input.budgets, categoryNames), goals: mapGoals(input.goals),
    recurring: mapRecurring(input.recurring, categoryNames), rules: mapRules(input.rules, categoryNames),
  };
}

export function numericDay(value: string): number { return integer({ value }, "value", 1); }
