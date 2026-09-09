import type { Account, Category, EmissionFactor, RecurringTransaction } from "../types";
import { money } from "./money";

export const DEMO_ACCOUNTS: readonly Account[] = [
  { id: "cash", name: "Dompet Tunai", type: "cash", openingBalance: money(800_000n), color: "#64748b", archived: false },
  { id: "bank", name: "Rekening Utama", type: "bank", openingBalance: money(12_500_000n), color: "#0f766e", archived: false },
  { id: "wallet", name: "Dompet Digital", type: "e-wallet", openingBalance: money(750_000n), color: "#7c3aed", archived: false },
  { id: "savings", name: "Tabungan", type: "bank", openingBalance: money(8_000_000n), color: "#0369a1", archived: false },
];

export const DEMO_CATEGORIES: readonly Category[] = [
  { id: "salary", name: "Gaji", kind: "income", color: "#16a34a", icon: "wallet" },
  { id: "freelance", name: "Proyek Lepas", kind: "income", color: "#22c55e", icon: "briefcase" },
  { id: "groceries", name: "Kebutuhan Harian", kind: "expense", color: "#65a30d", icon: "shopping-basket" },
  { id: "dining", name: "Makan & Minum", kind: "expense", color: "#ea580c", icon: "utensils" },
  { id: "transport", name: "Transportasi", kind: "expense", color: "#0284c7", icon: "bus", carbonActivityType: "passenger-km" },
  { id: "utilities", name: "Tagihan", kind: "expense", color: "#ca8a04", icon: "zap", carbonActivityType: "electricity" },
  { id: "shopping", name: "Belanja", kind: "expense", color: "#db2777", icon: "shopping-bag" },
  { id: "health", name: "Kesehatan", kind: "expense", color: "#dc2626", icon: "heart-pulse" },
  { id: "education", name: "Pendidikan", kind: "expense", color: "#4f46e5", icon: "book-open" },
  { id: "entertainment", name: "Hiburan", kind: "expense", color: "#9333ea", icon: "film" },
];

export const DEMO_FACTORS: readonly EmissionFactor[] = [
  { id: "ef-transit", name: "Angkutan umum perkotaan", method: "activity", activityType: "passenger-km", unit: "km", gramsPerUnitNumerator: 65n, gramsPerUnitDenominator: 1n, source: "Demo factor", sourceYear: 2025, region: "ID", confidence: "high", confidenceBasisPoints: 8_500n },
  { id: "ef-electric", name: "Listrik jaringan", method: "activity", activityType: "electricity", unit: "kWh", gramsPerUnitNumerator: 750n, gramsPerUnitDenominator: 1n, source: "Demo factor", sourceYear: 2025, region: "ID", confidence: "high", confidenceBasisPoints: 9_000n },
  { id: "ef-food", name: "Belanja makanan", method: "spend", categoryId: "groceries", currency: "IDR", gramsPerMajorUnitNumerator: 9n, gramsPerMajorUnitDenominator: 100n, source: "Demo EEIO", sourceYear: 2024, region: "ID", confidence: "medium", confidenceBasisPoints: 6_500n },
  { id: "ef-dining", name: "Restoran", method: "spend", categoryId: "dining", currency: "IDR", gramsPerMajorUnitNumerator: 12n, gramsPerMajorUnitDenominator: 100n, source: "Demo EEIO", sourceYear: 2024, region: "ID", confidence: "medium", confidenceBasisPoints: 6_000n },
  { id: "ef-shopping", name: "Barang konsumsi", method: "spend", categoryId: "shopping", currency: "IDR", gramsPerMajorUnitNumerator: 7n, gramsPerMajorUnitDenominator: 100n, source: "Demo EEIO", sourceYear: 2024, region: "ID", confidence: "low", confidenceBasisPoints: 4_500n },
];

export const DEMO_RECURRING: readonly RecurringTransaction[] = [
  { id: "rec-salary", name: "Gaji bulanan", direction: "income", amount: money(9_500_000n), accountId: "bank", categoryId: "salary", merchant: "Pemberi Kerja Demo", paymentMethod: "bank-transfer", frequency: "monthly", interval: 1, nextDate: "2026-07-01", active: true },
  { id: "rec-internet", name: "Internet rumah", direction: "expense", amount: money(425_000n), accountId: "bank", categoryId: "utilities", merchant: "Internet Rumah", paymentMethod: "bank-transfer", frequency: "monthly", interval: 1, nextDate: "2026-07-10", active: true },
  { id: "rec-transit", name: "Isi ulang kartu transit", direction: "expense", amount: money(150_000n), accountId: "wallet", categoryId: "transport", merchant: "Transit Kota", paymentMethod: "e-wallet", frequency: "monthly", interval: 1, nextDate: "2026-07-03", active: true },
];
