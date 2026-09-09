import { estimateCarbon } from "@/lib/carbon";
import { money } from "@/lib/money";
import type { EmissionFactor, Transaction as FinanceTransaction } from "@/types";
import type { DemoState, Preferences, Transaction } from "./types";

export const DEMO_CURRENT_DATE = "2026-09-08";
export const DEMO_CURRENT_PERIOD = DEMO_CURRENT_DATE.slice(0, 7);

export const categories = [
  "Makanan & Minuman", "Transportasi", "Belanja", "Tagihan", "Hiburan",
  "Kesehatan", "Pendidikan", "Gaji", "Investasi", "Lainnya",
];

const factor = (categoryId: string | undefined, name: string, numerator: bigint, confidence: "high" | "medium" | "low", confidenceBasisPoints: bigint): EmissionFactor => ({
  id: `demo-${categoryId ?? "generic"}`, name, method: "spend", categoryId,
  currency: "IDR", gramsPerMajorUnitNumerator: numerator, gramsPerMajorUnitDenominator: 1_000n,
  source: "Faktor demonstrasi EcoSpend (bukan sumber resmi)", sourceYear: 2026, region: "ID-demo",
  confidence, confidenceBasisPoints,
});

export const demoEmissionFactors: readonly EmissionFactor[] = [
  factor("Makanan & Minuman", "Intensitas demo makanan", 14n, "medium", 6_500n),
  factor("Transportasi", "Intensitas demo transportasi", 35n, "medium", 6_000n),
  factor("Belanja", "Intensitas demo barang konsumsi", 20n, "low", 4_500n),
  factor("Tagihan", "Intensitas demo utilitas", 60n, "medium", 6_500n),
  factor("Hiburan", "Intensitas demo hiburan", 5n, "low", 4_500n),
  factor("Kesehatan", "Intensitas demo kesehatan", 14n, "low", 4_500n),
  factor("Pendidikan", "Intensitas demo pendidikan", 8n, "low", 4_500n),
  factor("Investasi", "Intensitas demo investasi", 0n, "low", 3_000n),
  factor(undefined, "Intensitas demo kategori umum", 10n, "low", 3_500n),
];

export type DemoCarbonEstimate = {
  carbonKg: number;
  confidencePercent: number;
  available: boolean;
  factor?: EmissionFactor;
};

export function estimateDemoTransactionCarbon(transaction: Transaction, method: Preferences["carbonMethod"] = "rata-rata"): DemoCarbonEstimate {
  if (transaction.type !== "pengeluaran" || !Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    return { carbonKg: 0, confidencePercent: 0, available: false };
  }
  const timestamp = `${transaction.date}T00:00:00.000Z`;
  const financeTransaction: FinanceTransaction = {
    id: transaction.id, date: transaction.date, direction: "expense", amount: money(BigInt(Math.round(transaction.amount))),
    accountId: transaction.account, categoryId: transaction.category, merchant: transaction.name,
    paymentMethod: "bank-transfer", tags: ["demo"], createdAt: timestamp, updatedAt: timestamp,
  };
  const estimate = estimateCarbon(financeTransaction, demoEmissionFactors, timestamp);
  if (!estimate.available) return { carbonKg: 0, confidencePercent: 0, available: false };
  const adjustedGrams = method === "konservatif" ? (estimate.gramsCo2e * 125n + 50n) / 100n : estimate.gramsCo2e;
  return {
    carbonKg: Math.round(Number(adjustedGrams) / 100) / 10,
    confidencePercent: Number(estimate.confidenceBasisPoints) / 100,
    available: true,
    factor: estimate.factor,
  };
}

const merchantTemplates = [
  ["Warung Nusantara", "Makanan & Minuman", "Dompet Digital", 54_000],
  ["Supermarket Hemat", "Makanan & Minuman", "Bank Utama", 286_000],
  ["KRL Commuter Line", "Transportasi", "Dompet Digital", 18_000],
  ["TransJakarta", "Transportasi", "Dompet Digital", 3_500],
  ["Gojek Ride", "Transportasi", "Dompet Digital", 42_000],
  ["PLN Pascabayar", "Tagihan", "Bank Utama", 615_000],
  ["Internet Fiber", "Tagihan", "Bank Utama", 425_000],
  ["Apotek Sehat", "Kesehatan", "Bank Utama", 168_000],
  ["Toko Buku", "Pendidikan", "Bank Utama", 215_000],
  ["Bioskop Kota", "Hiburan", "Dompet Digital", 95_000],
  ["Marketplace Lokal", "Belanja", "Bank Utama", 348_000],
  ["Pasar Organik", "Makanan & Minuman", "Tunai", 132_000],
] as const;

