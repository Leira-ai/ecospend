"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/components/dashboard/format";

export type CarbonPoint = { label: string; value: number; previous?: number };

export function CarbonBarChart({ data, comparison = false, summary }: { data: CarbonPoint[]; comparison?: boolean; summary?: string }) {
  return (
    <figure className="w-full">
      <div className="h-72 w-full" role="img" aria-label={summary ?? "Grafik emisi karbon dalam kilogram CO2e"}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="#d7dfdc" strokeDasharray="4 4" opacity={0.7} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 11 }} unit=" kg" />
            <Tooltip formatter={(value) => `${formatNumber(Number(value))} kg CO₂e`} contentStyle={{ borderRadius: 12, borderColor: "#d7dfdc" }} />
            {comparison && <Bar dataKey="previous" name="Periode lalu" fill="#cbd5e1" radius={[5, 5, 0, 0]} />}
            <Bar dataKey="value" name="Periode ini" fill="#059669" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {data.map((item) => `${item.label}: ${formatNumber(item.value)} kg CO2e${item.previous !== undefined ? `, periode lalu ${formatNumber(item.previous)} kg CO2e` : ""}`).join("; ")}
      </figcaption>
    </figure>
  );
}
