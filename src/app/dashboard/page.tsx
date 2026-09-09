"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleDollarSign, Leaf, Lightbulb, PiggyBank, Plus, ReceiptText, Sparkles, TrendingDown, WalletCards } from "lucide-react";
import { DEMO_CURRENT_DATE, DEMO_CURRENT_PERIOD } from "@/components/dashboard/demo-data";
import { useDemoStore } from "@/components/dashboard/demo-store";
import { formatDate, formatNumber, formatRupiah } from "@/components/dashboard/format";
import type { Transaction } from "@/components/dashboard/types";
import { Card, PageHeader, Progress, buttonPrimary, buttonSecondary } from "@/components/dashboard/ui";

const CashflowChart = dynamic(() => import("@/components/charts/cashflow-chart").then((module) => module.CashflowChart), { ssr: false });
const CategoryDonut = dynamic(() => import("@/components/charts/category-donut").then((module) => module.CategoryDonut), { ssr: false });
const colors = ["#047857", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f43f5e", "#64748b"];

const shiftMonth = (period: string, offset: number) => {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (period: string) => new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${period}-01T00:00:00Z`));
const sumType = (rows: readonly Transaction[], type: Transaction["type"]) => rows.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0);
const comparisonText = (current: number, previous: number) => {
  if (previous <= 0) return current > 0 ? "Tidak ada pembanding bulan lalu" : "Belum ada data bulan ini";
  const change = (current - previous) / previous * 100;
  return `${formatNumber(Math.abs(change))}% ${change >= 0 ? "lebih tinggi" : "lebih rendah"} dari bulan lalu`;
};

export default function DashboardPage() {
  const { transactions, budgets, goals, accounts, recurring } = useDemoStore();
  const currentRows = transactions.filter((item) => item.date.startsWith(DEMO_CURRENT_PERIOD));
  const previousRows = transactions.filter((item) => item.date.startsWith(shiftMonth(DEMO_CURRENT_PERIOD, -1)));
  const expenses = currentRows.filter((item) => item.type === "pengeluaran");
  const income = sumType(currentRows, "pemasukan");
  const expenseTotal = sumType(currentRows, "pengeluaran");
  const previousIncome = sumType(previousRows, "pemasukan");
  const previousExpense = sumType(previousRows, "pengeluaran");
  const carbon = expenses.reduce((sum, item) => sum + item.carbonKg, 0);
  const balance = accounts.reduce((sum, item) => sum + item.balance, 0);
  const categoryMap = expenses.reduce<Record<string, number>>((map, item) => ({ ...map, [item.category]: (map[item.category] ?? 0) + item.amount }), {});
  const carbonMap = expenses.reduce<Record<string, number>>((map, item) => ({ ...map, [item.category]: (map[item.category] ?? 0) + item.carbonKg }), {});
  const categoryData = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
  const cashflow = Array.from({ length: 6 }, (_, index) => shiftMonth(DEMO_CURRENT_PERIOD, index - 5)).map((period) => {
    const rows = transactions.filter((item) => item.date.startsWith(period));
    return { month: monthLabel(period), income: sumType(rows, "pemasukan"), expense: sumType(rows, "pengeluaran") };
  });
  const recurringSoon = recurring.filter((item) => item.active && item.day >= Number(DEMO_CURRENT_DATE.slice(-2))).sort((a, b) => a.day - b.day).slice(0, 3);
  const topCarbon = Object.entries(carbonMap).sort((left, right) => right[1] - left[1])[0];
  const insight = topCarbon
    ? `${topCarbon[0]} menyumbang ${formatNumber(carbon > 0 ? topCarbon[1] / carbon * 100 : 0)}% dari estimasi bulan ini.`
    : "Belum ada pengeluaran berestimasi karbon bulan ini.";

  return <div className="space-y-6">
    <PageHeader eyebrow="Ikhtisar September 2026" title="Selamat datang kembali" description="Semua angka bulan ini hanya memakai transaksi September 2026." actions={<><Link href="/dashboard/impor?demo=1" className={buttonSecondary}>Impor data</Link><Link href="/dashboard/transaksi?demo=1&new=1" className={buttonPrimary}><Plus className="size-4" />Tambah transaksi</Link></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Total saldo", value: formatRupiah(balance), detail: `${accounts.length} akun · saldo awal + transaksi`, icon: WalletCards, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" },
      { label: "Pemasukan", value: formatRupiah(income), detail: comparisonText(income, previousIncome), icon: ArrowDownLeft, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950" },
      { label: "Pengeluaran", value: formatRupiah(expenseTotal), detail: comparisonText(expenseTotal, previousExpense), icon: ArrowUpRight, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950" },
      { label: "Jejak karbon", value: `${formatNumber(carbon)} kg`, detail: "CO₂e estimasi pengeluaran September", icon: Leaf, tone: "bg-teal-50 text-teal-700 dark:bg-teal-950" },
    ].map(({ label, value, detail, icon: Icon, tone }) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></div><span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span></div></Card>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]"><Card className="p-5 sm:p-6"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Arus kas</h2><p className="text-xs text-slate-500">Enam bulan terakhir · dari transaksi</p></div></div><CashflowChart data={cashflow} /></Card><Card className="p-5 sm:p-6"><h2 className="font-bold">Distribusi pengeluaran</h2><p className="text-xs text-slate-500">Kategori transaksi September</p><CategoryDonut data={categoryData} /><div className="grid grid-cols-2 gap-2">{categoryData.slice(0, 4).map((item) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} /><span className="truncate">{item.name}</span></div>)}</div></Card></div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><div><h2 className="font-bold">Transaksi terbaru</h2><p className="text-xs text-slate-500">Aktivitas terakhir dari semua akun</p></div><Link href="/dashboard/transaksi?demo=1" className="flex items-center gap-1 text-sm font-semibold text-emerald-700">Lihat semua<ArrowRight className="size-4" /></Link></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{transactions.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-3 px-5 py-3.5"><span className="grid size-10 place-items-center rounded-xl bg-slate-100"><ReceiptText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="truncate text-xs text-slate-500">{item.category} · {formatDate(item.date)}</p></div><p className={`text-sm font-bold ${item.type === "pemasukan" ? "text-emerald-700" : ""}`}>{item.type === "pemasukan" ? "+" : item.type === "transfer" ? "↔ " : "−"}{formatRupiah(item.amount)}</p></div>)}</div></Card>
      <div className="space-y-6"><Card className="p-5"><div className="flex items-start gap-3"><Lightbulb className="mt-0.5 size-5 text-amber-700" /><div><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Wawasan dari data</p><h2 className="mt-1 font-bold">Sumber emisi terbesar</h2><p className="mt-1 text-sm leading-6 text-slate-600">{insight}</p><Link href="/dashboard/karbon?demo=1" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Lihat analisis<ArrowRight className="size-4" /></Link></div></div></Card><Card className="p-5"><div className="flex justify-between"><div><h2 className="font-bold">Target tabungan</h2><p className="text-xs text-slate-500">Progres gabungan</p></div><PiggyBank className="size-5 text-emerald-700" /></div><div className="mt-4 space-y-4">{goals.slice(0, 2).map((goal) => { const value = goal.target > 0 ? goal.saved / goal.target * 100 : 0; return <div key={goal.id}><div className="mb-1.5 flex justify-between text-xs"><span>{goal.name}</span><span>{Math.round(value)}%</span></div><Progress value={value} label={`Kemajuan ${goal.name}`} /></div>; })}</div></Card></div></div>
    <div className="grid gap-6 lg:grid-cols-2"><Card className="p-5"><div className="flex justify-between"><div><h2 className="font-bold">Kesehatan anggaran</h2><p className="text-xs text-slate-500">Penggunaan September per kategori</p></div><CircleDollarSign className="size-5 text-emerald-700" /></div><div className="mt-4 space-y-4">{budgets.slice(0, 3).map((budget) => { const spent = categoryMap[budget.category] ?? 0; const value = budget.limit > 0 ? spent / budget.limit * 100 : 0; return <div key={budget.id}><div className="mb-1.5 flex justify-between text-xs"><span>{budget.category}</span><span>{formatRupiah(spent, true)} / {formatRupiah(budget.limit, true)}</span></div><Progress value={value} tone={value > 90 ? "rose" : value > 70 ? "amber" : "emerald"} label={`Anggaran ${budget.category}`} /></div>; })}</div></Card><Card className="p-5"><div className="flex justify-between"><div><h2 className="font-bold">Pembayaran mendatang</h2><p className="text-xs text-slate-500">Jadwal setelah 8 September</p></div><TrendingDown className="size-5 text-blue-700" /></div><div className="mt-3 divide-y divide-slate-100">{recurringSoon.map((item) => <div key={item.id} className="flex justify-between py-3"><div><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-slate-500">Tanggal {item.day} · {item.category}</p></div><span className="text-sm font-semibold">{formatRupiah(item.amount)}</span></div>)}</div><Link href="/dashboard/pengaturan?demo=1#berulang" className={`${buttonSecondary} mt-2 w-full`}><Sparkles className="size-4" />Kelola transaksi berulang</Link></Card></div>
  </div>;
}
