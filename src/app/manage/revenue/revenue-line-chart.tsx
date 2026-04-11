"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";

const chartConfig = {
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
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="h-[360px] w-full">
          <ChartContainer config={chartConfig} className="h-full">
            <LineChart data={revenueByDate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickMargin={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value}
              />
              <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
              <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
              <Line type="monotone" dataKey="gross" stroke="var(--color-gross)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="instructor" stroke="var(--color-instructor)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="admin" stroke="var(--color-admin)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
