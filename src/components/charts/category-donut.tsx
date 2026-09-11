"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatRupiah } from "@/components/dashboard/format";

export type CategoryPoint = { name: string; value: number; color: string };

export function CategoryDonut({ data, centerLabel = "Pengeluaran" }: { data: CategoryPoint[]; centerLabel?: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <figure className="w-full">
      <div className="relative h-64 w-full" role="img" aria-label={`Diagram donat ${centerLabel.toLowerCase()} per kategori`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="86%" paddingAngle={2} stroke="none">
              {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            </Pie>
            <Tooltip formatter={(value) => formatRupiah(Number(value))} contentStyle={{ borderRadius: 12, borderColor: "#d7dfdc" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xs text-slate-600 dark:text-slate-300">{centerLabel}</p><p className="mt-0.5 text-lg font-bold text-slate-950 dark:text-white">{formatRupiah(total, true)}</p></div></div>
      </div>
      <figcaption className="sr-only">
        {data.map((item) => `${item.name}: ${formatRupiah(item.value)}`).join("; ")}
      </figcaption>
    </figure>
  );
}
