"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowDownAZ, ChevronLeft, ChevronRight, Download, FileSpreadsheet,
  Paperclip, Pencil, Plus, Search, Trash2, Upload, X,
} from "lucide-react";
import {
  createColumnHelper, createPaginatedRowModel, createSortedRowModel, rowPaginationFeature,
  rowSortingFeature, tableFeatures, type SortingState, useTable,
} from "@tanstack/react-table";
import { categories } from "./demo-data";
import { AttachmentManager } from "./attachment-manager";
import { useDemoStore } from "./demo-store";
import { createId, downloadBlob, formatDate, formatRupiah, toCsv } from "./format";
import type { Transaction } from "./types";
import { ConfirmDialog, EmptyState, Modal, buttonPrimary, buttonSecondary, cardClass, inputClass, labelClass } from "./ui";

const schema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  category: z.string().min(1, "Pilih kategori"),
  account: z.string().min(1, "Pilih akun"),
  destinationAccount: z.string().optional(),
  type: z.enum(["pemasukan", "pengeluaran", "transfer"]),
  amount: z.number().positive("Nominal harus lebih dari nol"),
  carbonKg: z.number().min(0, "Emisi tidak boleh negatif"),
  notes: z.string().max(180, "Catatan maksimal 180 karakter").optional(),
}).superRefine((data, context) => {
  if (data.type === "transfer" && (!data.destinationAccount || data.destinationAccount === data.account)) context.addIssue({ code: "custom", path: ["destinationAccount"], message: "Pilih akun tujuan yang berbeda" });
});
type FormValues = z.infer<typeof schema>;

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});
const helper = createColumnHelper<typeof features, Transaction>();