const generatedTransactions: Transaction[] = Array.from({ length: 132 }, (_, index) => {
  const [name, category, account, base] = merchantTemplates[index % merchantTemplates.length];
  const date = new Date(Date.UTC(2026, 8, 7 - index * 2)).toISOString().slice(0, 10);
  const amount = Math.round(base * (0.84 + ((index * 17) % 33) / 100) / 500) * 500;
  return { id: `history-${index + 1}`, date, name, category, account, type: "pengeluaran", amount, carbonKg: 0, notes: index % 19 === 0 ? "Pembayaran rutin demo" : undefined };
});

const monthlyTransactions: Transaction[] = Array.from({ length: 6 }, (_, index) => ({
  id: `salary-${index + 1}`,
  date: new Date(Date.UTC(2026, 7 - index, 1)).toISOString().slice(0, 10),
  name: "Gaji bulanan", category: "Gaji", account: "Bank Utama", type: "pemasukan",
  amount: 12_600_000 + index * 100_000, carbonKg: 0,
}));

const baseTransactions: Transaction[] = [
  { id: "t1", date: "2026-09-08", name: "Gaji bulanan", category: "Gaji", account: "Bank Utama", type: "pemasukan", amount: 12_500_000, carbonKg: 0 },
  { id: "t2", date: "2026-09-08", name: "KRL & TransJakarta", category: "Transportasi", account: "Dompet Digital", type: "pengeluaran", amount: 42_000, carbonKg: 0 },
  { id: "t3", date: "2026-09-07", name: "Belanja pasar lokal", category: "Makanan & Minuman", account: "Bank Utama", type: "pengeluaran", amount: 385_000, carbonKg: 0 },
  { id: "t4", date: "2026-09-06", name: "Listrik rumah", category: "Tagihan", account: "Bank Utama", type: "pengeluaran", amount: 620_000, carbonKg: 0 },
  { id: "t5", date: "2026-09-05", name: "Kedai kopi", category: "Makanan & Minuman", account: "Dompet Digital", type: "pengeluaran", amount: 48_000, carbonKg: 0 },
  { id: "t6", date: "2026-09-04", name: "Isi ulang transportasi", category: "Transfer", account: "Bank Utama", destinationAccount: "Dompet Digital", type: "transfer", amount: 300_000, carbonKg: 0 },
  { id: "t7", date: "2026-09-03", name: "Buku desain", category: "Pendidikan", account: "Bank Utama", type: "pengeluaran", amount: 275_000, carbonKg: 0 },
  { id: "t8", date: "2026-09-02", name: "Langganan musik", category: "Hiburan", account: "Dompet Digital", type: "pengeluaran", amount: 59_000, carbonKg: 0 },
  { id: "t9", date: "2026-09-01", name: "Investasi rutin", category: "Investasi", account: "Bank Utama", type: "pengeluaran", amount: 1_000_000, carbonKg: 0 },
  ...generatedTransactions, ...monthlyTransactions,
];

const transactions = baseTransactions
  .map((item) => ({ ...item, carbonKg: estimateDemoTransactionCarbon(item).carbonKg }))
  .sort((left, right) => right.date.localeCompare(left.date) || left.id.localeCompare(right.id));

export const initialDemoState: DemoState = {
  transactions,
  budgets: [
    { id: "b1", category: "Makanan & Minuman", limit: 1_800_000 }, { id: "b2", category: "Transportasi", limit: 900_000 },
    { id: "b3", category: "Belanja", limit: 1_200_000 }, { id: "b4", category: "Hiburan", limit: 500_000 },
    { id: "b5", category: "Tagihan", limit: 1_500_000 },
  ],
  goals: [
    { id: "g1", name: "Dana darurat hijau", target: 15_000_000, saved: 9_750_000, deadline: "2027-03-31", icon: "shield" },
    { id: "g2", name: "Panel surya rumah", target: 25_000_000, saved: 6_250_000, deadline: "2027-12-31", icon: "home" },
    { id: "g3", name: "Liburan rendah karbon", target: 8_000_000, saved: 4_800_000, deadline: "2027-06-30", icon: "leaf" },
  ],
  accounts: [
    { id: "a1", name: "Bank Utama", type: "Bank", balance: 8_000_000, color: "#167a5b" },
    { id: "a2", name: "Dompet Digital", type: "Dompet digital", balance: 8_000_000, color: "#2563eb" },
    { id: "a3", name: "Tunai", type: "Tunai", balance: 2_000_000, color: "#d97706" },
  ],
  recurring: [
    { id: "r1", name: "Investasi rutin", category: "Investasi", amount: 1_000_000, day: 1, active: true },
    { id: "r2", name: "Langganan musik", category: "Hiburan", amount: 59_000, day: 2, active: true },
    { id: "r3", name: "Internet rumah", category: "Tagihan", amount: 425_000, day: 12, active: true },
  ],
  preferences: { displayName: "Pengguna Demo", currency: "IDR", theme: "system", notifications: { budget: true, goals: true, weekly: false }, carbonMethod: "rata-rata" },
  rules: [{ id: "mr1", merchant: "KRL", category: "Transportasi" }, { id: "mr2", merchant: "PLN", category: "Tagihan" }],
};
