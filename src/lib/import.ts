import type {
  Account, Category, ImportRecord, ImportResult, ImportedTransaction, PaymentMethod, Transaction,
  TransactionDirection,
} from "../types";
import { normalizeMerchant } from "./categorization";
import { parseMoney } from "./money";

export interface ImportContext {
  readonly accounts: readonly Account[];
  readonly categories: readonly Category[];
  readonly existingTransactions?: readonly Transaction[];
}

const HEADER_ALIASES: Readonly<Record<string, readonly string[]>> = {
  date: ["date", "tanggal", "tgl"],
  direction: ["direction", "type", "jenis", "tipe"],
  amount: ["amount", "jumlah", "nominal"],
  account: ["account", "akun", "rekening"],
  transferAccount: ["transferaccount", "destination", "tujuan"],
  category: ["category", "kategori"],
  merchant: ["merchant", "pedagang", "deskripsi", "description"],
  note: ["note", "catatan"],
  paymentMethod: ["paymentmethod", "payment", "pembayaran", "metode"],
  tags: ["tags", "tag", "label"],
};

export function parseCsv(text: string): readonly ImportRecord[] {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
  const headers = rows[0]?.map(normalizeHeader) ?? [];
  return rows.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
  );
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function parseImportRecords(records: readonly ImportRecord[], context: ImportContext): ImportResult {
  const existing = new Set((context.existingTransactions ?? []).map(transactionFingerprint));
  const imported: ImportedTransaction[] = [];
  const errors: ImportResult["errors"][number][] = [];
  records.forEach((record, index) => {
    const sourceRow = index + 2;
    const rowErrors: ImportResult["errors"][number][] = [];
    const value = (field: keyof typeof HEADER_ALIASES): string => getField(record, HEADER_ALIASES[field]);
    const date = normalizeDate(value("date"));
    if (!date) rowErrors.push({ row: sourceRow, field: "date", message: "Tanggal tidak valid." });
    const direction = normalizeDirection(value("direction"));
    if (!direction) rowErrors.push({ row: sourceRow, field: "direction", message: "Jenis transaksi tidak valid." });
    const account = findNamed(context.accounts, value("account"));
    if (!account) rowErrors.push({ row: sourceRow, field: "account", message: "Akun tidak ditemukan." });
    const parsedAmount = parseMoney(value("amount"), account?.openingBalance.currency ?? "IDR");
    if (!parsedAmount.ok || parsedAmount.value.amountMinor <= 0n) {
      rowErrors.push({ row: sourceRow, field: "amount", message: parsedAmount.ok ? "Nominal harus lebih dari nol." : parsedAmount.error });
    }
    const category = value("category") ? findNamed(context.categories, value("category")) : undefined;
    if (direction !== "transfer" && !category) rowErrors.push({ row: sourceRow, field: "category", message: "Kategori tidak ditemukan." });
    if (category && direction !== "transfer" && category.kind !== direction) {
      rowErrors.push({ row: sourceRow, field: "category", message: "Jenis kategori tidak sesuai transaksi." });
    }
    const transferAccount = direction === "transfer" ? findNamed(context.accounts, value("transferAccount")) : undefined;
    if (direction === "transfer" && (!transferAccount || transferAccount.id === account?.id)) {
      rowErrors.push({ row: sourceRow, field: "transferAccount", message: "Akun tujuan transfer tidak valid." });
    }
    const paymentMethod = normalizePaymentMethod(value("paymentMethod"));
    if (!paymentMethod) rowErrors.push({ row: sourceRow, field: "paymentMethod", message: "Metode pembayaran tidak valid." });
    if (rowErrors.length || !date || !direction || !account || !parsedAmount.ok || !paymentMethod) {
      errors.push(...rowErrors); return;
    }
    const timestamp = `${date}T00:00:00.000Z`;
    const transaction: Transaction = {
      id: "pending", date, direction, amount: parsedAmount.value, accountId: account.id,
      transferAccountId: transferAccount?.id, categoryId: direction === "transfer" ? undefined : category?.id,
      merchant: value("merchant").trim() || (direction === "transfer" ? "Transfer antar akun" : "Tanpa nama"),
      note: value("note").trim() || undefined, paymentMethod,
      tags: value("tags").split(/[;,]/).map((tag) => tag.trim()).filter(Boolean), createdAt: timestamp, updatedAt: timestamp,
    };
    const fingerprint = transactionFingerprint(transaction);
    const duplicate = existing.has(fingerprint);
    existing.add(fingerprint);
    imported.push({ transaction: { ...transaction, id: `import-${fingerprint}` }, fingerprint, duplicate, sourceRow });
  });
  return { transactions: imported, errors, totalRows: records.length };
}

export function transactionFingerprint(transaction: Transaction): string {
  const canonical = [transaction.date, transaction.direction, transaction.amount.currency,
    transaction.amount.amountMinor.toString(), transaction.accountId, transaction.transferAccountId ?? "",
    transaction.categoryId ?? "", normalizeMerchant(transaction.merchant)].join("|");
  return fnv1a64(canonical);
}

function fnv1a64(value: string): string {
  let hash = 14_695_981_039_346_656_037n;
  for (const char of value) { hash ^= BigInt(char.codePointAt(0) ?? 0); hash = BigInt.asUintN(64, hash * 1_099_511_628_211n); }
  return hash.toString(16).padStart(16, "0");
}

function normalizeHeader(value: string): string { return value.trim().toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, ""); }
function getField(record: ImportRecord, aliases: readonly string[]): string {
  for (const [key, value] of Object.entries(record)) if (aliases.includes(normalizeHeader(key)) && value != null) return String(value);
  return "";
}
function findNamed<T extends { readonly id: string; readonly name: string }>(values: readonly T[], target: string): T | undefined {
  const normalized = normalizeMerchant(target); return values.find((item) => item.id === target || normalizeMerchant(item.name) === normalized);
}
function normalizeDate(value: string): string | undefined {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !Number.isNaN(Date.parse(`${trimmed}T00:00:00Z`))) return trimmed;
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(trimmed);
  if (!match) return undefined;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  return Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) ? undefined : iso;
}
function normalizeDirection(value: string): TransactionDirection | undefined {
  const key = value.trim().toLocaleLowerCase("id-ID");
  if (["income", "pendapatan", "pemasukan"].includes(key)) return "income";
  if (["expense", "pengeluaran", "belanja"].includes(key)) return "expense";
  if (["transfer", "pemindahan"].includes(key)) return "transfer";
  return undefined;
}
function normalizePaymentMethod(value: string): PaymentMethod | undefined {
  const key = normalizeHeader(value);
  const methods: Readonly<Record<string, PaymentMethod>> = {
    cash: "cash", tunai: "cash", debitcard: "debit-card", debit: "debit-card", creditcard: "credit-card",
    kredit: "credit-card", banktransfer: "bank-transfer", transferbank: "bank-transfer", qr: "qr", qris: "qr",
    ewallet: "e-wallet", dompetdigital: "e-wallet",
  };
  return methods[key];
}
