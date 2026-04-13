"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/utils";

type RevenueLineChartProps = {
  revenueByDate: Array<{
    date: string;
    gross: number;
    instructor: number;
    admin: number;
    orders: number;
  }>;
};

export function RevenueLineChart({ revenueByDate }: RevenueLineChartProps) {
  const hasData = revenueByDate.length > 0;

  if (!hasData) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-white/5 text-sm text-slate-400 shadow-[0_0_0_1px_rgba(173,198,255,0.04)]">
        No transaction data available
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={revenueByDate} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(173, 198, 255, 0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            tickMargin={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8c909f", fontSize: 11 }}
            tickFormatter={(value: string) => (typeof value === "string" ? value.slice(5) : value)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8c909f", fontSize: 11 }}
            tickFormatter={(value) => {
              const n = Number(value);
              if (n >= 1000000) return `${Math.round(n / 1000000)}M`;
              if (n >= 1000) return `${Math.round(n / 1000)}K`;
              return String(n);
            }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(148,163,184,0.4)", strokeDasharray: "5 5" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgba(173,198,255,0.12)",
              background: "rgba(10,14,26,0.96)",
              color: "#dfe2f3",
            }}
            formatter={(value: number, name: string) => [formatCurrency(Number(value)), name]}
          />
          <Line type="monotone" dataKey="gross" name="Gross" stroke="#adc6ff" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="instructor" name="Instructor" stroke="#4edea3" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="admin" name="System" stroke="#ffb95f" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
