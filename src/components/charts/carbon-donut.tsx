"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatNumber } from "@/components/dashboard/format";
import type { CategoryPoint } from "./category-donut";

export function CarbonDonut({ data }: { data: CategoryPoint[] }) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Komposisi emisi karbon berdasarkan kategori">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="74%" paddingAngle={2} stroke="none">
            {data.map((item) => <Cell key={item.name} fill={item.color} />)}
          </Pie>
          <Tooltip formatter={(value) => `${formatNumber(Number(value))} kg CO₂e`} contentStyle={{ borderRadius: 12, borderColor: "#d7dfdc" }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
