"use client";

import { useState } from "react";
import { AlertTriangle, CalendarClock, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { categories, DEMO_CURRENT_DATE, DEMO_CURRENT_PERIOD } from "./demo-data";
import { useDemoStore } from "./demo-store";
import { createId, formatRupiah } from "./format";
import type { Budget } from "./types";
import { Card, ConfirmDialog, Modal, PageHeader, Progress, buttonPrimary, buttonSecondary, inputClass, labelClass } from "./ui";

const elapsedDay = Number(DEMO_CURRENT_DATE.slice(-2));
const daysInPeriod = new Date(Number(DEMO_CURRENT_PERIOD.slice(0, 4)), Number(DEMO_CURRENT_PERIOD.slice(5, 7)), 0).getDate();
const MIN_FORECAST_DAYS = 7;

export function BudgetManager() {
  const store = useDemoStore();
  const [modal, setModal] = useState(false); const [editing, setEditing] = useState<Budget | null>(null); const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ category: categories[0], limit: 1_000_000 });
  const currentExpenses = store.transactions.filter((item) => item.type === "pengeluaran" && item.date.startsWith(DEMO_CURRENT_PERIOD));
  const spentByCategory = currentExpenses.reduce<Record<string, number>>((map, item) => ({ ...map, [item.category]: (map[item.category] ?? 0) + item.amount }), {});
  const open = (item?: Budget) => { setEditing(item ?? null); setForm(item ? { category: item.category, limit: item.limit } : { category: categories.find((category) => !store.budgets.some((budget) => budget.category === category)) ?? categories[0], limit: 1_000_000 }); setModal(true); };
  const save = () => { if (form.limit <= 0) return toast.error("Batas harus lebih dari nol"); store.saveBudget({ id: editing?.id ?? createId("budget"), ...form }); setModal(false); toast.success("Anggaran disimpan"); };
  const totalLimit = store.budgets.reduce((sum, item) => sum + item.limit, 0);
  const totalSpent = store.budgets.reduce((sum, item) => sum + (spentByCategory[item.category] ?? 0), 0);
  const totalPercent = totalLimit > 0 ? Math.round(totalSpent / totalLimit * 100) : 0;

  return <div className="space-y-6"><PageHeader eyebrow="Rencana belanja September" title="Anggaran" description="Penggunaan dan proyeksi hanya memakai pengeluaran September 2026 pada kategori beranggaran." actions={<button type="button" className={buttonPrimary} onClick={() => open()}><Plus className="size-4" />Tambah anggaran</button>} />
    <div className="grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-sm text-slate-500">Total anggaran</p><p className="mt-2 text-2xl font-bold">{formatRupiah(totalLimit)}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Terpakai</p><p className="mt-2 text-2xl font-bold">{formatRupiah(totalSpent)}</p><p className="mt-1 text-xs text-slate-500">{totalPercent}% dari total</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Sisa aman</p><p className="mt-2 text-2xl font-bold text-emerald-700">{formatRupiah(Math.max(0, totalLimit - totalSpent))}</p></Card></div>
    <div className="grid gap-4 lg:grid-cols-2">{store.budgets.map((item) => {
      const spent = spentByCategory[item.category] ?? 0;
      const used = item.limit > 0 ? spent / item.limit * 100 : 0;
      const canForecast = elapsedDay >= MIN_FORECAST_DAYS && currentExpenses.some((expense) => expense.category === item.category);
      const forecast = canForecast ? spent / elapsedDay * daysInPeriod : 0;
      const forecastPercent = item.limit > 0 ? forecast / item.limit * 100 : 0;
      const tone = used > 100 ? "rose" : used > 75 ? "amber" : "emerald";
      return <Card key={item.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold">{item.category}</h2><p className="mt-1 text-sm text-slate-500">{formatRupiah(spent)} dari {formatRupiah(item.limit)}</p></div><div className="flex"><button type="button" onClick={() => open(item)} aria-label={`Edit anggaran ${item.category}`} className="grid size-9 place-items-center rounded-lg"><Pencil className="size-4" /></button><button type="button" onClick={() => setDeleting(item.id)} aria-label={`Hapus anggaran ${item.category}`} className="grid size-9 place-items-center rounded-lg text-rose-600"><Trash2 className="size-4" /></button></div></div><div className="mt-4"><Progress value={used} tone={tone} label={`Penggunaan anggaran ${item.category}`} /><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{Math.round(used)}% terpakai</span><span>Sisa {formatRupiah(Math.max(0, item.limit - spent))}</span></div></div>{canForecast ? <div className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${forecastPercent > 100 ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{forecastPercent > 100 ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <TrendingUp className="mt-0.5 size-4 shrink-0" />}<span>Proyeksi akhir September <strong>{formatRupiah(forecast)}</strong> ({Math.round(forecastPercent)}% batas).</span></div> : <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Proyeksi tersedia setelah minimal {MIN_FORECAST_DAYS} hari dan ada pengeluaran periode ini.</div>}</Card>;
    })}</div>
    <Card className="flex items-start gap-3 p-5"><CalendarClock className="mt-0.5 size-5 shrink-0 text-blue-700" /><div><h2 className="font-semibold">Cara kerja proyeksi</h2><p className="mt-1 text-sm text-slate-500">Setelah data cukup, pengeluaran kategori dari 1–{elapsedDay} September dirata-ratakan per hari dan diperluas hingga {daysInPeriod} September. Riwayat bulan lama tidak digunakan.</p></div></Card>
    <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit anggaran" : "Tambah anggaran"}><div className="space-y-4"><label><span className={labelClass}>Kategori</span><select value={form.category} disabled={Boolean(editing)} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={inputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className={labelClass}>Batas bulanan</span><input type="number" min="1" step="10000" value={form.limit} onChange={(event) => setForm((current) => ({ ...current, limit: Number(event.target.value) }))} className={inputClass} /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setModal(false)} className={buttonSecondary}>Batal</button><button type="button" onClick={save} className={buttonPrimary}>Simpan</button></div></div></Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Hapus anggaran?" description="Riwayat transaksi tidak akan dihapus." danger confirmLabel="Hapus" onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) store.deleteBudget(deleting); toast.success("Anggaran dihapus"); }} />
  </div>;
}
