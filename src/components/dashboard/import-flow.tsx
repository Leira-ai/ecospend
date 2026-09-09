"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { useDemoStore } from "./demo-store";
import { createId, formatRupiah } from "./format";
import type { Transaction, TransactionType } from "./types";
import { Card, EmptyState, PageHeader, buttonPrimary, buttonSecondary, inputClass, labelClass } from "./ui";

const required = ["date", "name", "category", "account", "type", "amount"] as const;
export const IMPORT_LIMITS = { maxFileBytes: 5 * 1024 * 1024, maxSheets: 1, maxRows: 1000, maxColumns: 40 } as const;
const allowedMimeTypes = new Set([
  "text/csv", "application/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
type RequiredField = typeof required[number];
type RawRow = Record<string, string | number | Date | null>;
type Mapping = Record<RequiredField | "carbonKg" | "notes", string>;
type InvalidRow = { row: number; reasons: string[] };
const labels: Record<keyof Mapping, string> = { date: "Tanggal", name: "Nama", category: "Kategori", account: "Akun", type: "Jenis", amount: "Nominal", carbonKg: "Karbon", notes: "Catatan" };

function assertDimensions(headers: readonly string[], rowCount: number) {
  if (headers.length > IMPORT_LIMITS.maxColumns) throw new Error(`Berkas memiliki ${headers.length} kolom; batasnya ${IMPORT_LIMITS.maxColumns}.`);
  if (rowCount > IMPORT_LIMITS.maxRows) throw new Error(`Berkas memiliki ${rowCount} baris data; batasnya ${IMPORT_LIMITS.maxRows}. Berkas tidak dipotong.`);
}

const parseCsv = (text: string): RawRow[] => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const split = (line: string) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((part) => part.trim().replace(/^\"|\"$/g, "").replaceAll('""', '"'));
  const headers = split(lines[0]);
  assertDimensions(headers, lines.length - 1);
  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = split(line);
    if (cells.length > headers.length) throw new Error(`Baris ${rowIndex + 2} memiliki kolom melebihi header.`);
    return Object.fromEntries(cells.map((value, index) => [headers[index], value]));
  });
  return rows;
};
const suggested = (headers: string[]): Mapping => {
  const find = (...keys: string[]) => headers.find((header) => keys.some((key) => header.toLowerCase().includes(key))) ?? "";
  return { date: find("tanggal", "date"), name: find("nama", "merchant", "deskripsi"), category: find("kategori", "category"), account: find("akun", "account"), type: find("jenis", "type"), amount: find("nominal", "amount", "jumlah"), carbonKg: find("karbon", "carbon"), notes: find("catatan", "note") };
};

export function ImportFlow() {
  const { transactions, importTransactions } = useDemoStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [filename, setFilename] = useState("");
  const [mapping, setMapping] = useState<Mapping>({ date: "", name: "", category: "", account: "", type: "", amount: "", carbonKg: "", notes: "" });
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState({ imported: 0, duplicates: 0, invalid: 0 });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const load = async (file: File) => {
    try {
      const extension = file.name.toLowerCase().split(".").pop();
      if (!extension || !["csv", "xlsx"].includes(extension)) throw new Error("Format tidak didukung. Gunakan CSV atau XLSX.");
      if (file.type && !allowedMimeTypes.has(file.type)) throw new Error(`Tipe berkas ${file.type} tidak didukung.`);
      if (file.size > IMPORT_LIMITS.maxFileBytes) throw new Error("Ukuran berkas melebihi batas 5 MB.");
      let parsed: RawRow[] = [];
      if (extension === "csv") parsed = parseCsv(await file.text());
      else {
        const ExcelJS = await import("exceljs"); const book = new ExcelJS.Workbook();
        await book.xlsx.load(await file.arrayBuffer());
        if (book.worksheets.length !== IMPORT_LIMITS.maxSheets) throw new Error(`Workbook harus memiliki tepat ${IMPORT_LIMITS.maxSheets} sheet.`);
        const sheet = book.worksheets[0];
        if (sheet.actualColumnCount > IMPORT_LIMITS.maxColumns) throw new Error(`Sheet memiliki ${sheet.actualColumnCount} kolom; batasnya ${IMPORT_LIMITS.maxColumns}.`);
        if (Math.max(0, sheet.actualRowCount - 1) > IMPORT_LIMITS.maxRows) throw new Error(`Sheet memiliki ${sheet.actualRowCount - 1} baris data; batasnya ${IMPORT_LIMITS.maxRows}. Berkas tidak dipotong.`);
        const keys = (sheet.getRow(1).values as unknown[]).slice(1).map((value) => String(value ?? "").trim());
        assertDimensions(keys, Math.max(0, sheet.actualRowCount - 1));
        sheet.eachRow((row, index) => {
          if (index > 1) parsed.push(Object.fromEntries(keys.map((key, position) => [key, row.getCell(position + 1).value as string | number | Date | null])));
        });
      }
      if (!parsed.length) throw new Error("Berkas tidak memiliki baris data");
      setRows(parsed); setFilename(file.name); setMapping(suggested(Object.keys(parsed[0]))); setStep(2); toast.success(`${parsed.length} baris berhasil dibaca`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Berkas tidak dapat dibaca"); }
    finally { if (inputRef.current) inputRef.current.value = ""; }
  };
  const value = (row: RawRow, key: keyof Mapping) => mapping[key] ? row[mapping[key]] : "";
  const parsedRows = rows.map((row, index): { transaction: Transaction | null; error: InvalidRow | null } => {
    const reasons: string[] = [];
    const typeRaw = String(value(row, "type")).trim().toLowerCase();
    let type: TransactionType | undefined;
    if (typeRaw.includes("pemasukan") || typeRaw.includes("masuk") || typeRaw.includes("income")) type = "pemasukan";
    else if (typeRaw.includes("pengeluaran") || typeRaw.includes("keluar") || typeRaw.includes("expense")) type = "pengeluaran";
    else if (typeRaw.includes("transfer")) type = "transfer";
    else reasons.push("jenis transaksi tidak dikenali");
    const amount = Number(String(value(row, "amount")).replace(/[^\d.-]/g, "")); const rawDate = value(row, "date");
    const date = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : String(rawDate).match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
    const name = String(value(row, "name") ?? "").trim();
    const category = String(value(row, "category") ?? "").trim();
    const account = String(value(row, "account") ?? "").trim();
    if (!date || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) reasons.push("tanggal harus berformat YYYY-MM-DD dan valid");
    if (!name) reasons.push("nama kosong");
    if (!category) reasons.push("kategori kosong");
    if (!account) reasons.push("akun kosong");
    if (!Number.isFinite(amount) || amount <= 0) reasons.push("nominal harus berupa angka positif");
    if (reasons.length || !type) return { transaction: null, error: { row: index + 2, reasons } };
    return { transaction: { id: createId(`imp${index}`), date, name, category, account, type, amount, carbonKg: Number(value(row, "carbonKg")) || 0, notes: String(value(row, "notes") || "") || undefined }, error: null };
  });
  const valid = parsedRows.flatMap((item) => item.transaction ? [item.transaction] : []);
  const invalidRows = parsedRows.flatMap((item) => item.error ? [item.error] : []);
  const duplicateKeys = new Set(transactions.map((item) => `${item.date}|${item.name.toLowerCase()}|${item.amount}`));
  const fresh = valid.filter((item) => !duplicateKeys.has(`${item.date}|${item.name.toLowerCase()}|${item.amount}`));
  const duplicates = valid.length - fresh.length; const invalid = invalidRows.length;
  const mappingComplete = required.every((key) => mapping[key]);
  const reset = () => { setRows([]); setFilename(""); setMapping({ date: "", name: "", category: "", account: "", type: "", amount: "", carbonKg: "", notes: "" }); setStep(1); };
  const confirm = () => { importTransactions(fresh); setResult({ imported: fresh.length, duplicates, invalid }); setStep(4); toast.success(`${fresh.length} transaksi diimpor`); };

  return <div className="space-y-6"><PageHeader eyebrow="Pindahkan data" title="Impor transaksi" description="Unggah CSV atau XLSX, petakan kolom, lalu tinjau data sebelum menyimpannya ke mode demo." />
    <ol className="grid grid-cols-4 gap-2" aria-label="Tahap impor">{["Unggah", "Petakan", "Tinjau", "Selesai"].map((label, index) => <li key={label} className={`rounded-xl px-2 py-3 text-center text-xs font-semibold sm:text-sm ${step >= index + 1 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-800"}`}>{index + 1}. {label}</li>)}</ol>
    {step === 1 && <Card className={`border-2 border-dashed p-8 text-center transition ${drag ? "border-emerald-500 bg-emerald-50" : "border-slate-300"}`}><div onDragOver={(event) => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(event) => { event.preventDefault(); setDrag(false); const file = event.dataTransfer.files[0]; if (file) load(file); }}><UploadCloud className="mx-auto size-12 text-emerald-700" /><h2 className="mt-4 text-lg font-bold">Tarik berkas ke sini</h2><p className="mt-1 text-sm text-slate-500">CSV atau XLSX, maksimal 5 MB, 1 sheet, 1.000 baris, dan 40 kolom. Data diproses lokal.</p><input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) load(file); }} /><button type="button" onClick={() => inputRef.current?.click()} className={`${buttonPrimary} mt-5`}><FileSpreadsheet className="size-4" />Pilih berkas</button></div></Card>}
    {step === 2 && <Card className="p-5 sm:p-6"><h2 className="font-bold">Petakan kolom · {filename}</h2><p className="mt-1 text-sm text-slate-500">Pastikan setiap data wajib terhubung ke kolom yang tepat.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => <label key={key}><span className={labelClass}>{label}{required.includes(key as RequiredField) && " *"}</span><select className={inputClass} value={mapping[key as keyof Mapping]} onChange={(event) => setMapping((current) => ({ ...current, [key]: event.target.value }))}><option value="">Tidak dipetakan</option>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>)}</div><div className="mt-5 flex justify-between"><button type="button" className={buttonSecondary} onClick={reset}>Ganti berkas</button><button type="button" className={buttonPrimary} disabled={!mappingComplete} onClick={() => setStep(3)}>Tinjau data</button></div></Card>}
    {step === 3 && <Card className="overflow-hidden"><div className="flex flex-wrap gap-3 border-b border-slate-200 p-5 dark:border-slate-800"><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{fresh.length} valid</span><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">{duplicates} duplikat</span><span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-800">{invalid} tidak valid</span></div>{invalidRows.length > 0 && <div className="border-b border-rose-200 bg-rose-50 p-5 text-sm text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100"><h3 className="font-bold">Baris yang perlu diperbaiki</h3><ul className="mt-2 max-h-44 list-disc space-y-1 overflow-y-auto pl-5">{invalidRows.map((item) => <li key={item.row}><strong>Baris {item.row}:</strong> {item.reasons.join("; ")}.</li>)}</ul></div>}{fresh.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{["Tanggal","Nama","Kategori","Jenis","Nominal"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody>{fresh.slice(0, 8).map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-3">{item.date}</td><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3 capitalize">{item.type}</td><td className="px-4 py-3 font-semibold">{formatRupiah(item.amount)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState title="Tidak ada baris yang dapat diimpor" description="Periksa rincian baris, pemetaan, format tanggal YYYY-MM-DD, dan nominal positif." /></div>}<div className="flex justify-between border-t border-slate-100 p-5 dark:border-slate-800"><button type="button" className={buttonSecondary} onClick={() => setStep(2)}>Kembali</button><button type="button" className={buttonPrimary} disabled={!fresh.length} onClick={confirm}>Konfirmasi impor</button></div></Card>}
    {step === 4 && <Card className="p-8 text-center"><CheckCircle2 className="mx-auto size-14 text-emerald-600" /><h2 className="mt-4 text-xl font-bold">Impor selesai</h2><p className="mt-2 text-sm text-slate-500">{result.imported} transaksi ditambahkan, {result.duplicates} duplikat dilewati, dan {result.invalid} baris tidak valid diabaikan.</p><button type="button" className={`${buttonPrimary} mt-5`} onClick={reset}>Impor berkas lain</button></Card>}
    <div className="flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100"><AlertCircle className="mt-0.5 size-5 shrink-0" /><p>Deteksi duplikat membandingkan tanggal, nama, dan nominal. Selalu tinjau data sebelum konfirmasi.</p></div>
  </div>;
}
