"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CircleDollarSign, Leaf, Lightbulb, PiggyBank, Plus, ReceiptText, Sparkles, TrendingDown, WalletCards } from "lucide-react";
import { DEMO_CURRENT_DATE, DEMO_CURRENT_PERIOD } from "@/components/dashboard/demo-data";
import { useDemoStore } from "@/components/dashboard/demo-store";
import { formatDate, formatNumber, formatRupiah } from "@/components/dashboard/format";
import type { Transaction } from "@/components/dashboard/types";
import { MetricCard, PageHeader, Progress, SectionCard, buttonPrimary, buttonSecondary } from "@/components/dashboard/ui";

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

  const metrics = [
    { label: "Total saldo", value: formatRupiah(balance), detail: `${accounts.length} akun · saldo awal + transaksi`, icon: <WalletCards className="size-5" />, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" },
    { label: "Pemasukan", value: formatRupiah(income), detail: comparisonText(income, previousIncome), icon: <ArrowDownLeft className="size-5" />, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950" },
    { label: "Pengeluaran", value: formatRupiah(expenseTotal), detail: comparisonText(expenseTotal, previousExpense), icon: <ArrowUpRight className="size-5" />, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950" },
    { label: "Jejak karbon", value: `${formatNumber(carbon)} kg`, detail: "CO₂e estimasi pengeluaran September", icon: <Leaf className="size-5" />, tone: "bg-teal-50 text-teal-700 dark:bg-teal-950" },
  ];

  return <div className="space-y-6">
    <PageHeader eyebrow="Ikhtisar September 2026" title="Selamat datang kembali" description="Semua angka bulan ini hanya memakai transaksi September 2026." actions={<><Link href="/dashboard/impor?demo=1" className={buttonSecondary}>Impor data</Link><Link href="/dashboard/transaksi?demo=1&new=1" className={buttonPrimary}><Plus className="size-4" />Tambah transaksi</Link></>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric, index) => <MetricCard key={metric.label} index={index} {...metric} />)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]"><SectionCard title="Arus kas" description="Enam bulan terakhir · dari transaksi"><CashflowChart data={cashflow} /></SectionCard><SectionCard title="Distribusi pengeluaran" description="Kategori transaksi September"><CategoryDonut data={categoryData} /><div className="mt-4 grid grid-cols-2 gap-2">{categoryData.slice(0, 4).map((item) => <div key={item.name} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-800"><span className="size-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ background: item.color }} /><span className="truncate font-medium">{item.name}</span></div>)}</div></SectionCard></div>
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><SectionCard title="Transaksi terbaru" description="Aktivitas terakhir dari semua akun" icon={<ReceiptText className="size-5" />} action={<Link href="/dashboard/transaksi?demo=1" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-emerald-700 transition hover:gap-2 hover:bg-emerald-50">Lihat semua<ArrowRight className="size-4" /></Link>} className="p-0"><div className="divide-y divide-slate-100 dark:divide-slate-800">{transactions.slice(0, 5).map((item) => <div key={item.id} className="group flex cursor-default items-center gap-3 px-5 py-3.5 transition hover:bg-emerald-50/50 sm:px-6 dark:hover:bg-emerald-950/30"><span className={`grid size-10 shrink-0 place-items-center rounded-2xl transition group-hover:scale-105 motion-reduce:transition-none ${item.type === "pemasukan" ? "bg-emerald-100 text-emerald-700" : item.type === "transfer" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}><ReceiptText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="truncate text-xs text-slate-600">{item.category} · {formatDate(item.date)}</p></div><p className={`whitespace-nowrap text-sm font-extrabold tabular-nums ${item.type === "pemasukan" ? "text-emerald-700" : ""}`}>{item.type === "pemasukan" ? "+" : item.type === "transfer" ? "↔ " : "−"}{formatRupiah(item.amount)}</p></div>)}</div></SectionCard>
      <div className="space-y-6"><SectionCard eyebrow="Wawasan dari data" title="Sumber emisi terbesar" description="Dihitung dari transaksi bulan ini" icon={<Lightbulb className="size-5" />} action={<Link href="/dashboard/karbon?demo=1" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-emerald-700 transition hover:gap-2 hover:bg-emerald-50">Lihat analisis<ArrowRight className="size-4" /></Link>} className="border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-white dark:border-amber-900/40 dark:from-amber-950/40 dark:to-slate-900"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{insight}</p></SectionCard><SectionCard title="Target tabungan" description="Progres gabungan" icon={<PiggyBank className="size-5" />}><div className="space-y-4">{goals.slice(0, 2).map((goal) => { const value = goal.target > 0 ? goal.saved / goal.target * 100 : 0; return <div key={goal.id}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{goal.name}</span><span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{Math.round(value)}%</span></div><Progress value={value} label={`Kemajuan ${goal.name}`} /></div>; })}</div></SectionCard></div></div>
    <div className="grid gap-6 lg:grid-cols-2"><SectionCard title="Kesehatan anggaran" description="Penggunaan September per kategori" icon={<CircleDollarSign className="size-5" />}><div className="space-y-5">{budgets.slice(0, 3).map((budget) => { const spent = categoryMap[budget.category] ?? 0; const value = budget.limit > 0 ? spent / budget.limit * 100 : 0; return <div key={budget.id}><div className="mb-1.5 flex items-baseline justify-between gap-3 text-xs"><span className="font-semibold">{budget.category}</span><span className="tabular-nums text-slate-600">{formatRupiah(spent, true)} / {formatRupiah(budget.limit, true)}</span></div><Progress value={value} tone={value > 90 ? "rose" : value > 70 ? "amber" : "emerald"} label={`Anggaran ${budget.category}`} /><p className={`mt-1.5 text-[11px] font-semibold ${value > 90 ? "text-rose-700" : value > 70 ? "text-amber-700" : "text-emerald-700"}`}>{Math.round(value)}% terpakai</p></div>; })}</div></SectionCard><SectionCard title="Pembayaran mendatang" description="Jadwal setelah 8 September" icon={<TrendingDown className="size-5" />}><div className="divide-y divide-slate-100 dark:divide-slate-800">{recurringSoon.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3.5"><div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[11px] font-extrabold text-blue-700 dark:bg-blue-950">{item.day}</span><div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-slate-600">Tanggal {item.day} · {item.category}</p></div></div><span className="text-sm font-bold tabular-nums">{formatRupiah(item.amount)}</span></div>)}</div><Link href="/dashboard/pengaturan?demo=1#berulang" className={`${buttonSecondary} mt-4 w-full`}><Sparkles className="size-4" />Kelola transaksi berulang</Link></SectionCard></div>
  </div>;
}