export function TransactionManager({ openOnLoad = false }: { openOnLoad?: boolean }) {
  const store = useDemoStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [type, setType] = useState("Semua");
  const [selected, setSelected] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [modal, setModal] = useState(openOnLoad);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [attachmentTransaction, setAttachmentTransaction] = useState<Transaction | null>(null);

  const filtered = useMemo(() => store.transactions.filter((item) => {
    const text = `${item.name} ${item.category} ${item.account}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === "Semua" || item.category === category) && (type === "Semua" || item.type === type);
  }), [category, query, store.transactions, type]);

  const columns = useMemo(() => helper.columns([
    helper.accessor("date", { header: "Tanggal" }), helper.accessor("name", { header: "Transaksi" }),
    helper.accessor("category", { header: "Kategori" }), helper.accessor("account", { header: "Akun" }),
    helper.accessor("type", { header: "Jenis" }), helper.accessor("amount", { header: "Nominal" }),
  ]), []);
  const table = useTable({ features, columns, data: filtered, state: { sorting }, onSortingChange: setSorting, initialState: { pagination: { pageIndex: 0, pageSize: 7 } } });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: "2026-09-08", name: "", category: categories[0], account: store.accounts[0]?.name ?? "", destinationAccount: "", type: "pengeluaran", amount: 0, carbonKg: 0, notes: "" },
  });
  const transactionType = useWatch({ control: form.control, name: "type" });
  const openCreate = () => { setEditing(null); form.reset({ date: "2026-09-08", name: "", category: categories[0], account: store.accounts[0]?.name ?? "", destinationAccount: "", type: "pengeluaran", amount: 0, carbonKg: 0, notes: "" }); setModal(true); };
  const openEdit = (item: Transaction) => { setEditing(item); form.reset(item); setModal(true); };

  const submit = form.handleSubmit((values) => {
    const item: Transaction = { ...values, id: editing?.id ?? createId("tx"), notes: values.notes || undefined, destinationAccount: values.destinationAccount || undefined };
    if (editing) store.updateTransaction(item); else store.addTransaction(item);
    setModal(false); toast.success(editing ? "Transaksi diperbarui" : "Transaksi ditambahkan");
  });
  const exportRows = filtered.map((item) => ({ Tanggal: item.date, Nama: item.name, Kategori: item.category, Akun: item.account, Jenis: item.type, Nominal: item.amount, "Karbon (kg CO2e)": item.carbonKg, Catatan: item.notes ?? "" }));
  const exportCsv = () => { downloadBlob(`\uFEFF${toCsv(exportRows)}`, "transaksi-ecospend.csv", "text/csv;charset=utf-8"); toast.success("CSV berhasil diunduh"); };
  const exportXlsx = async () => {
    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet("Transaksi");
      sheet.columns = Object.keys(exportRows[0] ?? { Tanggal: "" }).map((key) => ({ header: key, key, width: 22 }));
      sheet.addRows(exportRows); sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }];
      const buffer = await workbook.xlsx.writeBuffer(); downloadBlob(buffer, "transaksi-ecospend.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); toast.success("XLSX berhasil diunduh");
    } catch { toast.error("Ekspor XLSX belum tersedia. Gunakan CSV."); }
  };
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const visibleIds = table.getRowModel().rows.map((row) => row.original.id);
  const allVisible = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari transaksi, kategori, atau akun" aria-label="Cari transaksi" className={`${inputClass} pl-10`} /></div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter kategori" className={`${inputClass} lg:w-52`}><option>Semua</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={type} onChange={(event) => setType(event.target.value)} aria-label="Filter jenis" className={`${inputClass} lg:w-44`}><option>Semua</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option><option value="transfer">Transfer</option></select>
        <button type="button" className={buttonPrimary} onClick={openCreate}><Plus className="size-4" />Tambah</button>
      </div>
      {selected.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950"><strong>{selected.length} dipilih</strong><select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value)} aria-label="Kategori massal" className={`${inputClass} ml-auto w-48 bg-white`}><option value="">Ubah kategori...</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><button type="button" disabled={!bulkCategory} onClick={() => { store.bulkCategorize(selected, bulkCategory); setSelected([]); toast.success("Kategori diperbarui"); }} className={buttonSecondary}>Terapkan</button><button type="button" onClick={() => setDeleting(selected)} className={`${buttonSecondary} text-rose-700`}><Trash2 className="size-4" />Hapus</button><button type="button" onClick={() => setSelected([])} aria-label="Batalkan pilihan" className="grid size-10 place-items-center rounded-xl hover:bg-white"><X className="size-4" /></button></div>}
      <div className={`${cardClass} overflow-hidden`}>
        {filtered.length === 0 ? <div className="p-5"><EmptyState title="Transaksi tidak ditemukan" description="Ubah kata kunci atau filter untuk melihat transaksi lain." /></div> : <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300"><tr><th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Pilih semua transaksi di halaman" checked={allVisible} onChange={() => setSelected((current) => allVisible ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])])} className="size-4 accent-emerald-700" /></th>{table.getHeaderGroups()[0]?.headers.map((header) => <th key={header.id} className={`px-4 py-3 ${header.id === "amount" ? "text-right" : ""}`}><button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 font-semibold hover:text-emerald-700"><table.FlexRender header={header} />{header.column.getIsSorted() && <ArrowDownAZ className={`size-3 ${header.column.getIsSorted() === "desc" ? "rotate-180" : ""}`} />}</button></th>)}<th className="w-24 px-4 py-3"><span className="sr-only">Aksi</span></th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{table.getRowModel().rows.map((row) => { const item = row.original; return <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"><td className="px-4 py-3"><input type="checkbox" aria-label={`Pilih ${item.name}`} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} className="size-4 accent-emerald-700" /></td><td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.date)}</td><td className="max-w-56 px-4 py-3"><p className="truncate font-semibold text-slate-900 dark:text-white">{item.name}</p>{item.notes && <p className="truncate text-xs text-slate-600">{item.notes}</p>}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800">{item.category}</span></td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.account}{item.destinationAccount && ` → ${item.destinationAccount}`}</td><td className="px-4 py-3 capitalize">{item.type}</td><td className={`whitespace-nowrap px-4 py-3 text-right font-bold ${item.type === "pemasukan" ? "text-emerald-700" : ""}`}>{item.type === "pemasukan" ? "+" : item.type === "pengeluaran" ? "−" : ""}{formatRupiah(item.amount)}</td><td className="px-4 py-3"><div className="flex justify-end"><button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`} className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="size-4" /></button>{!store.isDemo && item.type !== "transfer" && <button type="button" onClick={() => setAttachmentTransaction(item)} aria-label={`Kelola lampiran ${item.name}`} className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><Paperclip className="size-4" /></button>}<button type="button" onClick={() => setDeleting([item.id])} aria-label={`Hapus ${item.name}`} className="grid size-11 shrink-0 place-items-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 className="size-4" /></button></div></td></tr>; })}</tbody></table></div>
          <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-800">{table.getRowModel().rows.map((row) => { const item = row.original; return <article key={item.id} className="p-4"><div className="flex items-start gap-3"><input type="checkbox" aria-label={`Pilih ${item.name}`} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} className="mt-1 size-4 accent-emerald-700" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3><p className="text-xs text-slate-600">{formatDate(item.date)} · {item.account}</p></div><p className={`whitespace-nowrap font-bold ${item.type === "pemasukan" ? "text-emerald-700" : ""}`}>{item.type === "pemasukan" ? "+" : item.type === "pengeluaran" ? "−" : ""}{formatRupiah(item.amount)}</p></div><div className="mt-3 flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{item.category}</span><button type="button" onClick={() => openEdit(item)} className="ml-auto text-xs font-semibold text-emerald-700">Edit</button>{!store.isDemo && item.type !== "transfer" && <button type="button" onClick={() => setAttachmentTransaction(item)} className="text-xs font-semibold text-emerald-700">Lampiran</button>}<button type="button" onClick={() => setDeleting([item.id])} className="text-xs font-semibold text-rose-600">Hapus</button></div></div></div></article>; })}</div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm sm:flex-row sm:items-center dark:border-slate-800"><p className="text-slate-600">{filtered.length} transaksi · Halaman {table.state.pagination.pageIndex + 1} dari {table.getPageCount()}</p><div className="ml-auto flex items-center gap-2"><button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className={buttonSecondary}><ChevronLeft className="size-4" /><span className="sr-only sm:not-sr-only">Sebelumnya</span></button><button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className={buttonSecondary}><span className="sr-only sm:not-sr-only">Berikutnya</span><ChevronRight className="size-4" /></button></div></div>
        </>}
      </div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={exportCsv} className={buttonSecondary}><Download className="size-4" />Ekspor CSV</button><button type="button" onClick={exportXlsx} className={buttonSecondary}><FileSpreadsheet className="size-4" />Ekspor XLSX</button><a href="/dashboard/impor?demo=1" className={buttonSecondary}><Upload className="size-4" />Impor data</a></div>
      <Modal open={modal} title={editing ? "Edit transaksi" : "Tambah transaksi"} description="Data demo hanya tersimpan di perangkat ini." onClose={() => setModal(false)} size="lg"><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2"><label><span className={labelClass}>Jenis</span><select {...form.register("type")} className={inputClass}><option value="pengeluaran">Pengeluaran</option><option value="pemasukan">Pemasukan</option><option value="transfer">Transfer antar akun</option></select></label><label><span className={labelClass}>Tanggal</span><input type="date" {...form.register("date")} className={inputClass} />{form.formState.errors.date && <span className="text-xs text-rose-600">{form.formState.errors.date.message}</span>}</label><label className="sm:col-span-2"><span className={labelClass}>Nama transaksi</span><input {...form.register("name")} className={inputClass} placeholder="Contoh: Belanja pasar" />{form.formState.errors.name && <span className="text-xs text-rose-600">{form.formState.errors.name.message}</span>}</label><label><span className={labelClass}>Kategori</span><select {...form.register("category")} className={inputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className={labelClass}>Nominal</span><input type="number" min="0" step="1000" {...form.register("amount", { valueAsNumber: true })} className={inputClass} />{form.formState.errors.amount && <span className="text-xs text-rose-600">{form.formState.errors.amount.message}</span>}</label><label><span className={labelClass}>Akun asal</span><select {...form.register("account")} className={inputClass}>{store.accounts.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>{transactionType === "transfer" && <label><span className={labelClass}>Akun tujuan</span><select {...form.register("destinationAccount")} className={inputClass}><option value="">Pilih akun</option>{store.accounts.map((item) => <option key={item.id}>{item.name}</option>)}</select>{form.formState.errors.destinationAccount && <span className="text-xs text-rose-600">{form.formState.errors.destinationAccount.message}</span>}</label>}<label><span className={labelClass}>Estimasi karbon (kg CO₂e)</span><input type="number" min="0" step="0.1" {...form.register("carbonKg", { valueAsNumber: true })} className={inputClass} /></label><label className={transactionType === "transfer" ? "sm:col-span-2" : ""}><span className={labelClass}>Catatan</span><input {...form.register("notes")} className={inputClass} placeholder="Opsional" /></label><div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setModal(false)} className={buttonSecondary}>Batal</button><button type="submit" className={buttonPrimary}>{editing ? "Simpan perubahan" : "Tambah transaksi"}</button></div></form></Modal>
      <Modal open={attachmentTransaction !== null} title="Kelola lampiran" description="Lampiran bersifat privat dan hanya dapat diakses oleh akun Anda." onClose={() => setAttachmentTransaction(null)} size="lg">{attachmentTransaction && <AttachmentManager transactionId={attachmentTransaction.id} transactionName={attachmentTransaction.name} />}</Modal>
      <ConfirmDialog open={deleting.length > 0} title="Hapus transaksi?" description={`${deleting.length} transaksi akan dihapus dari data demo. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus" danger onClose={() => setDeleting([])} onConfirm={() => { store.deleteTransactions(deleting); setSelected((current) => current.filter((id) => !deleting.includes(id))); toast.success("Transaksi dihapus"); }} />
    </>
  );
}
