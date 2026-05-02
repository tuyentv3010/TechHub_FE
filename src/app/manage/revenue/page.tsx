"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Coins,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  Flame,
  FileJson2,
  type LucideIcon,
  RefreshCw,
  Search,
  ShieldCheck,
  Package,
  TrendingUp,
  UserRound,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { useAppContext } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import paymentApiRequest, { PaymentPageResponse, PaymentTransactionItem } from "@/apiRequests/payment";
import { RevenuePolicyScope } from "@/apiRequests/revenue";
import { useActiveRevenuePolicy, useCreateRevenuePolicy, useRevenueDashboard, useRevenuePolicies } from "@/queries/useRevenue";
import { decodeToken, formatCurrency, getAccessTokenFromLocalStorage } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

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
  currency: string;
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

const toHistoryPageData = (payload: any): PaymentPageResponse<PaymentTransactionItem> | null => {
  const data = payload?.data ?? payload;
  if (data && Array.isArray(data.content)) return data;
  return null;
};

const toNormalizedTransaction = (
  item: PaymentTransactionItem,
  labels: { notAvailable: string; unknownUser: string; unknownCourse: string }
): NormalizedTransaction => {
  const id = String(item.id || item.paymentId || item.transactionId || "");
  const transactionId = String(item.transactionId || item.id || labels.notAvailable);
  const gross = Number(item.grossAmount ?? item.amount ?? 0);
  const instructor = Number(item.instructorAmount ?? 0);
  const admin = Number(item.adminAmount ?? 0);
  const userLabel =
    String(item.userName || item.userEmail || item.userId || labels.unknownUser).trim() || labels.unknownUser;
  const courseLabel =
    String(item.courseName || item.courseId || labels.unknownCourse).trim() || labels.unknownCourse;
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
    method: String(item.paymentMethod || labels.notAvailable),
    status,
    currency: String((item as any).currency || "VND").toUpperCase(),
    createdAt,
  };
};

