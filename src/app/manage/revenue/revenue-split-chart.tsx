"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCurrency } from "@/lib/utils";

type RevenueSplitChartProps = {
  dashboardRole: "ADMIN" | "INSTRUCTOR";
  grossRevenue: number;
  instructorRevenue: number;
  adminRevenue: number;
  policyInstructorRate?: number | null;
  policyAdminRate?: number | null;
};

export function RevenueSplitChart({
  dashboardRole,
  grossRevenue,
  instructorRevenue,
  adminRevenue,
  policyInstructorRate,
  policyAdminRate,
}: RevenueSplitChartProps) {
  const instructor = Number(instructorRevenue || 0);
  const admin = Number(adminRevenue || 0);
  const gross = Number(grossRevenue || 0);
  const hasPolicyRates = typeof policyAdminRate === "number" && !Number.isNaN(policyAdminRate);
  const systemPercent = hasPolicyRates
    ? Math.round(Number(policyAdminRate) * 100)
    : gross > 0
      ? Math.round((admin / gross) * 100)
      : 0;
  const instructorPercent = hasPolicyRates
    ? Math.round((Number(policyInstructorRate ?? 0) || 0) * 100)
    : gross > 0
      ? Math.round((instructor / gross) * 100)
      : 0;
  const chartData = hasPolicyRates
    ? [
        { name: "Instructor", value: instructorPercent, fill: "hsl(var(--primary))" },
        { name: "System", value: systemPercent, fill: "hsl(var(--accent-foreground))" },
      ]
    : [
        { name: "Instructor", value: instructor, fill: "hsl(var(--primary))" },
        { name: "System", value: admin, fill: "hsl(var(--accent-foreground))" },
      ];

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Revenue Split</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">
            {dashboardRole === "ADMIN" ? "System Share" : "Commission"}
          </h3>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {systemPercent}%
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Tỉ lệ đang hiển thị từ analytics projection.
      </p>

      <div className="relative h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={84}
              stroke="hsl(var(--card))"
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
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number, name: string) =>
                hasPolicyRates ? [`${Number(value)}%`, name] : [formatCurrency(Number(value)), name]
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold tracking-tight text-foreground">{systemPercent}%</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
            {dashboardRole === "ADMIN" ? "System Share" : "Commission"}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Instructor ({instructorPercent}%)
          </span>
          <span>{formatCurrency(instructor)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent-foreground" />
            System ({systemPercent}%)
          </span>
          <span>{formatCurrency(admin)}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm text-foreground">
          <span>Gross Revenue</span>
          <span>{formatCurrency(gross)}</span>
        </div>
      </div>
    </div>
  );
}
