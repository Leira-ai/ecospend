import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCsv } from "@/lib/import";
import { parseExcel } from "@/lib/excelImport";
import { importRowSchema, IMPORT_MAX_BYTES, IMPORT_MAX_ROWS, type ImportRow } from "@/lib/schemas/import";
import { ApiError, throwIfError } from "./http";

export interface ImportPreview {
  rows: ImportRow[];
  sourceRows: number[];
  totalRows: number;
  errors: { row: number; field: string; message: string }[];
  duplicates: number[];
  fileSha256: string;
}

function normalizeHeader(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID").replace(/[^a-z0-9]/g, "");
}
function valueOf(record: Readonly<Record<string, unknown>>, names: readonly string[]): string {
  for (const [key, value] of Object.entries(record)) if (names.includes(normalizeHeader(key)) && value != null) return String(value).trim();
  return "";
}
function normalizeReference(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, " ");
}
function resolveReference<T extends { id: string; name: string }>(values: readonly T[], target: string): T | undefined {
  const normalized = normalizeReference(target);
  return values.find((item) => item.id === target || normalizeReference(item.name) === normalized);
}
function normalizeDate(value: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))) return `${value}T00:00:00.000Z`;
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  if (!match) return undefined;
  const iso = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}T00:00:00.000Z`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}
function normalizeAmount(value: string): string | undefined {
  const compact = value.replace(/[\s_]/g, "");
  const normalized = compact.includes(",") && compact.includes(".")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact.replace(/,/g, "");
  if (!/^\d+(?:\.0+)?$/.test(normalized)) return undefined;
  try { return BigInt(normalized.split(".")[0]).toString(); } catch { return undefined; }
}
function normalizeKind(value: string): "expense" | "income" | undefined {
  const key = value.toLocaleLowerCase("id-ID");
  if (["expense", "pengeluaran", "belanja"].includes(key)) return "expense";
  if (["income", "pendapatan", "pemasukan"].includes(key)) return "income";
  return undefined;
}
function fingerprint(row: ImportRow): string {
  return createHash("sha256").update([
    row.transactedAt, row.kind, row.amountMinor, row.currencyCode, row.accountId,
    row.categoryId ?? "", row.merchantName?.trim().toLocaleLowerCase("id-ID") ?? "",
  ].join("|")).digest("hex");
}

export async function parseImportFile(file: File): Promise<ReadonlyArray<Readonly<Record<string, unknown>>>> {
  if (file.size < 1 || file.size > IMPORT_MAX_BYTES) throw new ApiError(413, "invalid_file_size", `File must be between 1 byte and ${IMPORT_MAX_BYTES} bytes`);
  const extension = file.name.toLocaleLowerCase().split(".").pop();
  let records: ReadonlyArray<Readonly<Record<string, unknown>>>;
  if (extension === "csv" && ["text/csv", "application/csv", "application/vnd.ms-excel", ""].includes(file.type)) {
    records = parseCsv(await file.text());
  } else if (extension === "xlsx" && ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/octet-stream", ""].includes(file.type)) {
    records = await parseExcel(await file.arrayBuffer());
  } else throw new ApiError(415, "unsupported_file", "Only CSV and XLSX files are accepted");
  if (!records.length) throw new ApiError(422, "empty_import", "The spreadsheet has no data rows");
  if (records.length > IMPORT_MAX_ROWS) throw new ApiError(422, "too_many_rows", `Import is limited to ${IMPORT_MAX_ROWS} rows`);
  if (Object.keys(records[0]).length > 50) throw new ApiError(422, "too_many_columns", "Import is limited to 50 columns");
  return records;
}

export async function buildImportPreview(client: SupabaseClient, userId: string, file: File): Promise<ImportPreview> {
  const records = await parseImportFile(file);
  const errors: ImportPreview["errors"] = [];
  const rows: ImportRow[] = [];
  const sourceRows: number[] = [];
  records.forEach((record, index) => {
    const input = {
      transactedAt: normalizeDate(valueOf(record, ["date", "tanggal", "tgl"])),
      kind: normalizeKind(valueOf(record, ["direction", "type", "jenis", "tipe"])),
      amountMinor: normalizeAmount(valueOf(record, ["amountminor", "amount", "jumlah", "nominal"])),
      accountId: valueOf(record, ["accountid", "account", "akun", "rekening"]),
      categoryId: valueOf(record, ["categoryid", "category", "kategori"]) || null,
      currencyCode: valueOf(record, ["currencycode", "currency", "mata uang"]) || "IDR",
      merchantName: valueOf(record, ["merchantname", "merchant", "pedagang", "nama"]) || null,
      description: valueOf(record, ["description", "deskripsi"]), notes: valueOf(record, ["notes", "note", "catatan"]) || null,
    };
    const parsed = importRowSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) errors.push({ row: index + 2, field: issue.path.join("."), message: issue.message });
    } else { rows.push(parsed.data); sourceRows.push(index + 2); }
  });
  if (!rows.length) return { rows, sourceRows, totalRows: records.length, errors, duplicates: [], fileSha256: await sha256File(file) };
  await validateImportReferences(client, userId, rows, sourceRows, errors);
  const duplicates = await findDuplicates(client, userId, rows);
  return { rows, sourceRows, totalRows: records.length, errors, duplicates, fileSha256: await sha256File(file) };
}

async function sha256File(file: File): Promise<string> {
  return createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
}

async function validateImportReferences(
  client: SupabaseClient,
  userId: string,
  rows: ImportRow[],
  sourceRows: number[],
  errors: ImportPreview["errors"],
): Promise<void> {
  const [accountsResult, categoriesResult] = await Promise.all([
    client.from("accounts").select("id,name,currency_code").eq("user_id", userId).eq("is_archived", false),
    client.from("categories").select("id,name,kind").or(`is_system.eq.true,user_id.eq.${userId}`),
  ]);
  throwIfError(accountsResult.error); throwIfError(categoriesResult.error);
  const accounts = (accountsResult.data ?? []).map((item) => ({ id: String(item.id), name: String(item.name), currencyCode: String(item.currency_code) }));
  const categories = (categoriesResult.data ?? []).map((item) => ({ id: String(item.id), name: String(item.name), kind: String(item.kind) }));
  rows.forEach((row, index) => {
    const sourceRow = sourceRows[index];
    const account = resolveReference(accounts, row.accountId);
    const category = row.categoryId ? resolveReference(categories, row.categoryId) : undefined;
    if (!account) errors.push({ row: sourceRow, field: "accountId", message: "Account is unavailable" });
    else { row.accountId = account.id; if (account.currencyCode !== row.currencyCode) errors.push({ row: sourceRow, field: "currencyCode", message: "Currency differs from account" }); }
    if (!category) errors.push({ row: sourceRow, field: "categoryId", message: "Category is unavailable" });
    else { row.categoryId = category.id; if (![row.kind, "both"].includes(category.kind)) errors.push({ row: sourceRow, field: "categoryId", message: "Category kind does not match" }); }
  });
}

async function findDuplicates(client: SupabaseClient, userId: string, rows: ImportRow[]): Promise<number[]> {
  const dates = rows.map((row) => row.transactedAt).sort();
  const { data, error } = await client.from("transactions")
    .select("account_id,category_id,kind,amount_minor::text,currency_code,merchant_name,transacted_at")
    .eq("user_id", userId).gte("transacted_at", dates[0]).lte("transacted_at", dates.at(-1) ?? dates[0]).limit(5_000);
  throwIfError(error);
  const existing = new Set((data ?? []).map((item) => fingerprint({
    accountId: String(item.account_id), categoryId: item.category_id ? String(item.category_id) : null,
    kind: item.kind as "expense" | "income", amountMinor: String(item.amount_minor), currencyCode: String(item.currency_code),
    merchantName: item.merchant_name ? String(item.merchant_name) : null, description: "", notes: null,
    transactedAt: String(item.transacted_at), postedAt: null,
  })));
  const seen = new Set(existing);
  return rows.flatMap((row, index) => { const key = fingerprint(row); const duplicate = seen.has(key); seen.add(key); return duplicate ? [index] : []; });
}
