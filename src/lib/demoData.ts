import type { Budget, DemoState, Goal, Notification, PaymentMethod, Settings, Transaction } from "../types";
import { DEMO_ACCOUNTS, DEMO_CATEGORIES, DEMO_FACTORS, DEMO_RECURRING } from "./demoConstants";
import { money } from "./money";

const GENERATED_AT = "2026-06-30T12:00:00.000Z";
const METHODS: readonly PaymentMethod[] = ["cash", "debit-card", "bank-transfer", "qr", "e-wallet"];
const EXPENSES = [
  ["groceries", "Pasar Sejahtera", 185_000n], ["dining", "Warung Nusantara", 48_000n],
  ["transport", "Transit Kota", 35_000n], ["utilities", "PLN", 420_000n],
  ["shopping", "Toko Lokal", 230_000n], ["health", "Apotek Sehat", 95_000n],
  ["education", "Toko Buku", 120_000n], ["entertainment", "Bioskop Kota", 75_000n],
] as const;

export function createDemoState(): DemoState {
  const transactions = createTransactions();
  const budgets: readonly Budget[] = [
    { id: "budget-food", name: "Makanan Juni", categoryIds: ["groceries", "dining"], limit: money(3_500_000n), month: "2026-06", rollover: false },
    { id: "budget-transport", name: "Transportasi Juni", categoryIds: ["transport"], limit: money(900_000n), month: "2026-06", rollover: false },
    { id: "budget-shopping", name: "Belanja Juni", categoryIds: ["shopping", "entertainment"], limit: money(1_500_000n), month: "2026-06", rollover: true },
  ];
  const goals: readonly Goal[] = [
    { id: "goal-emergency", name: "Dana Darurat", target: money(30_000_000n), initialAmount: money(8_000_000n), targetDate: "2027-06-30", status: "active", color: "#0f766e", contributions: [
      { id: "contrib-emergency-1", date: "2026-03-02", amount: money(1_500_000n), accountId: "savings" },
      { id: "contrib-emergency-2", date: "2026-06-02", amount: money(2_000_000n), accountId: "savings" },
    ] },
    { id: "goal-bike", name: "Sepeda Komuter", target: money(7_500_000n), initialAmount: money(1_000_000n), targetDate: "2026-12-31", status: "active", color: "#0284c7", contributions: [
      { id: "contrib-bike-1", date: "2026-04-15", amount: money(750_000n), accountId: "savings" },
    ] },
    { id: "goal-course", name: "Kursus Profesional", target: money(4_000_000n), initialAmount: money(3_000_000n), targetDate: "2026-09-30", status: "active", color: "#4f46e5", contributions: [] },
  ];
  const notifications: readonly Notification[] = [
    { id: "notice-budget", type: "budget", title: "Pantau anggaran makan", message: "Pengeluaran makanan bulan ini perlu ditinjau.", createdAt: GENERATED_AT, read: false, actionHref: "/budgets" },
    { id: "notice-goal", type: "goal", title: "Progres Dana Darurat", message: "Kontribusi rutin membantu target tercapai tepat waktu.", createdAt: "2026-06-28T08:00:00.000Z", read: false, actionHref: "/goals" },
    { id: "notice-carbon", type: "carbon", title: "Estimasi karbon tersedia", message: "Aktivitas transportasi memakai faktor berbasis jarak.", createdAt: "2026-06-27T08:00:00.000Z", read: true },
  ];
  const settings: Settings = { locale: "id-ID", currency: "IDR", theme: "system", monthlyStartDay: 1, carbonUnit: "kg", notificationsEnabled: true, compactNumbers: false };
  return { schemaVersion: 1, generatedAt: GENERATED_AT, accounts: DEMO_ACCOUNTS, categories: DEMO_CATEGORIES, transactions, budgets, goals, recurringTransactions: DEMO_RECURRING, emissionFactors: DEMO_FACTORS, notifications, settings };
}

function createTransactions(): readonly Transaction[] {
  const values: Transaction[] = [];
  for (let month = 1; month <= 6; month += 1) {
    values.push(transaction(`salary-${month}`, iso(month, 1), "income", 9_500_000n, "bank", "salary", "Pemberi Kerja Demo", "bank-transfer"));
    values.push(transaction(`freelance-${month}`, iso(month, 18), "income", 1_000_000n + BigInt(month) * 100_000n, "bank", "freelance", "Klien Proyek Demo", "bank-transfer"));
    for (let day = 2; day <= 22; day += 1) {
      const index = (month * 7 + day) % EXPENSES.length;
      const [categoryId, merchant, base] = EXPENSES[index];
      const amount = base + BigInt((month * day) % 9) * 5_000n;
      const accountId = day % 3 === 0 ? "wallet" : day % 4 === 0 ? "cash" : "bank";
      const activity = categoryId === "transport" ? { type: "passenger-km", quantityMinor: BigInt(6 + day % 12), quantityScale: 1n, unit: "km" }
        : categoryId === "utilities" && day % 2 === 0 ? { type: "electricity", quantityMinor: BigInt(75 + month * 4), quantityScale: 1n, unit: "kWh" } : undefined;
      values.push({ ...transaction(`expense-${month}-${day}`, iso(month, day), "expense", amount, accountId, categoryId, merchant, METHODS[(month + day) % METHODS.length]), activity });
    }
    values.push({ ...transaction(`transfer-${month}`, iso(month, 3), "transfer", 1_000_000n, "bank", undefined, "Transfer ke Tabungan", "bank-transfer"), transferAccountId: "savings" });
  }
  return values.sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));
}

function transaction(id: string, date: string, direction: Transaction["direction"], amount: bigint, accountId: string, categoryId: string | undefined, merchant: string, paymentMethod: PaymentMethod): Transaction {
  const timestamp = `${date}T08:00:00.000Z`;
  return { id, date, direction, amount: money(amount), accountId, categoryId, merchant, paymentMethod, tags: direction === "expense" ? ["demo"] : [], createdAt: timestamp, updatedAt: timestamp };
}
function iso(month: number, day: number): string { return `2026-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`; }

export const DEMO_STATE: DemoState = createDemoState();
