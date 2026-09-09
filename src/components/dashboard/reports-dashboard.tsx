"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { DEMO_CURRENT_PERIOD } from "./demo-data";
import { useDemoStore } from "./demo-store";
import { downloadBlob, formatNumber, formatRupiah, sanitizeSpreadsheetRows, toCsv } from "./format";
import type { Transaction } from "./types";
import { Card, PageHeader, buttonSecondary, inputClass } from "./ui";
const CashflowChart = dynamic(() => import("@/components/charts/cashflow-chart").then((module) => module.CashflowChart), { ssr: false });

const shiftMonth = (period: string, offset: number) => {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (period: string) => new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${period}-01T00:00:00Z`));
const sumType = (rows: readonly Transaction[], type: Transaction["type"]) => rows.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0);

export function ReportsDashboard() {
  const store = useDemoStore(); const [period, setPeriod] = useState(DEMO_CURRENT_PERIOD);
  const rows = useMemo(() => store.transactions.filter((item) => item.date.startsWith(period)), [period, store.transactions]);
  const income = sumType(rows, "pemasukan"); const expense = sumType(rows, "pengeluaran");
  const carbon = rows.filter((item) => item.type === "pengeluaran").reduce((sum, item) => sum + item.carbonKg, 0);
  const exportRows = rows.map((item) => ({ Tanggal: item.date, Nama: item.name, Kategori: item.category, Akun: item.account, Jenis: item.type, Nominal: item.amount, "Karbon kg CO2e": item.type === "pengeluaran" ? item.carbonKg : 0 }));
  const safeExportRows = sanitizeSpreadsheetRows(exportRows);
  const csv = () => { downloadBlob(`\uFEFF${toCsv(exportRows)}`, `laporan-${period}.csv`, "text/csv;charset=utf-8"); toast.success("Laporan CSV diunduh"); };
  const json = () => { downloadBlob(JSON.stringify({ period, summary: { income, expense, net: income - expense, carbon }, transactions: rows }, null, 2), `laporan-${period}.json`, "application/json"); toast.success("Laporan JSON diunduh"); };
  const xlsx = async () => { try { const ExcelJS = await import("exceljs"); const workbook = new ExcelJS.Workbook(); const summary = workbook.addWorksheet("Ringkasan"); summary.addRows([["Laporan EcoSpend", period], ["Pemasukan", income], ["Pengeluaran", expense], ["Saldo bersih", income - expense], ["Karbon kg CO2e", carbon]]); const sheet = workbook.addWorksheet("Transaksi"); sheet.columns = Object.keys(safeExportRows[0] ?? { Tanggal: "" }).map((key) => ({ header: key, key, width: 22 })); sheet.addRows(safeExportRows); sheet.getRow(1).font = { bold: true }; downloadBlob(await workbook.xlsx.writeBuffer(), `laporan-${period}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); toast.success("Laporan XLSX diunduh"); } catch { toast.error("Ekspor XLSX belum tersedia. Gunakan CSV."); } };
  const trend = Array.from({ length: 6 }, (_, index) => shiftMonth(period, index - 5)).map((month) => { const monthRows = store.transactions.filter((item) => item.date.startsWith(month)); return { month: monthLabel(month), income: sumType(monthRows, "pemasukan"), expense: sumType(monthRows, "pengeluaran") }; });
  return <div className="space-y-6"><PageHeader eyebrow="Ringkasan data" title="Laporan" description="Setiap ringkasan, tren, tabel, dan ekspor berasal dari transaksi periode terkait." actions={<button type="button" onClick={() => window.print()} className={buttonSecondary}><Printer className="size-4" />Cetak</button>} />
    <Card className="p-5 print:hidden"><label className="flex flex-col gap-2 sm:flex-row sm:items-center"><span className="text-sm font-semibold">Periode laporan</span><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className={`${inputClass} sm:ml-auto sm:w-52`} /></label></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Pemasukan", value: formatRupiah(income) }, { label: "Pengeluaran", value: formatRupiah(expense) }, { label: "Saldo bersih", value: formatRupiah(income - expense) }, { label: "Estimasi karbon", value: `${formatNumber(carbon)} kg CO₂e` }].map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-bold">{item.value}</p></Card>)}</div>
    <Card className="p-5 sm:p-6"><h2 className="font-bold">Perbandingan arus kas</h2><p className="text-xs text-slate-500">Enam bulan sampai periode terpilih · dari transaksi</p><CashflowChart data={trend} /></Card>
    <Card className="overflow-hidden"><div className="border-b border-slate-100 p-5 dark:border-slate-800"><h2 className="font-bold">Rincian periode</h2><p className="text-xs text-slate-500">{rows.length} transaksi tercatat</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{["Tanggal", "Nama", "Kategori", "Jenis", "Nominal", "Karbon"].map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800"><td className="px-4 py-3">{item.date}</td><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3 capitalize">{item.type}</td><td className="px-4 py-3 font-semibold">{formatRupiah(item.amount)}</td><td className="px-4 py-3">{formatNumber(item.type === "pengeluaran" ? item.carbonKg : 0)} kg</td></tr>)}</tbody></table></div></Card>
    <Card className="p-5 print:hidden"><h2 className="font-bold">Unduh laporan</h2><p className="mt-1 text-sm text-slate-500">File hanya memuat periode terpilih; CSV dan XLSX menetralkan awalan formula.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={csv} className={buttonSecondary}><Download className="size-4" />CSV</button><button type="button" onClick={xlsx} className={buttonSecondary}><FileSpreadsheet className="size-4" />XLSX</button><button type="button" onClick={json} className={buttonSecondary}><FileJson className="size-4" />JSON</button><button type="button" onClick={() => window.print()} className={buttonSecondary}><Printer className="size-4" />Cetak / PDF</button></div></Card>
  </div>;
}
