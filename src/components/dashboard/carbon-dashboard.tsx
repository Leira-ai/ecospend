"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BookOpen, Calculator, CheckCircle2, Info, Leaf, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { DEMO_CURRENT_DATE, DEMO_CURRENT_PERIOD, demoEmissionFactors, estimateDemoTransactionCarbon } from "./demo-data";
import { useDemoStore } from "./demo-store";
import { formatNumber } from "./format";
import type { Transaction } from "./types";
import { Card, ConfirmDialog, PageHeader, Progress, buttonPrimary } from "./ui";
const CarbonBarChart = dynamic(() => import("@/components/charts/carbon-bar-chart").then((module) => module.CarbonBarChart), { ssr: false });
const CarbonDonut = dynamic(() => import("@/components/charts/carbon-donut").then((module) => module.CarbonDonut), { ssr: false });
const colors = ["#047857", "#0ea5e9", "#f59e0b", "#8b5cf6", "#f43f5e", "#64748b"];

const shiftMonth = (period: string, offset: number) => {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (period: string) => new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${period}-01T00:00:00Z`));
const carbonFor = (rows: readonly Transaction[]) => rows.filter((item) => item.type === "pengeluaran").reduce((sum, item) => sum + item.carbonKg, 0);

export function CarbonDashboard() {
  const store = useDemoStore(); const [confirm, setConfirm] = useState(false); const [revision, setRevision] = useState(0);
  const expenses = store.transactions.filter((item) => item.type === "pengeluaran" && item.date.startsWith(DEMO_CURRENT_PERIOD));
  const total = carbonFor(expenses);
  const category = Object.entries(expenses.reduce<Record<string, number>>((map, item) => ({ ...map, [item.category]: (map[item.category] ?? 0) + item.carbonKg }), {})).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
  const periods = Array.from({ length: 6 }, (_, index) => shiftMonth(DEMO_CURRENT_PERIOD, index - 5));
  const monthly = periods.map((period) => carbonFor(store.transactions.filter((item) => item.date.startsWith(period))));
  const bars = periods.map((period, index) => ({ label: monthLabel(period), value: monthly[index], previous: index > 0 ? monthly[index - 1] : undefined }));
  const previous = monthly.at(-2) ?? 0;
  const change = previous > 0 ? (total - previous) / previous * 100 : undefined;
  const estimateDetails = expenses.map((item) => estimateDemoTransactionCarbon(item, store.preferences.carbonMethod)).filter((item) => item.available);
  const confidence = estimateDetails.length ? Math.round(estimateDetails.reduce((sum, item) => sum + item.confidencePercent, 0) / estimateDetails.length) : 0;
  const spend = expenses.reduce((sum, item) => sum + item.amount, 0);
  const top = category[0];
  const sources = [...new Map(demoEmissionFactors.map((factor) => [`${factor.source} (${factor.sourceYear})`, factor])).values()];
  const recalculate = () => { store.recalculateCarbon(); setRevision((value) => value + 1); toast.success("Estimasi karbon dihitung ulang dari faktor demo tersimpan"); };

  return <div className="space-y-6"><PageHeader eyebrow="Dampak lingkungan" title="Jejak karbon" description="Estimasi September dihitung deterministik dari nominal, kategori, metode aktif, dan faktor demo yang ditampilkan." actions={<button type="button" onClick={() => setConfirm(true)} className={buttonPrimary}><RefreshCw className="size-4" />Hitung ulang</button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Card className="p-5"><p className="text-sm text-slate-600">Emisi September</p><p className="mt-2 text-3xl font-bold">{formatNumber(total)} <span className="text-base font-normal">kg CO₂e</span></p>{change === undefined ? <p className="mt-2 text-xs text-slate-600">Belum ada pembanding Agustus</p> : <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${change <= 0 ? "text-emerald-700" : "text-rose-700"}`}>{change <= 0 ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}{formatNumber(Math.abs(change))}% {change <= 0 ? "lebih rendah" : "lebih tinggi"} dari Agustus</p>}</Card><Card className="p-5"><p className="text-sm text-slate-600">Intensitas belanja</p><p className="mt-2 text-3xl font-bold">{formatNumber(spend > 0 ? total / (spend / 1_000_000) : 0)}</p><p className="mt-2 text-xs text-slate-600">kg CO₂e per Rp1 juta pengeluaran</p></Card><Card className="p-5"><p className="text-sm text-slate-600">Keyakinan faktor</p><p className="mt-2 text-3xl font-bold">{confidence}%</p><Progress value={confidence} label="Keyakinan estimasi karbon" /><p className="mt-2 text-xs text-slate-600">Rata-rata metadata faktor yang cocok</p></Card></div>
    <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]"><Card className="p-5 sm:p-6"><h2 className="font-bold">Tren emisi bulanan</h2><p className="text-xs text-slate-600">Nilai dan pembanding berasal dari transaksi tiap bulan</p><CarbonBarChart data={bars} comparison /></Card><Card className="p-5 sm:p-6"><h2 className="font-bold">Sumber emisi</h2><p className="text-xs text-slate-600">Kategori pengeluaran September</p><CarbonDonut data={category} /></Card></div>
    {top && <Card className="overflow-hidden border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5"><div className="flex items-start gap-4"><span className="grid size-11 place-items-center rounded-xl bg-[#0e3b2c] text-[#f6f4ec]"><Leaf className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Wawasan dari data</p><h2 className="mt-1 font-bold">Sumber terbesar: {top.name}</h2><p className="mt-1 text-sm leading-6 text-slate-600">Kategori ini menyumbang {formatNumber(top.value)} kg CO₂e, atau {formatNumber(total > 0 ? top.value / total * 100 : 0)}% dari estimasi September. Ini identifikasi kontribusi, bukan janji penghematan.</p></div></div></Card>}
    <div className="grid gap-6 lg:grid-cols-2"><Card className="p-5"><div className="flex items-center gap-2"><Calculator className="size-5 text-blue-700" /><h2 className="font-bold">Metode perhitungan</h2></div><ol className="mt-4 space-y-4">{[{ t: "Pilih pengeluaran", d: "Transfer dan pemasukan selalu bernilai nol dan dikeluarkan dari emisi." }, { t: "Cocokkan kategori", d: "Kategori memilih faktor belanja demo; kategori tanpa faktor memakai faktor umum demo." }, { t: "Hitung deterministik", d: `Nominal dikalikan faktor. Metode konservatif memakai 125% nilai rata-rata. Revisi lokal: ${revision}.` }].map((item, index) => <li key={item.t} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span><div><p className="text-sm font-semibold">{item.t}</p><p className="mt-0.5 text-xs leading-5 text-slate-600">{item.d}</p></div></li>)}</ol></Card><Card className="p-5"><div className="flex items-center gap-2"><BookOpen className="size-5 text-violet-700" /><h2 className="font-bold">Metadata faktor yang digunakan</h2></div><ul className="mt-4 space-y-3 text-sm">{sources.map((factor) => <li key={factor.id} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /><span>{factor.source} · {factor.region} · keyakinan {formatNumber(Number(factor.confidenceBasisPoints) / 100)}%</span></li>)}</ul><p className="mt-4 text-xs text-slate-600">Dataset demo per {DEMO_CURRENT_DATE}; tidak mengklaim faktor resmi eksternal.</p></Card></div>
    <Card className="flex items-start gap-3 p-5"><Info className="mt-0.5 size-5 shrink-0 text-amber-600" /><div><h2 className="font-semibold">Estimasi, bukan audit karbon</h2><p className="mt-1 text-sm leading-6 text-slate-600">Faktor ini sengaja berlabel demonstrasi. Jangan gunakan hasil untuk pelaporan regulasi, klaim net-zero, atau keputusan investasi tanpa faktor terverifikasi dan tinjauan ahli.</p></div></Card>
    <ConfirmDialog open={confirm} title="Hitung ulang semua estimasi?" description="Kategori, nominal, metode aktif, dan faktor demo tersimpan akan digunakan. Input karbon manual tidak dipertahankan." confirmLabel="Hitung ulang" onClose={() => setConfirm(false)} onConfirm={recalculate} />
  </div>;
}
