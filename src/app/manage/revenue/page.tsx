"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "@/components/app-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { useRevenueDashboard } from "@/queries/useRevenue";
import { getAccessTokenFromLocalStorage, decodeToken } from "@/lib/utils";
import { BarChart3, CalendarDays, Coins, RefreshCw, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const money = (value?: number | string | null) => {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

export default function RevenueDashboardPage() {
  const { role } = useAppContext();
  const { toast } = useToast();
  const dashboardRole: "ADMIN" | "INSTRUCTOR" = role === "ADMIN" ? "ADMIN" : "INSTRUCTOR";
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [adminInstructorId, setAdminInstructorId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const token = getAccessTokenFromLocalStorage();
    if (!token) return;
    try {
      const decoded = decodeToken(token);
      const userId = (decoded as any)?.userId || (decoded as any)?.user?.id;
      if (userId) {
        setCurrentUserId(String(userId));
      }
    } catch (error) {
      console.error("Failed to decode token for revenue dashboard", error);
    }
  }, []);

  const params = useMemo(
    () => ({
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      instructorId: dashboardRole === "ADMIN" ? adminInstructorId || undefined : undefined,
    }),
    [adminInstructorId, dashboardRole, fromDate, toDate]
  );

  const { data, isLoading, isFetching, refetch, error } = useRevenueDashboard(dashboardRole, params);

  const overview = data?.overview;
  const trends = data?.trends || [];

  const chartData = useMemo(
    () =>
      trends.map((item: any) => ({
        date: item.metricDate,
        gross: Number(item.grossRevenue || 0),
        instructor: Number(item.instructorRevenue || 0),
        admin: Number(item.adminRevenue || 0),
        orders: Number(item.totalOrders || 0),
      })),
    [trends]
  );

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (err: any) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err?.message || "Không thể tải dashboard doanh thu",
        variant: "destructive",
      });
    }
  };

  const summaryCards = [
    {
      title: "Tổng doanh thu",
      value: money(overview?.grossRevenue),
      icon: Coins,
      tone: "from-emerald-500/15 to-emerald-500/5",
    },
    {
      title: dashboardRole === "ADMIN" ? "Doanh thu hệ thống" : "Thu nhập giảng viên",
      value: money(dashboardRole === "ADMIN" ? overview?.adminRevenue : overview?.instructorRevenue),
      icon: Wallet,
      tone: "from-sky-500/15 to-sky-500/5",
    },
    {
      title: "Số đơn thành công",
      value: String(overview?.totalOrders || 0),
      icon: TrendingUp,
      tone: "from-violet-500/15 to-violet-500/5",
    },
    {
      title: "Số item đã bán",
      value: String(overview?.totalItems || 0),
      icon: BarChart3,
      tone: "from-amber-500/15 to-amber-500/5",
    },
  ];

  return (
    <main className="p-4 sm:px-6 sm:py-4 md:p-8 space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.18),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="w-fit bg-white/10 text-white border-white/15">Revenue Analytics</Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Dashboard doanh thu & chia lợi nhuận</h1>
            <p className="text-sm text-white/75 md:text-base">
              {dashboardRole === "ADMIN"
                ? "Xem toàn bộ doanh thu hệ thống, đối soát theo giảng viên và theo ngày."
                : "Xem doanh thu khóa học của riêng bạn theo ngày và tổng thu nhập ước tính."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
              <div className="text-white/60">Vai trò</div>
              <div className="font-semibold">{dashboardRole}</div>
            </div>
            {dashboardRole === "INSTRUCTOR" && currentUserId && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-white/60">Instructor ID</div>
                <div className="font-semibold break-all">{currentUserId}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={`border-none bg-gradient-to-br ${card.tone} shadow-sm`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Bộ lọc doanh thu
            </CardTitle>
            <CardDescription>Chọn khoảng ngày để xem trend và tổng hợp.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {dashboardRole === "ADMIN" && (
              <Input
                placeholder="Instructor ID (optional)"
                value={adminInstructorId}
                onChange={(e) => setAdminInstructorId(e.target.value)}
                className="lg:w-[320px]"
              />
            )}
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="lg:w-[180px]" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="lg:w-[180px]" />
            <Button onClick={handleRefresh} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Doanh thu theo ngày
            </CardTitle>
            <CardDescription>Gross / instructor / admin revenue từ analytics-service.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickMargin={10} />
                  <YAxis tickFormatter={(v) => money(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="gross" stroke="#10b981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="instructor" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="admin" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Phân bổ doanh thu
            </CardTitle>
            <CardDescription>
              {dashboardRole === "ADMIN"
                ? "Tỉ lệ đang hiển thị từ analytics projection."
                : "Đây là doanh thu ước tính theo policy chia lợi nhuận."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickMargin={10} />
                  <YAxis tickFormatter={(v) => money(v)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="instructor" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="admin" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Chi tiết theo ngày</CardTitle>
          <CardDescription>Bảng projection từ analytics-service.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Ngày</th>
                  <th className="px-4 py-3 text-right font-medium">Gross</th>
                  <th className="px-4 py-3 text-right font-medium">Instructor</th>
                  <th className="px-4 py-3 text-right font-medium">Admin</th>
                  <th className="px-4 py-3 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {chartData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu trong khoảng thời gian này."}
                    </td>
                  </tr>
                ) : (
                  chartData.map((row) => (
                    <tr key={row.date} className="border-b last:border-0">
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3 text-right">{money(row.gross)}</td>
                      <td className="px-4 py-3 text-right">{money(row.instructor)}</td>
                      <td className="px-4 py-3 text-right">{money(row.admin)}</td>
                      <td className="px-4 py-3 text-right">{row.orders}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Không tải được dashboard doanh thu. Vui lòng thử lại sau.
          </CardContent>
        </Card>
      )}
    </main>
  );
}