const formatDateTime = (value: string, locale: string, emptyLabel: string) => {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

export default function RevenueDashboardPage() {
  const { isAuth, role } = useAppContext();
  const { toast } = useToast();
  const locale = useLocale();
  const t = useTranslations("ManageRevenue");
  const paginationT = useTranslations("Pagination");
  const notAvailable = t("NotAvailable");
  const formatTransactionStatusLabel = (status?: string | null) => {
    switch (String(status || "").toUpperCase()) {
      case "COMPLETED":
        return t("StatusCompleted");
      case "SUCCESS":
        return t("StatusSuccess");
      case "PENDING":
        return t("StatusPending");
      case "PROCESSING":
        return t("StatusProcessing");
      case "FAILED":
        return t("StatusFailed");
      case "CANCELLED":
        return t("StatusCancelled");
      default:
        return status || notAvailable;
    }
  };
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
  const [transactionPageSize, setTransactionPageSize] = useState(10);
  const [selectedTransactionId, setSelectedTransactionId] = useState("");
  // Tỉ giá tham khảo VND → USD (1 USD ≈ 25.000 VND).
  const VND_PER_USD = 25000;
  const toUsd = (vnd: number) =>
    vnd > 0 ? `≈ $${(vnd / VND_PER_USD).toFixed(2)} USD` : "";
  // Format số tiền theo currency của course/giao dịch (USD/VND).
  const fmtMoney = (value: number, currency?: string) => {
    const code = (currency || "VND").toUpperCase();
    if (code === "USD") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
    }
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
  };
  // Quy đổi sang đối ứng (USD ↔ VND) để hiển thị 2 đơn vị.
  const altMoney = (value: number, currency?: string) => {
    const code = (currency || "VND").toUpperCase();
    if (!value) return "";
    if (code === "USD") {
      const vnd = value * VND_PER_USD;
      return `≈ ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(vnd)}`;
    }
    return toUsd(value);
  };
  const [policyScopeFilter, setPolicyScopeFilter] = useState<RevenuePolicyScope>("GLOBAL");
  const [newPolicyScope, setNewPolicyScope] = useState<RevenuePolicyScope>("GLOBAL");
  const [newPolicyInstructorId, setNewPolicyInstructorId] = useState("");
  const [newPolicyCourseId, setNewPolicyCourseId] = useState("");
  const [newPolicyInstructorRate, setNewPolicyInstructorRate] = useState("0.7");
  const [newPolicyEffectiveFrom, setNewPolicyEffectiveFrom] = useState("");
  const [newPolicyEffectiveTo, setNewPolicyEffectiveTo] = useState("");

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
    data: activePolicy,
    isFetching: isActivePolicyFetching,
    refetch: refetchActivePolicy,
  } = useActiveRevenuePolicy(dashboardRole, {
    instructorId: dashboardRole === "ADMIN" ? adminInstructorId || undefined : undefined,
  });
  const {
    data: policyRows = [],
    isFetching: isPolicyListFetching,
    refetch: refetchPolicyList,
  } = useRevenuePolicies(dashboardRole, policyScopeFilter);
  const createPolicyMutation = useCreateRevenuePolicy();

  const {
    data: historyResponse,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ["revenue-transactions", transactionPage, transactionPageSize],
    queryFn: () => paymentApiRequest.getPaymentHistory({ page: transactionPage, size: transactionPageSize }),
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

  type SummaryCard = {
    title: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    tone: string;
  };

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

  const transactions = useMemo<NormalizedTransaction[]>(() => {
    const pageData = toHistoryPageData(historyResponse?.payload);
    const rawRows: PaymentTransactionItem[] = pageData?.content ?? toSafeList(historyResponse?.payload);
    const rows: NormalizedTransaction[] = rawRows.map((item) =>
      toNormalizedTransaction(item, {
        notAvailable,
        unknownUser: t("UnknownUser"),
        unknownCourse: t("UnknownCourse"),
      })
    );
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
  }, [historyResponse?.payload, notAvailable, searchValue, statusFilter, t]);

  const historyPageData = useMemo(() => toHistoryPageData(historyResponse?.payload), [historyResponse?.payload]);
  const totalPages = historyPageData?.totalPages ?? 1;
  const totalElements = historyPageData?.totalElements ?? transactions.length;
  const isLastPage = historyPageData?.last ?? transactions.length < transactionPageSize;

  const topTrends = useMemo(
    () => [...chartData].sort((a, b) => b.gross - a.gross).slice(0, 3),
    [chartData]
  );

  const detailPayload = detailResponse?.payload?.data ?? detailResponse?.payload;
  const detailAmount = Number(detailPayload?.amount ?? detailPayload?.grossAmount ?? 0);
  const detailCurrency = String(detailPayload?.currency || "VND").toUpperCase();
  const [buyerInfo, setBuyerInfo] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    const uid = String(detailPayload?.userId || "").trim();
    if (!uid) {
      setBuyerInfo({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Dùng accountApi.getById đã có sẵn auth header.
        const accountApi = (await import("@/apiRequests/account")).default;
        const res: any = await accountApi.getAccountById(uid);
        const data = res?.payload?.data ?? res?.payload ?? res;
        if (cancelled) return;
        setBuyerInfo({
          name: String(data?.username || data?.fullName || data?.profile?.fullName || data?.name || "").trim() || undefined,
          email: String(data?.email || "").trim() || undefined,
        });
      } catch (_) {
        if (!cancelled) setBuyerInfo({});
      }
    })();
    return () => { cancelled = true; };
  }, [detailPayload?.userId]);
  const detailStatus = String(detailPayload?.status || notAvailable).toUpperCase();
  const detailMethod = String(detailPayload?.paymentMethod || detailPayload?.method || notAvailable);
  const detailCreatedAt = String(detailPayload?.createdAt || detailPayload?.created || "");
  const detailUpdatedAt = String(detailPayload?.updatedAt || detailPayload?.updated || "");
  const detailTransactionId = String(detailPayload?.transactionId || detailPayload?.id || notAvailable);
  const detailUserId = String(detailPayload?.userId || notAvailable);
  const detailUserLabel = String(detailPayload?.userName || detailPayload?.userEmail || detailUserId || notAvailable);
  const detailCourseLabel = String(detailPayload?.courseName || detailPayload?.courseId || "");
  const detailInstructorAmount = Number(
    detailPayload?.instructorAmount ?? (activePolicy ? detailAmount * Number(activePolicy.instructorRate || 0) : 0)
  );
  const detailAdminAmount = Number(
    detailPayload?.adminAmount ?? (activePolicy ? detailAmount * Number(activePolicy.adminRate || 0) : 0)
  );
  const detailSplitSource =
    detailPayload?.instructorAmount != null || detailPayload?.adminAmount != null
      ? t("SplitSourceFromDetail")
      : activePolicy
        ? t("SplitSourceEstimated")
        : t("SplitSourceUnavailable");
  const detailItems = useMemo(
    () => [
      {
        title: detailCourseLabel || t("PaymentRecord"),
        price: detailAmount,
        icon: Package,
      },
    ],
    [detailAmount, detailCourseLabel, t]
  );

  const summaryCards: SummaryCard[] = [
    {
      title: "Tổng doanh thu",
      value: formatCurrency(Number(overview?.grossRevenue || 0)),
      sub: toUsd(Number(overview?.grossRevenue || 0)),
      icon: Coins,
      tone: "from-[#adc6ff]/15 to-transparent",
    },
    {
      title: dashboardRole === "ADMIN" ? "System Share" : "Thu nhập giảng viên",
      value: formatCurrency(
        Number(dashboardRole === "ADMIN" ? overview?.adminRevenue || 0 : overview?.instructorRevenue || 0)
      ),
      sub: toUsd(Number(dashboardRole === "ADMIN" ? overview?.adminRevenue || 0 : overview?.instructorRevenue || 0)),
      icon: dashboardRole === "ADMIN" ? Wallet : Coins,
      tone: "from-[#ffb95f]/15 to-transparent",
    },
    {
      title: "Số đơn thành công",
      value: String(overview?.totalOrders || 0),
      icon: TrendingUp,
      tone: "from-[#4edea3]/15 to-transparent",
    },
    {
      title: "Số item đã bán",
      value: String(overview?.totalItems || 0),
      icon: Activity,
      tone: "from-white/10 to-transparent",
    },
  ];

  const localizedSummaryCards: SummaryCard[] = [
    {
      title: t("SummaryGrossRevenue"),
      value: formatCurrency(Number(overview?.grossRevenue || 0)),
      sub: toUsd(Number(overview?.grossRevenue || 0)),
      icon: Coins,
      tone: "from-[#adc6ff]/15 to-transparent",
    },
    {
      title: dashboardRole === "ADMIN" ? t("SummarySystemShare") : t("SummaryInstructorRevenue"),
      value: formatCurrency(
        Number(dashboardRole === "ADMIN" ? overview?.adminRevenue || 0 : overview?.instructorRevenue || 0)
      ),
      sub: toUsd(Number(dashboardRole === "ADMIN" ? overview?.adminRevenue || 0 : overview?.instructorRevenue || 0)),
      icon: dashboardRole === "ADMIN" ? Wallet : Coins,
      tone: "from-[#ffb95f]/15 to-transparent",
    },
    {
      title: t("SummarySuccessfulOrders"),
      value: String(overview?.totalOrders || 0),
      icon: TrendingUp,
      tone: "from-[#4edea3]/15 to-transparent",
    },
    {
      title: t("SummaryItemsSold"),
      value: String(overview?.totalItems || 0),
      icon: Activity,
      tone: "from-white/10 to-transparent",
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
      await Promise.all([refetch(), refetchHistory(), refetchActivePolicy(), refetchPolicyList()]);
    } catch (err: any) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err?.message || "Không thể tải dashboard doanh thu",
        variant: "destructive",
      });
    }
  };

  const handleCreatePolicy = async () => {
    const parsedRate = Number(newPolicyInstructorRate);
    if (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 1) {
      toast({
        title: "Tỉ lệ không hợp lệ",
        description: "instructorRate phải nằm trong khoảng 0 đến 1",
        variant: "destructive",
      });
      return;
    }

    if (newPolicyScope === "INSTRUCTOR" && !newPolicyInstructorId.trim()) {
      toast({
        title: "Thiếu instructorId",
        description: "Policy scope INSTRUCTOR yêu cầu instructorId",
        variant: "destructive",
      });
      return;
    }

    if (newPolicyScope === "COURSE" && !newPolicyCourseId.trim()) {
      toast({
        title: "Thiếu courseId",
        description: "Policy scope COURSE yêu cầu courseId",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPolicyMutation.mutateAsync({
        scope: newPolicyScope,
        instructorId: newPolicyScope === "INSTRUCTOR" ? newPolicyInstructorId.trim() : undefined,
        courseId: newPolicyScope === "COURSE" ? newPolicyCourseId.trim() : undefined,
        instructorRate: parsedRate,
        effectiveFrom: newPolicyEffectiveFrom
          ? new Date(newPolicyEffectiveFrom).toISOString()
          : undefined,
        effectiveTo: newPolicyEffectiveTo ? new Date(newPolicyEffectiveTo).toISOString() : undefined,
      });

      toast({
        title: "Tạo policy thành công",
        description: "Revenue split policy mới đã được áp dụng theo thời gian hiệu lực.",
      });
      await Promise.all([refetchActivePolicy(), refetchPolicyList(), refetch()]);
      setNewPolicyInstructorId("");
      setNewPolicyCourseId("");
      setNewPolicyEffectiveTo("");
    } catch (err: any) {
      toast({
        title: "Không tạo được policy",
        description: err?.message || "Vui lòng kiểm tra dữ liệu nhập và thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshAction = async () => {
    try {
      await Promise.all([refetch(), refetchHistory(), refetchActivePolicy(), refetchPolicyList()]);
    } catch (err: any) {
      toast({
        title: t("RefreshErrorTitle"),
        description: err?.message || t("RefreshErrorDescription"),
        variant: "destructive",
      });
    }
  };

  const handleCreatePolicyAction = async () => {
    const parsedRate = Number(newPolicyInstructorRate);
    if (Number.isNaN(parsedRate) || parsedRate < 0 || parsedRate > 1) {
      toast({
        title: t("InvalidRateTitle"),
        description: t("InvalidRateDescription"),
        variant: "destructive",
      });
      return;
    }

    if (newPolicyScope === "INSTRUCTOR" && !newPolicyInstructorId.trim()) {
      toast({
        title: t("MissingInstructorTitle"),
        description: t("MissingInstructorDescription"),
        variant: "destructive",
      });
      return;
    }

    if (newPolicyScope === "COURSE" && !newPolicyCourseId.trim()) {
      toast({
        title: t("MissingCourseTitle"),
        description: t("MissingCourseDescription"),
        variant: "destructive",
      });
      return;
    }

    try {
      await createPolicyMutation.mutateAsync({
        scope: newPolicyScope,
        instructorId: newPolicyScope === "INSTRUCTOR" ? newPolicyInstructorId.trim() : undefined,
        courseId: newPolicyScope === "COURSE" ? newPolicyCourseId.trim() : undefined,
        instructorRate: parsedRate,
        effectiveFrom: newPolicyEffectiveFrom ? new Date(newPolicyEffectiveFrom).toISOString() : undefined,
        effectiveTo: newPolicyEffectiveTo ? new Date(newPolicyEffectiveTo).toISOString() : undefined,
      });

      toast({
        title: t("CreatePolicySuccessTitle"),
        description: t("CreatePolicySuccessDescription"),
      });
      await Promise.all([refetchActivePolicy(), refetchPolicyList(), refetch()]);
      setNewPolicyInstructorId("");
      setNewPolicyCourseId("");
      setNewPolicyEffectiveTo("");
    } catch (err: any) {
      toast({
        title: t("CreatePolicyErrorTitle"),
        description: err?.message || t("CreatePolicyErrorDescription"),
        variant: "destructive",
      });
    }
  };

  if (!isAuth || !dashboardRole) {
    return (
      <main className="manage-page manage-finance-root space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Đang chờ xác thực người dùng. Dashboard doanh thu sẽ tải sau khi role được xác định.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="manage-page manage-finance-root space-y-6">
      <section className="manage-finance-surface relative overflow-hidden text-slate-900 dark:text-white">
        <div className="relative flex flex-col gap-6 p-5 sm:p-6 md:p-8">
          <div className="max-w-3xl space-y-3">
            <div className="manage-page-eyebrow w-fit rounded-full border border-border/60 bg-background/80 px-3 py-1 shadow-sm">{t("PageEyebrow")}</div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {t("Title")}
            </h1>
            <p className="manage-finance-muted max-w-2xl text-sm md:text-base">
              {dashboardRole === "ADMIN"
                ? t("DescriptionAdmin")
                : t("DescriptionInstructor")}
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3 text-sm">
            <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur">
              <div className="text-muted-foreground">{t("RoleLabel")}</div>
              <div className="font-semibold">{dashboardRole}</div>
            </div>
            {dashboardRole === "INSTRUCTOR" && currentUserId && (
              <div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur">
                <div className="text-muted-foreground">{t("InstructorIdLabel")}</div>
                <div className="break-all font-semibold">{currentUserId}</div>
              </div>
            )}
          </div>
        </div>
      	</section>

      <Card className="manage-finance-surface shadow-sm">
        <CardHeader className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <CalendarDays className="h-4 w-4" /> {t("FilterTitle")}
            </CardTitle>
            <CardDescription>{t("FilterDescription")}</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
            {dashboardRole === "ADMIN" && (
              <Input
                placeholder={t("InstructorIdPlaceholder")}
                value={adminInstructorId}
                onChange={(event) => setAdminInstructorId(event.target.value)}
                className="manage-finance-input lg:w-[260px]"
              />
            )}
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="manage-finance-input dark:[color-scheme:dark] lg:w-[180px]"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="manage-finance-input dark:[color-scheme:dark] lg:w-[180px]"
            />
            <Button
              variant="outline"
              onClick={handleResetDateFilter}
              className="manage-finance-secondary"
            >
              {t("Reset")}
            </Button>
            <Button onClick={handleRefreshAction} className="manage-finance-primary gap-2">
              <RefreshCw className={`h-4 w-4 ${isFetching || isHistoryFetching ? "animate-spin" : ""}`} />
              {t("RefreshData")}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {localizedSummaryCards.map((card) => {
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
                {card.sub && (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.sub}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {dashboardRole === "ADMIN" && (
        <section className="grid gap-6 xl:grid-cols-5">
          <Card className="manage-finance-surface xl:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Flame className="h-4 w-4" /> {t("ActivePolicyTitle")}
              </CardTitle>
              <CardDescription>{t("ActivePolicyDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-slate-500 dark:text-slate-400">{t("ScopeLabel")}</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{String(activePolicy?.scope || notAvailable)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="text-slate-500 dark:text-slate-400">{t("InstructorRateLabel")}</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-300">{Number(activePolicy?.instructorRate || 0).toFixed(4)}</div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="text-slate-500 dark:text-slate-400">{t("AdminRateLabel")}</div>
                  <div className="font-semibold text-amber-600 dark:text-amber-300">{Number(activePolicy?.adminRate || 0).toFixed(4)}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {t("VersionLabel")}: {activePolicy?.version ?? notAvailable}
                {isActivePolicyFetching ? ` • ${t("Updating")}` : ""}
              </div>
            </CardContent>
          </Card>

          <Card className="manage-finance-surface xl:col-span-3 shadow-sm">
            <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">{t("CreatePolicyTitle")}</CardTitle>
              <CardDescription>{t("CreatePolicyDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t("ScopeField")}</label>
                  <select
                    value={newPolicyScope}
                    onChange={(event) => setNewPolicyScope(event.target.value as RevenuePolicyScope)}
                    className="manage-finance-input h-10 w-full px-3 text-sm"
                  >
                    <option value="GLOBAL">{t("ScopeGlobal")}</option>
                    <option value="INSTRUCTOR">{t("ScopeInstructor")}</option>
                    <option value="COURSE">{t("ScopeCourse")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t("InstructorRateField")}</label>
                  <Input
                    value={newPolicyInstructorRate}
                    onChange={(event) => setNewPolicyInstructorRate(event.target.value)}
                    placeholder="0.7000"
                    className="manage-finance-input"
                  />
                </div>
              </div>

              {newPolicyScope === "INSTRUCTOR" && (
                <Input
                  value={newPolicyInstructorId}
                  onChange={(event) => setNewPolicyInstructorId(event.target.value)}
                  placeholder={t("InstructorIdPlaceholder")}
                  className="manage-finance-input"
                />
              )}

              {newPolicyScope === "COURSE" && (
                <Input
                  value={newPolicyCourseId}
                  onChange={(event) => setNewPolicyCourseId(event.target.value)}
                  placeholder="Course ID (UUID)"
                  className="manage-finance-input"
                />
              )}

              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t("EffectiveFrom")}</label>
                  <Input
                    type="datetime-local"
                    value={newPolicyEffectiveFrom}
                    onChange={(event) => setNewPolicyEffectiveFrom(event.target.value)}
                    className="manage-finance-input dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">{t("EffectiveTo")}</label>
                  <Input
                    type="datetime-local"
                    value={newPolicyEffectiveTo}
                    onChange={(event) => setNewPolicyEffectiveTo(event.target.value)}
                    className="manage-finance-input dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreatePolicyAction}
                disabled={createPolicyMutation.isPending}
                className="manage-finance-primary"
              >
                {createPolicyMutation.isPending ? t("CreatingPolicy") : t("CreatePolicy")}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="manage-finance-surface xl:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="h-4 w-4" /> {t("RevenueByDayTitle")}
            </CardTitle>
            <CardDescription>{t("RevenueByDayDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueLineChart revenueByDate={chartData} />
          </CardContent>
        </Card>

        <Card className="manage-finance-surface xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <ShieldCheck className="h-4 w-4" /> {t("RevenueSplitTitle")}
            </CardTitle>
            <CardDescription>
              {dashboardRole === "ADMIN"
                ? t("RevenueSplitDescriptionAdmin")
                : t("RevenueSplitDescriptionInstructor")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueSplitChart
              dashboardRole={dashboardRole}
              grossRevenue={Number(overview?.grossRevenue || 0)}
              instructorRevenue={Number(overview?.instructorRevenue || 0)}
              adminRevenue={Number(overview?.adminRevenue || 0)}
              policyInstructorRate={activePolicy?.instructorRate != null ? Number(activePolicy.instructorRate) : null}
              policyAdminRate={activePolicy?.adminRate != null ? Number(activePolicy.adminRate) : null}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="manage-finance-surface xl:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">{t("RecentTransactionsTitle")}</CardTitle>
            <CardDescription>{t("RecentTransactionsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={t("TransactionSearchPlaceholder")}
                    className="manage-finance-input pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="manage-finance-input h-10 px-3 text-sm"
              >
                <option value="ALL">{t("AllStatuses")}</option>
                <option value="COMPLETED">{t("StatusCompleted")}</option>
                <option value="SUCCESS">{t("StatusSuccess")}</option>
                <option value="PENDING">{t("StatusPending")}</option>
                <option value="PROCESSING">{t("StatusProcessing")}</option>
                <option value="FAILED">{t("StatusFailed")}</option>
                <option value="CANCELLED">{t("StatusCancelled")}</option>
              </select>
            </div>

            <div className="space-y-3 md:hidden">
              {isHistoryLoading &&
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`loading-card-${idx}`}
                    className="rounded-2xl border border-blue-100 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <Skeleton className="h-24 w-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}

              {!isHistoryLoading && transactions.length === 0 && (
                <div className="rounded-2xl border border-blue-100 bg-white/80 p-4 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                  {t("NoTransactions")}
                </div>
              )}

              {!isHistoryLoading &&
                transactions.map((row: NormalizedTransaction) => (
                  <div
                    key={`mobile-${row.id || row.transactionId}`}
                    className="space-y-3 rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          #{row.transactionId.slice(0, 12)}
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(row.createdAt, locale, notAvailable)}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusTone[row.status] || "bg-slate-700/50 text-slate-200 border-slate-500/50"
                        }`}
                      >
                        {formatTransactionStatusLabel(row.status)}
                      </span>
                    </div>

                    <div className="grid gap-3 rounded-xl bg-slate-50/80 p-3 text-sm dark:bg-slate-950/50">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{t("UserColumn")}</span>
                        <span className="max-w-[60%] text-right font-medium text-slate-900 dark:text-slate-100">
                          {row.userLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{t("CourseColumn")}</span>
                        <span className="max-w-[60%] text-right font-medium text-slate-900 dark:text-slate-100">
                          {row.courseLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{t("GrossColumn")}</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                          {fmtMoney(row.gross, row.currency)}
                          <div className="text-[11px] font-normal text-slate-400">{altMoney(row.gross, row.currency)}</div>
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-500 dark:text-slate-400">{t("SplitColumn")}</span>
                        <span className="text-right font-medium">
                          <span className="text-amber-600 dark:text-amber-300">{fmtMoney(row.admin, row.currency)}</span>
                          <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
                          <span className="text-emerald-600 dark:text-emerald-300">{fmtMoney(row.instructor, row.currency)}</span>
                        </span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="manage-finance-secondary w-full justify-center"
                      onClick={() => setSelectedTransactionId(row.id)}
                    >
                      {t("View")}
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>

            <div className="manage-finance-table hidden md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-900/90 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t("IdColumn")}</th>
                    <th className="px-4 py-3">{t("UserColumn")}</th>
                    <th className="px-4 py-3">{t("CourseColumn")}</th>
                    <th className="px-4 py-3 text-right">{t("GrossColumn")}</th>
                    <th className="px-4 py-3 text-right">{t("SplitColumn")}</th>
                    <th className="px-4 py-3">{t("StatusColumn")}</th>
                    <th className="px-4 py-3">{t("ActionColumn")}</th>
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
                        {t("NoTransactions")}
                      </td>
                    </tr>
                  )}

                  {!isHistoryLoading &&
                    transactions.map((row: NormalizedTransaction) => (
                      <tr key={row.id || row.transactionId} className="hover:bg-slate-100 dark:hover:bg-slate-900/70">
                        <td className="px-4 py-3 font-medium">#{row.transactionId.slice(0, 12)}</td>
                        <td className="px-4 py-3">{row.userLabel}</td>
                        <td className="px-4 py-3">{row.courseLabel}</td>
                        <td className="px-4 py-3 text-right">
                          <div>{fmtMoney(row.gross, row.currency)}</div>
                          <div className="text-[11px] text-slate-400">{altMoney(row.gross, row.currency)}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div>
                            <span className="text-amber-600 dark:text-amber-300">{fmtMoney(row.admin, row.currency)}</span>
                            <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
                            <span className="text-emerald-600 dark:text-emerald-300">{fmtMoney(row.instructor, row.currency)}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {altMoney(row.admin, row.currency)}<span className="mx-1">/</span>{altMoney(row.instructor, row.currency)}
                          </div>
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
                            {t("View")}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="manage-pagination">
              <p className="manage-pagination-copy">
                {t("PageSummary", {
                  page: transactionPage + 1,
                  total: Math.max(totalPages, 1),
                  count: totalElements,
                })}
              </p>
              <div className="manage-pagination-actions">
                <Button
                  variant="outline"
                  size="sm"
                  className="manage-finance-secondary manage-pagination-button"
                  disabled={transactionPage === 0}
                  onClick={() => setTransactionPage((prev) => Math.max(0, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="manage-finance-secondary manage-pagination-button"
                  disabled={isLastPage || isHistoryFetching}
                  onClick={() => setTransactionPage((prev) => prev + 1)}
                >
                  Next
                </Button>
                <Select
                  value={String(transactionPageSize)}
                  onValueChange={(value) => {
                    setTransactionPage(0);
                    setTransactionPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="manage-filter-trigger w-[120px]">
                    <SelectValue placeholder={paginationT("RowsPerPage")} />
                  </SelectTrigger>
                  <SelectContent className="manage-popover-panel">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="manage-finance-surface xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">{t("TopPerformersTitle")}</CardTitle>
            <CardDescription>{t("TopPerformersDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTrends.length === 0 && (
              <div className="rounded-xl border border-blue-100 bg-slate-50/70 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                {t("NoTopData")}
              </div>
            )}

            {topTrends.map((row, index) => (
              <div key={row.date} className="rounded-xl border border-blue-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/45">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">#{index + 1} - {row.date}</p>
                  <Badge className="w-fit border-blue-400/30 bg-blue-500/20 text-blue-200">{t("OrdersCount", { count: row.orders })}</Badge>
                </div>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.gross)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="manage-finance-surface shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
            <CardTitle className="text-slate-900 dark:text-slate-100">{t("DailyProjectionTitle")}</CardTitle>
              <CardDescription>{t("DailyProjectionDescription")}</CardDescription>
            </div>
            {dashboardRole === "ADMIN" && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">{t("PolicyScopeLabel")}</span>
                <select
                  value={policyScopeFilter}
                  onChange={(event) => setPolicyScopeFilter(event.target.value as RevenuePolicyScope)}
                  className="manage-finance-input h-9 px-2 text-xs"
                >
                  <option value="GLOBAL">GLOBAL</option>
                  <option value="INSTRUCTOR">INSTRUCTOR</option>
                  <option value="COURSE">COURSE</option>
                </select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dashboardRole === "ADMIN" && (
            <div className="mb-3 rounded-xl border border-blue-100 bg-slate-50/70 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              {t("LoadedPolicies", { count: policyRows.length, scope: policyScopeFilter })}
              {isPolicyListFetching ? ` • ${t("Refreshing")}` : ""}
            </div>
          )}
          <div className="manage-finance-table">
            <table className="w-full text-sm">
              <thead className="border-b border-blue-100 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("DateColumn")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("GrossColumn")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("InstructorColumn")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("AdminColumn")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("OrdersColumn")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("PolicyColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {chartData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      {isLoading ? t("LoadingData") : t("NoDataInRange")}
                    </td>
                  </tr>
                ) : (
                  trends.map((row: any) => (
                    <tr key={String(row.metricDate)} className="border-b border-blue-100 text-slate-700 dark:border-slate-800 dark:text-slate-200 last:border-0">
                      <td className="px-4 py-3">{row.metricDate}</td>
                      <td className="px-4 py-3 text-right">
                        <div>{formatCurrency(Number(row.grossRevenue || 0))}</div>
                        <div className="text-[11px] text-slate-400">{toUsd(Number(row.grossRevenue || 0))}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>{formatCurrency(Number(row.instructorRevenue || 0))}</div>
                        <div className="text-[11px] text-slate-400">{toUsd(Number(row.instructorRevenue || 0))}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div>{formatCurrency(Number(row.adminRevenue || 0))}</div>
                        <div className="text-[11px] text-slate-400">{toUsd(Number(row.adminRevenue || 0))}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{Number(row.totalOrders || 0)}</td>
                      <td className="px-4 py-3 text-xs">{row.policyScope || notAvailable} {row.policyVersion ? `v${row.policyVersion}` : ""}</td>
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
            {t("DashboardLoadError")}
          </CardContent>
        </Card>
      )}

      {historyError && (
        <Card className="border-rose-500/40 bg-rose-500/10">
          <CardContent className="p-4 text-sm text-rose-200">
            {t("TransactionsLoadError")}
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selectedTransactionId} onOpenChange={(open) => !open && setSelectedTransactionId("") }>
        <SheetContent
          side="right"
          className="w-full border-l border-white/5 bg-[#1b1f2c] p-0 text-[#dfe2f3] shadow-2xl shadow-black/50 sm:max-w-2xl"
        >
          <div className="flex h-full flex-col overflow-y-auto">
            <div className="sticky top-0 z-30 border-b border-white/5 bg-[#1b1f2c]/95 px-6 py-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("TransactionDetailTitle")}</span>
                    <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                      {detailStatus}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[#dfe2f3]">
                    {selectedTransactionId ? `TXN-${selectedTransactionId.slice(0, 10)}` : notAvailable}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <button
                    type="button"
                    className="rounded-full p-2 transition-colors hover:bg-white/5"
                      title={t("CopyTransactionIdTitle")}
                    onClick={() => navigator.clipboard.writeText(detailTransactionId)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full p-2 transition-colors hover:bg-white/5"
                      title={t("CopyPayloadTitle")}
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(detailPayload ?? {}, null, 2))}
                  >
                    <FileJson2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {isDetailLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full bg-slate-700/60" />
                  <Skeleton className="h-24 w-full bg-slate-700/60" />
                  <Skeleton className="h-44 w-full bg-slate-700/60" />
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
                <div className="space-y-8">
                  <section>
                    <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Clock3 className="h-4 w-4" /> {t("EventTimelineTitle")}
                    </h3>
                    <div className="relative flex justify-between gap-4">
                      <div className="absolute left-0 top-4 h-[2px] w-full bg-[#313442]" />
                      <div className="absolute left-0 top-4 h-[2px] w-[100%] bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.45)]" />

                      {[
                        { label: t("TimelineCreated"), time: formatDateTime(detailCreatedAt, locale, notAvailable), icon: CheckCircle2 },
                        { label: t("TimelinePaid"), time: formatDateTime(detailUpdatedAt || detailCreatedAt, locale, notAvailable), icon: CircleDollarSign },
                        { label: t("TimelineCompleted"), time: detailStatus, icon: CheckCircle2 },
                      ].map((step) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={step.label} className="relative z-10 flex flex-col items-center gap-3 text-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4edea3] text-[#0f131f] ring-4 ring-[#1b1f2c]">
                              <StepIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#dfe2f3]">{step.label}</p>
                              <p className="text-[10px] text-slate-400">{step.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-4 rounded-2xl bg-[#313442] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("PaymentMethodLabel")}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-12 items-center justify-center rounded-md border border-white/5 bg-[#262a37]">
                          <span className="text-[10px] font-black italic text-slate-300">{detailMethod}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#dfe2f3]">{detailMethod}</p>
                          <p className="text-xs italic text-slate-400">{detailStatus}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 rounded-2xl bg-[#313442] p-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("TotalAmountLabel")}</p>
                      <p className="text-3xl font-extrabold tracking-tight text-[#dfe2f3]">{fmtMoney(detailAmount, detailCurrency)}</p>
                      <p className="text-xs text-slate-400">{altMoney(detailAmount, detailCurrency)}</p>
                      <p className="text-xs text-[#6ffbbe]">{t("NetAmountHint")}</p>
                      {detailCreatedAt && (
                        <p className="mt-2 text-xs text-slate-400">
                          🕒 {formatDateTime(detailCreatedAt, locale, notAvailable)}
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-[#262a37]/60 p-6">
                    <h3 className="mb-4 text-sm font-semibold text-slate-300">{t("BuyerInfoTitle")}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#313442] text-slate-200">
                        <UserRound className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-[#dfe2f3]">
                          {buyerInfo.name || buyerInfo.email || detailUserLabel}
                        </p>
                        <p className="truncate text-sm text-slate-400">
                          {buyerInfo.email && buyerInfo.name ? `${buyerInfo.email} · ` : ""}{detailUserId}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-full border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                        onClick={() => navigator.clipboard.writeText(detailUserId)}
                      >
                        {t("CopyUserId")}
                      </Button>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-slate-300">{t("PurchasedItemsTitle")}</h3>
                    <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0f131f]">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-[#262a37]">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("ItemTitleColumn")}</th>
                            <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{t("GrossPriceColumn")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {detailItems.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <tr key={item.title}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded bg-[#ffb95f]/10 text-[#ffb95f]">
                                      <ItemIcon className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-[#dfe2f3]">{item.title}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-[#dfe2f3]">
                                  <div>{fmtMoney(item.price, detailCurrency)}</div>
                                  <div className="text-[11px] text-slate-400">{altMoney(item.price, detailCurrency)}</div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-slate-300">{t("RevenueSplitBreakdownTitle")}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-xl bg-[#313442] p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-[#adc6ff]" />
                          <span className="text-sm text-[#dfe2f3]">
                            {t("InstructorEarnings", {
                              rate: Math.round(Number(activePolicy?.instructorRate ?? 0) * 100) || 0,
                            })}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#dfe2f3]">{fmtMoney(detailInstructorAmount, detailCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#313442] p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-[#4edea3]" />
                          <span className="text-sm text-[#dfe2f3]">
                            {t("PlatformFee", {
                              rate: Math.round(Number(activePolicy?.adminRate ?? 0) * 100) || 0,
                            })}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#dfe2f3]">{fmtMoney(detailAdminAmount, detailCurrency)}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-[#313442] p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-rose-400" />
                          <span className="text-sm text-[#dfe2f3]">{t("SplitSourceLabel")}</span>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{detailSplitSource}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-slate-300">{t("RawPayloadTitle")}</h3>
                    <pre className="max-h-[320px] overflow-auto rounded-2xl border border-white/5 bg-[#0a0e1a] p-4 text-xs leading-6 text-slate-300">
                      {JSON.stringify(detailPayload ?? {}, null, 2)}
                    </pre>
                  </section>

                  <div className="flex gap-4 border-t border-white/5 pt-6">
                    <Button
                      className="flex-1 rounded-full bg-gradient-to-tr from-[#adc6ff] to-[#4d8eff] py-6 font-bold text-[#001a42] shadow-lg shadow-[#adc6ff]/10 hover:opacity-95"
                      onClick={() => navigator.clipboard.writeText(detailTransactionId)}
                    >
                      <ReceiptText className="mr-2 h-4 w-4" /> {t("CopyTransactionId")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-full border-white/10 bg-[#313442] py-6 font-bold text-[#dfe2f3] hover:bg-[#3a3f4e]"
                      onClick={() => window.open("/manage/revenue", "_blank")}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> {t("OpenRevenuePage")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
