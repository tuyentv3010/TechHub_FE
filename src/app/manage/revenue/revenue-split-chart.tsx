"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
  gross: {
    label: "Gross",
    color: "hsl(var(--chart-1))",
  },
  instructor: {
    label: "Instructor",
    color: "hsl(var(--chart-2))",
  },
  admin: {
    label: "Admin",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

type RevenueSplitChartProps = {
  dashboardRole: "ADMIN" | "INSTRUCTOR";
  grossRevenue: number;
  instructorRevenue: number;
  adminRevenue: number;
};

export function RevenueSplitChart({ dashboardRole, grossRevenue, instructorRevenue, adminRevenue }: RevenueSplitChartProps) {
  const chartData = [
    { name: "Gross", value: grossRevenue, fill: "var(--color-gross)" },
    { name: dashboardRole === "ADMIN" ? "Admin" : "Instructor", value: dashboardRole === "ADMIN" ? adminRevenue : instructorRevenue, fill: dashboardRole === "ADMIN" ? "var(--color-admin)" : "var(--color-instructor)" },
    { name: dashboardRole === "ADMIN" ? "Instructor" : "Admin", value: dashboardRole === "ADMIN" ? instructorRevenue : adminRevenue, fill: dashboardRole === "ADMIN" ? "var(--color-instructor)" : "var(--color-admin)" },
  ];

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="h-[320px] w-full">
          <ChartContainer config={chartConfig} className="h-full">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={88} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span>Gross revenue</span>
            <span className="font-medium text-foreground">{formatCurrency(grossRevenue)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <span>{dashboardRole === "ADMIN" ? "Admin revenue" : "Instructor revenue"}</span>
            <span className="font-medium text-foreground">
              {formatCurrency(dashboardRole === "ADMIN" ? adminRevenue : instructorRevenue)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
