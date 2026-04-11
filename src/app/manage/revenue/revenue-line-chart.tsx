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
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-white/10 bg-slate-900/30 text-sm text-slate-400">
        No transaction data available
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={revenueByDate} margin={{ top: 10, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
          <XAxis
            dataKey="date"
            tickMargin={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={(value: string) => (typeof value === "string" ? value.slice(5) : value)}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
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
              border: "1px solid rgba(148,163,184,0.25)",
              background: "rgba(15,23,42,0.95)",
              color: "#e2e8f0",
            }}
            formatter={(value: number, name: string) => [formatCurrency(Number(value)), name]}
          />
          <Line type="monotone" dataKey="gross" name="Gross" stroke="#9bb9ff" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="instructor" name="Instructor" stroke="#34d399" strokeWidth={2.2} dot={false} />
          <Line type="monotone" dataKey="admin" name="Admin" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
