"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/utils";

type RevenueSplitChartProps = {
  dashboardRole: "ADMIN" | "INSTRUCTOR";
  grossRevenue: number;
  instructorRevenue: number;
  adminRevenue: number;
};

export function RevenueSplitChart({ dashboardRole, grossRevenue, instructorRevenue, adminRevenue }: RevenueSplitChartProps) {
  const instructor = Number(instructorRevenue || 0);
  const admin = Number(adminRevenue || 0);
  const gross = Number(grossRevenue || 0);
  const chartData = [
    { name: "Instructor", value: instructor, fill: "#9bb9ff" },
    { name: "System", value: admin, fill: "#f59e0b" },
  ];
  const systemPercent = gross > 0 ? Math.round((admin / gross) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={84}
              stroke="rgba(15,23,42,1)"
              strokeWidth={4}
              paddingAngle={1}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(148,163,184,0.25)",
                background: "rgba(255,255,255,0.96)",
                color: "#0f172a",
              }}
              formatter={(value: number, name: string) => [formatCurrency(Number(value)), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-semibold text-slate-900 dark:text-white">{systemPercent}%</p>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {dashboardRole === "ADMIN" ? "System Share" : "Commission"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#9bb9ff]" /> Instructor
          </span>
          <span>{formatCurrency(instructor)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> System
          </span>
          <span>{formatCurrency(admin)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200">
          <span>Gross Revenue</span>
          <span>{formatCurrency(gross)}</span>
        </div>
      </div>
    </div>
  );
}
