"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRupiah } from "@/components/dashboard/format";

export type CashflowPoint = { month: string; income: number; expense: number };

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <figure className="w-full">
      <div className="h-72 w-full" role="img" aria-label="Grafik arus kas pemasukan dan pengeluaran enam bulan">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.3}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#d7dfdc" strokeDasharray="4 4" opacity={0.7} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(value) => formatRupiah(Number(value), true)} />
            <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#d7dfdc", boxShadow: "0 10px 30px rgb(15 23 42 / .1)" }} />
            <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#059669" strokeWidth={2.5} fill="url(#incomeGradient)" />
            <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f59e0b" strokeWidth={2.5} fill="url(#expenseGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {data.map((item) => `${item.month}: pemasukan ${formatRupiah(item.income)}, pengeluaran ${formatRupiah(item.expense)}`).join("; ")}
      </figcaption>
    </figure>
  );
}
