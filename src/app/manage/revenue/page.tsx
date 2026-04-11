"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Coins,
  CreditCard,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { useAppContext } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import paymentApiRequest, { PaymentTransactionItem } from "@/apiRequests/payment";
import { useRevenueDashboard } from "@/queries/useRevenue";
import { decodeToken, formatCurrency, getAccessTokenFromLocalStorage } from "@/lib/utils";

import { RevenueLineChart } from "./revenue-line-chart";
import { RevenueSplitChart } from "./revenue-split-chart";

const formatDateInput = (value: Date) => format(value, "yyyy-MM-dd");

type RevenueChartRow = {
  date: string;
  gross: number;
  instructor: number;
  admin: number;
  orders: number;
};

type NormalizedTransaction = {
  id: string;
  transactionId: string;
  userLabel: string;
  courseLabel: string;
  gross: number;
  instructor: number;
  admin: number;
  method: string;
  status: string;
  createdAt: string;
};

const statusTone: Record<string, string> = {
  COMPLETED:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40",
  SUCCESS:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40",
  PROCESSING:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40",
  PENDING:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/40",
  FAILED:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40",
  CANCELLED:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/40",
};

const toSafeList = (payload: any): PaymentTransactionItem[] => {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

const toNormalizedTransaction = (item: PaymentTransactionItem): NormalizedTransaction => {
  const id = String(item.id || item.paymentId || item.transactionId || "");
  const transactionId = String(item.transactionId || item.id || "N/A");
  const gross = Number(item.grossAmount ?? item.amount ?? 0);
  const instructor = Number(item.instructorAmount ?? 0);
  const admin = Number(item.adminAmount ?? 0);
  const userLabel =
    String(item.userName || item.userEmail || item.userId || "Unknown user").trim() || "Unknown user";
  const courseLabel =
    String(item.courseName || item.courseId || "Unknown course").trim() || "Unknown course";
  const status = String(item.status || "PENDING").toUpperCase();
  const createdAt = String(item.createdAt || item.created || item.updatedAt || item.updated || "");

  return {
    id,
    transactionId,
    userLabel,
    courseLabel,
    gross,
    instructor,
    admin,
    method: String(item.paymentMethod || "N/A"),
    status,
    createdAt,
  };
};

const formatDateTime = (value: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd/MM/yyyy HH:mm");
};

export default function RevenueDashboardPage() {
  const { isAuth, role } = useAppContext();
  const { toast } = useToast();
  const dashboardRole: "ADMIN" | "INSTRUCTOR" | null =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? "ADMIN"
      : role === "INSTRUCTOR"
        ? "INSTRUCTOR"
        : null;
  const initialFromDate = useMemo(() => formatDateInput(startOfMonth(new Date())), []);
  const initialToDate = useMemo(() => formatDateInput(new Date()), []);
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [adminInstructorId, setAdminInstructorId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [transactionPage, setTransactionPage] = useState(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState("");

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

  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["revenue-transactions", transactionPage],
    queryFn: () => paymentApiRequest.getPaymentHistory({ page: transactionPage, size: 10 }),
    enabled: !!dashboardRole,
  });

  const {
    data: detailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ["revenue-transaction-detail", selectedTransactionId],
    queryFn: () => paymentApiRequest.getPaymentDetail(selectedTransactionId),
    enabled: !!selectedTransactionId,
  });

  const overview = data?.overview;
  const trends = data?.trends || [];

  const chartData = useMemo<RevenueChartRow[]>(
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

  const transactions = useMemo(() => {
    const rows = toSafeList(historyResponse?.payload).map(toNormalizedTransaction);
    return rows.filter((row) => {
      const matchesSearch =
        !searchValue ||
        [row.transactionId, row.userLabel, row.courseLabel]
          .join(" ")
          .toLowerCase()
          .includes(searchValue.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [historyResponse?.payload, searchValue, statusFilter]);

  const topTrends = useMemo(
    () => [...chartData].sort((a, b) => b.gross - a.gross).slice(0, 3),
    [chartData]
  );

  const detailPayload = detailResponse?.payload?.data ?? detailResponse?.payload;

  const summaryCards = [
    {
      title: "Tổng doanh thu",
      value: formatCurrency(Number(overview?.grossRevenue || 0)),
      icon: Coins,
      tone: "from-sky-400/15 to-slate-400/5",
    },
    {
      title: dashboardRole === "ADMIN" ? "Doanh thu hệ thống" : "Thu nhập giảng viên",
      value: formatCurrency(
        Number(dashboardRole === "ADMIN" ? overview?.adminRevenue || 0 : overview?.instructorRevenue || 0)
      ),
      icon: Wallet,
      tone: "from-emerald-400/15 to-slate-400/5",
    },
    {
      title: "Số đơn thành công",
      value: String(overview?.totalOrders || 0),
      icon: TrendingUp,
      tone: "from-amber-400/15 to-slate-400/5",
    },
    {
      title: "Số item đã bán",
      value: String(overview?.totalItems || 0),
      icon: Activity,
      tone: "from-indigo-400/15 to-slate-400/5",
    },
  ];

  const handleResetDateFilter = () => {
    setFromDate(initialFromDate);
    setToDate(initialToDate);
    if (dashboardRole === "ADMIN") {
      setAdminInstructorId("");
    }
  };

  const handleRefresh = async () => {
    try {
      await Promise.all([refetch(), refetchHistory()]);
    } catch (err: any) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err?.message || "Không thể tải dashboard doanh thu",
        variant: "destructive",
      });
    }
  };

  if (!isAuth || !dashboardRole) {
    return (
      <main className="space-y-6 p-4 sm:px-6 sm:py-4 md:p-8">
        <Card className="shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Đang chờ xác thực người dùng. Dashboard doanh thu sẽ tải sau khi role được xác định.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#edf2ff_100%)] p-4 text-slate-800 sm:px-6 sm:py-4 md:p-8 dark:bg-[radial-gradient(circle_at_top_left,_rgba(29,78,216,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(30,41,59,0.7),_transparent_46%),linear-gradient(180deg,#020617_0%,#0b1120_100%)] dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/80 text-slate-900 shadow-xl backdrop-blur dark:border-slate-700/50 dark:bg-slate-950/65 dark:text-white dark:shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_30%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.18),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-3">
            <Badge className="w-fit border-blue-200 bg-blue-50/80 text-blue-700 dark:border-white/15 dark:bg-white/10 dark:text-white">Revenue Control</Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Revenue Analytics</h1>
            <p className="text-sm text-slate-600 md:text-base dark:text-white/75">
              {dashboardRole === "ADMIN"
                ? "Admin overview với giám sát real-time doanh thu, đơn hàng và phân bổ hệ thống."
                : "Theo dõi doanh thu khóa học của bạn theo ngày và tỉ lệ chia lợi nhuận."}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3 text-sm">
            <div className="rounded-2xl border border-blue-200/70 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/10">
              <div className="text-slate-500 dark:text-white/60">Vai trò</div>
              <div className="font-semibold">{dashboardRole}</div>
            </div>
            {dashboardRole === "INSTRUCTOR" && currentUserId && (
              <div className="rounded-2xl border border-blue-200/70 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-white/10">
                <div className="text-slate-500 dark:text-white/60">Instructor ID</div>
                <div className="break-all font-semibold">{currentUserId}</div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Card className="border-blue-100 bg-white/85 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CalendarDays className="h-4 w-4" /> Bộ lọc doanh thu
            </CardTitle>
            <CardDescription>Tuỳ chỉnh khoảng ngày, instructor và làm mới dữ liệu.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {dashboardRole === "ADMIN" && (
              <Input
                placeholder="Instructor ID"
                value={adminInstructorId}
                onChange={(event) => setAdminInstructorId(event.target.value)}
                className="border-blue-200 bg-white text-slate-800 lg:w-[260px] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              />
            )}
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="border-blue-200 bg-white text-slate-800 dark:[color-scheme:dark] lg:w-[180px] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="border-blue-200 bg-white text-slate-800 dark:[color-scheme:dark] lg:w-[180px] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            />
            <Button
              variant="outline"
              onClick={handleResetDateFilter}
              className="border-blue-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Reset
            </Button>
            <Button onClick={handleRefresh} className="gap-2 bg-blue-600 text-white hover:bg-blue-500">
              <RefreshCw className={`h-4 w-4 ${isFetching || isHistoryFetching ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`border-blue-100 bg-gradient-to-br ${card.tone} from-white/95 shadow-sm dark:border-slate-700/50 dark:from-slate-900/75`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{card.title}</CardTitle>
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-blue-100 bg-white/85 xl:col-span-3 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="h-4 w-4" /> Doanh thu theo ngày
            </CardTitle>
            <CardDescription>Gross / instructor / admin revenue từ analytics-service.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueLineChart revenueByDate={chartData} />
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/85 xl:col-span-2 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-4 w-4" /> Phân bổ doanh thu
            </CardTitle>
            <CardDescription>
              {dashboardRole === "ADMIN"
                ? "Tỉ lệ đang hiển thị từ analytics projection."
                : "Đây là doanh thu ước tính theo policy chia lợi nhuận."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueSplitChart
              dashboardRole={dashboardRole}
              grossRevenue={Number(overview?.grossRevenue || 0)}
              instructorRevenue={Number(overview?.instructorRevenue || 0)}
              adminRevenue={Number(overview?.adminRevenue || 0)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-blue-100 bg-white/85 xl:col-span-3 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Recent Transactions</CardTitle>
            <CardDescription>Danh sách giao dịch gần nhất, bấm vào mỗi dòng để xem chi tiết.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search transaction, user, course..."
                  className="border-blue-200 bg-white pl-9 text-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              >
                <option value="ALL">All statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="SUCCESS">Success</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-xl border border-blue-100 dark:border-slate-800">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/90 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Split</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 bg-white/70 text-slate-700 dark:divide-slate-800 dark:bg-slate-950/35 dark:text-slate-200">
                  {isHistoryLoading &&
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={`loading-${idx}`}>
                        <td colSpan={7} className="px-4 py-3">
                          <Skeleton className="h-6 w-full bg-slate-200 dark:bg-slate-800" />
                        </td>
                      </tr>
                    ))}

                  {!isHistoryLoading && transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                        Silence in the logs. Chưa có giao dịch cho bộ lọc hiện tại.
                      </td>
                    </tr>
                  )}

                  {!isHistoryLoading &&
                    transactions.map((row) => (
                      <tr key={row.id || row.transactionId} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                        <td className="px-4 py-3 font-medium">#{row.transactionId.slice(0, 12)}</td>
                        <td className="px-4 py-3">{row.userLabel}</td>
                        <td className="px-4 py-3">{row.courseLabel}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(row.gross)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-amber-600 dark:text-amber-300">{formatCurrency(row.admin)}</span>
                          <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
                          <span className="text-emerald-600 dark:text-emerald-300">{formatCurrency(row.instructor)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${
                              statusTone[row.status] || "bg-slate-700/50 text-slate-200 border-slate-500/50"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1 text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                            onClick={() => setSelectedTransactionId(row.id)}
                          >
                            View
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">Page {transactionPage + 1}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  disabled={transactionPage === 0}
                  onClick={() => setTransactionPage((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setTransactionPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100 bg-white/85 xl:col-span-2 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Top Performers</CardTitle>
            <CardDescription>Top ngày có gross revenue cao nhất trong khoảng lọc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTrends.length === 0 && (
              <div className="rounded-xl border border-blue-100 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                Chưa có dữ liệu doanh thu.
              </div>
            )}

            {topTrends.map((row, index) => (
              <div key={row.date} className="rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/45">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">#{index + 1} - {row.date}</p>
                  <Badge className="border-blue-400/30 bg-blue-500/20 text-blue-200">{row.orders} orders</Badge>
                </div>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.gross)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 bg-white/85 shadow-sm dark:border-slate-700/50 dark:bg-slate-950/70">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Daily Projection</CardTitle>
          <CardDescription>Bảng projection theo ngày từ analytics-service.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-blue-100 dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="border-b border-blue-100 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
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
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu trong khoảng thời gian này."}
                    </td>
                  </tr>
                ) : (
                  chartData.map((row) => (
                    <tr key={row.date} className="border-b border-blue-100 text-slate-700 dark:border-slate-800 dark:text-slate-200 last:border-0">
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.gross)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.instructor)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.admin)}</td>
                      <td className="px-4 py-3 text-right">{row.orders}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Không tải được dashboard doanh thu. Vui lòng thử lại sau.
          </CardContent>
        </Card>
      )}

      {historyError && (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-200">
            Không tải được danh sách giao dịch. Kiểm tra endpoint /payments/history và quyền truy cập.
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selectedTransactionId} onOpenChange={(open) => !open && setSelectedTransactionId("") }>
        <SheetContent
          side="right"
          className="w-full border-blue-100 bg-white p-0 text-slate-800 sm:max-w-2xl dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <div className="h-full overflow-y-auto p-6">
            <SheetHeader className="mb-6 space-y-1">
              <SheetDescription className="uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Transaction Detail</SheetDescription>
              <SheetTitle className="text-3xl text-slate-900 dark:text-slate-100">
                {selectedTransactionId ? `TXN-${selectedTransactionId.slice(0, 10)}` : "N/A"}
              </SheetTitle>
            </SheetHeader>

            {isDetailLoading && (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-44 w-full bg-slate-200 dark:bg-slate-800" />
              </div>
            )}

            {!isDetailLoading && detailError && (
              <Card className="border-rose-500/40 bg-rose-500/10">
                <CardContent className="p-4 text-sm text-rose-200">
                  Không tải được chi tiết giao dịch. Endpoint /payments/{`{paymentId}`} có thể chưa sẵn sàng.
                </CardContent>
              </Card>
            )}

            {!isDetailLoading && !detailError && (
              <div className="space-y-4">
                <Card className="border-blue-100 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Event Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Created</p>
                      <p className="mt-1 text-sm">{formatDateTime(String(detailPayload?.createdAt || detailPayload?.created || ""))}</p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Payment Method</p>
                      <p className="mt-1 text-sm">{String(detailPayload?.paymentMethod || detailPayload?.method || "N/A")}</p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Status</p>
                      <p className="mt-1 text-sm">{String(detailPayload?.status || "N/A")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Total Amount</p>
                      <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(Number(detailPayload?.amount || detailPayload?.grossAmount || 0))}
                      </p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-950/70">
                      <p className="text-xs uppercase text-slate-500 dark:text-slate-400">Transaction ID</p>
                      <p className="mt-1 break-all text-sm text-slate-900 dark:text-slate-100">
                        {String(detailPayload?.transactionId || detailPayload?.id || "N/A")}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-100 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-slate-100">Raw Payload</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[320px] overflow-auto rounded-lg border border-blue-100 bg-white p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-300">
                      {JSON.stringify(detailPayload ?? {}, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-blue-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => navigator.clipboard.writeText(String(detailPayload?.transactionId || detailPayload?.id || ""))}
                  >
                    <CreditCard className="mr-1 h-4 w-4" /> Copy Transaction ID
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    onClick={() => window.open("/manage/revenue", "_blank")}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" /> Open Revenue Page
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
