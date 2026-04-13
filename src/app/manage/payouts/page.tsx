"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Eye,
  FileText,
  Landmark,
  Layers3,
  MessageSquareText,
  PlusCircle,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import { useAppContext } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { decodeToken, formatCurrency, getAccessTokenFromLocalStorage } from "@/lib/utils";
import {
  useApprovePayoutRequest,
  useCreateManualPayoutBatch,
  useCreateMonthlyPayoutBatch,
  useCreatePayoutRequest,
  useMarkPayoutRequestPaid,
  usePayoutBalance,
  usePayoutBatches,
  usePayoutRequestDetail,
  usePayoutRequests,
  useRejectPayoutRequest,
} from "@/queries/usePayment";
import type { PayoutBatchResponse, PayoutRequestResponse } from "@/apiRequests/payment";

const statusTone: Record<string, string> = {
  REQUESTED: "border-blue-400/30 bg-blue-500/15 text-blue-200",
  PENDING: "border-blue-400/30 bg-blue-500/15 text-blue-200",
  APPROVED: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  REJECTED: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  MARKED_PAID: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  PAID: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  DRAFT: "border-slate-500/40 bg-slate-500/15 text-slate-200",
  PROCESSING: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  COMPLETED: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
};

const typeTone: Record<string, string> = {
  REQUEST: "border-blue-400/30 bg-blue-500/15 text-blue-200",
  APPROVAL: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  PAID: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  BATCH: "border-slate-500/40 bg-slate-500/15 text-slate-200",
};

type NormalizedPayoutRequest = {
  id: string;
  instructorId: string;
  batchId?: string | null;
  amount: number;
  status: string;
  note?: string | null;
  reviewNote?: string | null;
  paymentReference?: string | null;
  approvedAt?: string | null;
  markedPaidAt?: string | null;
  created?: string | null;
  updated?: string | null;
};

type NormalizedPayoutBatch = {
  id: string;
  batchName: string;
  periodKey?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status: string;
  totalRequests: number;
  totalAmount: number;
  created?: string | null;
};

type LedgerRow = {
  ref: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  timestamp: string;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd/MM/yyyy HH:mm");
};

const formatDateShort = (value?: string | null) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd/MM/yyyy");
};

const shortId = (value?: string | null) => {
  if (!value) return "N/A";
  return value.length > 10 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRequest = (item: PayoutRequestResponse): NormalizedPayoutRequest => ({
  id: String(item.id || ""),
  instructorId: String(item.instructorId || ""),
  batchId: item.batchId || null,
  amount: toNumber(item.amount),
  status: String(item.status || "REQUESTED").toUpperCase(),
  note: item.note || null,
  reviewNote: item.reviewNote || null,
  paymentReference: item.paymentReference || null,
  approvedAt: item.approvedAt || null,
  markedPaidAt: item.markedPaidAt || null,
  created: item.created || null,
  updated: item.updated || null,
});

const normalizeBatch = (item: PayoutBatchResponse): NormalizedPayoutBatch => ({
  id: String(item.id || ""),
  batchName: String(item.batchName || "Batch"),
  periodKey: item.periodKey || null,
  fromDate: item.fromDate || null,
  toDate: item.toDate || null,
  status: String(item.status || "DRAFT").toUpperCase(),
  totalRequests: toNumber(item.totalRequests),
  totalAmount: toNumber(item.totalAmount),
  created: item.created || null,
});

export default function PayoutManagementPage() {
  const { role, isAuth } = useAppContext();
  const { toast } = useToast();
  const dashboardRole: "ADMIN" | "INSTRUCTOR" | null =
    role === "ADMIN" || role === "SUPER_ADMIN" ? "ADMIN" : role === "INSTRUCTOR" ? "INSTRUCTOR" : null;

  const [currentUserId, setCurrentUserId] = useState("");
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [queueFilter, setQueueFilter] = useState<"ALL" | "PENDING">("ALL");
  const [batchSheetOpen, setBatchSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [manualBatchName, setManualBatchName] = useState("");
  const [manualBatchFromDate, setManualBatchFromDate] = useState("");
  const [manualBatchToDate, setManualBatchToDate] = useState("");

  useEffect(() => {
    const token = getAccessTokenFromLocalStorage();
    if (!token) return;

    try {
      const decoded = decodeToken(token);
      const userId = (decoded as any)?.userId || (decoded as any)?.user?.id;
      if (userId) {
        setCurrentUserId(String(userId));
        setSelectedInstructorId((current) => current || String(userId));
      }
    } catch (error) {
      console.error("Failed to decode token for payout page", error);
    }
  }, []);

  const balanceQueryInstructorId = dashboardRole === "ADMIN" ? selectedInstructorId.trim() : currentUserId;
  const balanceQueryEnabled = !!balanceQueryInstructorId;

  const { data: balance, isFetching: isBalanceFetching, refetch: refetchBalance } = usePayoutBalance(
    balanceQueryEnabled ? balanceQueryInstructorId : undefined
  );
  const { data: requests = [], isFetching: isRequestsFetching, refetch: refetchRequests } = usePayoutRequests();
  const { data: batches = [], isFetching: isBatchesFetching, refetch: refetchBatches } = usePayoutBatches();
  const { data: requestDetail, isFetching: isDetailFetching, refetch: refetchDetail } = usePayoutRequestDetail(
    selectedRequestId || undefined
  );

  const createRequestMutation = useCreatePayoutRequest();
  const approveRequestMutation = useApprovePayoutRequest();
  const rejectRequestMutation = useRejectPayoutRequest();
  const markPaidMutation = useMarkPayoutRequestPaid();
  const createMonthlyBatchMutation = useCreateMonthlyPayoutBatch();
  const createManualBatchMutation = useCreateManualPayoutBatch();

  const normalizedRequests = useMemo(
    () => (requests as PayoutRequestResponse[]).map(normalizeRequest),
    [requests]
  );
  const normalizedBatches = useMemo(
    () => (batches as PayoutBatchResponse[]).map(normalizeBatch),
    [batches]
  );

  const activeRequest = useMemo(
    () => normalizedRequests.find((request) => request.id === selectedRequestId) || null,
    [normalizedRequests, selectedRequestId]
  );
  const detail = requestDetail ? normalizeRequest(requestDetail) : activeRequest;

  const visibleRequests = useMemo(() => {
    const source =
      dashboardRole === "ADMIN"
        ? normalizedRequests
        : normalizedRequests.filter((request) => request.instructorId === currentUserId);
    if (queueFilter === "PENDING") {
      return source.filter((request) => ["REQUESTED", "PENDING"].includes(request.status));
    }
    return source;
  }, [currentUserId, dashboardRole, normalizedRequests, queueFilter]);

  const summary = useMemo(() => {
    const totalEarned = toNumber(balance?.totalEarned);
    const pendingAmount = toNumber(balance?.pendingAmount);
    const availableAmount = toNumber(balance?.availableAmount);
    const totalRequested = visibleRequests.reduce((acc, request) => acc + request.amount, 0);
    const pendingRequests = visibleRequests.filter((request) => ["REQUESTED", "PENDING"].includes(request.status)).length;
    const approvedRequests = visibleRequests.filter((request) => request.status === "APPROVED").length;
    return {
      totalEarned,
      pendingAmount,
      availableAmount,
      totalRequested,
      pendingRequests,
      approvedRequests,
    };
  }, [balance, visibleRequests]);

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    const requestRows: LedgerRow[] = normalizedRequests.flatMap((request) => {
      const rows: LedgerRow[] = [
        {
          ref: shortId(request.id),
          type: "REQUEST",
          description: request.note || `Payout request for instructor ${shortId(request.instructorId)}`,
          amount: request.amount,
          status: request.status,
          timestamp: request.created || request.updated || "",
        },
      ];

      if (request.approvedAt) {
        rows.push({
          ref: shortId(`${request.id}-approved`),
          type: "APPROVAL",
          description: request.reviewNote || "Payout approved",
          amount: request.amount,
          status: "APPROVED",
          timestamp: request.approvedAt,
        });
      }

      if (request.markedPaidAt) {
        rows.push({
          ref: shortId(`${request.id}-paid`),
          type: "PAID",
          description: request.paymentReference ? `Paid via ${request.paymentReference}` : "Marked as paid",
          amount: request.amount,
          status: "PAID",
          timestamp: request.markedPaidAt,
        });
      }

      return rows;
    });

    const batchRows: LedgerRow[] = normalizedBatches.map((batch) => ({
      ref: shortId(batch.id),
      type: "BATCH",
      description: `${batch.batchName} • ${batch.totalRequests} request(s)`,
      amount: batch.totalAmount,
      status: batch.status,
      timestamp: batch.created || batch.fromDate || "",
    }));

    return [...batchRows, ...requestRows]
      .sort((left, right) => new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime())
      .slice(0, 12);
  }, [normalizedBatches, normalizedRequests]);

  const openRequestDetail = (requestId: string) => {
    setSelectedRequestId(requestId);
    setDetailSheetOpen(true);
    setReviewNote("");
    setPaymentReference("");
  };

  const refreshAll = async () => {
    try {
      await Promise.all([refetchBalance(), refetchRequests(), refetchBatches(), refetchDetail()]);
    } catch (error: any) {
      toast({
        title: "Không thể tải payout data",
        description: error?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const handleCreateRequest = async () => {
    const amount = Number(requestAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: "Amount không hợp lệ",
        description: "Nhập số tiền lớn hơn 0.",
        variant: "destructive",
      });
      return;
    }

    if (summary.availableAmount > 0 && amount > summary.availableAmount) {
      toast({
        title: "Vượt quá số dư khả dụng",
        description: "Số tiền yêu cầu không được lớn hơn available balance.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createRequestMutation.mutateAsync({ amount, note: requestNote.trim() || undefined });
      toast({
        title: "Đã gửi yêu cầu chi trả",
        description: "Payout request mới đã được tạo.",
      });
      setRequestAmount("");
      setRequestNote("");
      await refreshAll();
    } catch (error: any) {
      toast({
        title: "Không tạo được payout request",
        description: error?.message || "Vui lòng kiểm tra dữ liệu đầu vào.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedRequestId) return;
    try {
      await approveRequestMutation.mutateAsync({
        requestId: selectedRequestId,
        payload: { note: reviewNote.trim() || undefined },
      });
      toast({ title: "Đã duyệt payout request" });
      await refreshAll();
      setDetailSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Không thể approve",
        description: error?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    try {
      await rejectRequestMutation.mutateAsync({
        requestId: selectedRequestId,
        payload: { note: reviewNote.trim() || undefined },
      });
      toast({ title: "Đã reject payout request" });
      await refreshAll();
      setDetailSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Không thể reject",
        description: error?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedRequestId || !paymentReference.trim()) {
      toast({
        title: "Thiếu payment reference",
        description: "Nhập reference để mark paid.",
        variant: "destructive",
      });
      return;
    }

    try {
      await markPaidMutation.mutateAsync({
        requestId: selectedRequestId,
        payload: {
          paymentReference: paymentReference.trim(),
          note: reviewNote.trim() || undefined,
        },
      });
      toast({ title: "Đã mark paid" });
      await refreshAll();
      setDetailSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Không thể mark paid",
        description: error?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleMonthlyBatch = async () => {
    try {
      const period = format(new Date(), "yyyy-MM");
      await createMonthlyBatchMutation.mutateAsync(period);
      toast({ title: "Đã tạo monthly batch" });
      await refetchBatches();
      setBatchSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "Không tạo được monthly batch",
        description: error?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleManualBatch = async () => {
    if (!manualBatchFromDate || !manualBatchToDate) {
      toast({
        title: "Thiếu khoảng ngày",
        description: "Chọn fromDate và toDate cho manual batch.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createManualBatchMutation.mutateAsync({
        name: manualBatchName.trim() || undefined,
        fromDate: manualBatchFromDate,
        toDate: manualBatchToDate,
      });
      toast({ title: "Đã tạo manual batch" });
      await refetchBatches();
      setBatchSheetOpen(false);
      setManualBatchName("");
      setManualBatchFromDate("");
      setManualBatchToDate("");
    } catch (error: any) {
      toast({
        title: "Không tạo được manual batch",
        description: error?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const handleCopyRequestId = async (value?: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast({ title: "Đã copy request ID" });
  };

  if (!isAuth || !dashboardRole) {
    return (
      <main className="min-h-screen bg-[#0f131f] p-4 text-[#dfe2f3] sm:px-6 sm:py-4 md:p-8">
        <Card className="border border-white/10 bg-[#1b1f2c]">
          <CardContent className="p-6 text-sm text-white/70">
            Đang chờ xác thực người dùng. Payout dashboard sẽ tải sau khi role được xác định.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(173,198,255,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(78,222,163,0.10),_transparent_35%),linear-gradient(180deg,#0f131f_0%,#0b1020_100%)] p-4 text-[#dfe2f3] sm:px-6 sm:py-4 md:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e1a]/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(173,198,255,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(78,222,163,0.08),transparent_32%)]" />
        <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#adc6ff]/20 bg-[#adc6ff]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#adc6ff]">
              <Landmark className="h-3.5 w-3.5" />
              Payout Control
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#f0f4ff] md:text-4xl">Payouts</h1>
              <p className="max-w-2xl text-sm text-white/65 md:text-base">
                Sandbox settlement, request review, and manual paid tracking in the Observatory finance style.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
              <CalendarDays className="h-4 w-4 text-[#adc6ff]" />
              {format(new Date(), "MMM d, yyyy")}
            </div>
            <Button
              onClick={() => setBatchSheetOpen(true)}
              className="rounded-full bg-gradient-to-r from-[#adc6ff] to-[#4d8eff] px-6 font-semibold text-[#0a0e1a] hover:opacity-95"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Total Earned", value: formatCurrency(summary.totalEarned), icon: CircleDollarSign, accent: "text-[#adc6ff]" },
          { title: "Pending Payout", value: formatCurrency(summary.pendingAmount), icon: WalletCards, accent: "text-[#ffddb8]" },
          { title: "Available Balance", value: formatCurrency(summary.availableAmount), icon: CheckCircle2, accent: "text-[#4edea3]" },
          { title: "Open Requests", value: String(summary.pendingRequests), icon: Layers3, accent: "text-white/70" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="relative overflow-hidden border border-white/8 bg-[#1b1f2c] shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#adc6ff]/8 blur-2xl" />
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{card.title}</CardTitle>
                <div className={`rounded-xl bg-white/5 p-2 ${card.accent}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#f0f4ff]">{card.value}</div>
                <div className="mt-2 text-[11px] text-white/45">Updated from payout-service projection</div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 rounded-[28px] border border-white/8 bg-[#1b1f2c] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.22)] md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-200">
                <WalletCards className="h-7 w-7" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#0a0e1a] bg-emerald-400 text-[#0a0e1a]">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#f0f4ff]">
                  {dashboardRole === "ADMIN" ? `Instructor ${shortId(balanceQueryInstructorId)}` : "My Payout Balance"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/60 hover:bg-white/5 hover:text-white"
                  onClick={() => handleCopyRequestId(balanceQueryInstructorId)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-white/55">
                {dashboardRole === "ADMIN"
                  ? "Chọn instructor để xem balance và duyệt payout request."
                  : "Theo dõi số dư khả dụng và tạo payout request từ dữ liệu sandbox."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[48rem]">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Lifetime Earned</div>
              <div className="mt-2 text-2xl font-bold text-[#f0f4ff]">{formatCurrency(summary.totalEarned)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Current Pending</div>
              <div className="mt-2 text-2xl font-bold text-[#ffddb8]">{formatCurrency(summary.pendingAmount)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">
                Available <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#f0f4ff]">{formatCurrency(summary.availableAmount)}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:items-center">
            {dashboardRole === "ADMIN" && (
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2">
                <Search className="h-4 w-4 text-white/45" />
                <Input
                  value={selectedInstructorId}
                  onChange={(event) => setSelectedInstructorId(event.target.value)}
                  placeholder="Instructor ID"
                  className="h-8 w-[260px] border-0 bg-transparent p-0 text-sm text-[#f0f4ff] placeholder:text-white/30 focus-visible:ring-0"
                />
              </div>
            )}

            {dashboardRole === "INSTRUCTOR" && (
              <Button
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending}
                className="rounded-full bg-white text-[#0a0e1a] hover:bg-white/90"
              >
                <Send className="mr-2 h-4 w-4" />
                {createRequestMutation.isPending ? "Sending..." : "Request Payout"}
              </Button>
            )}
          </div>
        </div>

        {dashboardRole === "INSTRUCTOR" && (
          <div className="mt-5 grid gap-3 md:grid-cols-[1.1fr_1fr_auto]">
            <Input
              value={requestAmount}
              onChange={(event) => setRequestAmount(event.target.value)}
              placeholder="Amount"
              inputMode="decimal"
              className="h-12 border-white/10 bg-white/5 text-[#f0f4ff] placeholder:text-white/30"
            />
            <Input
              value={requestNote}
              onChange={(event) => setRequestNote(event.target.value)}
              placeholder="Note for finance / admin"
              className="h-12 border-white/10 bg-white/5 text-[#f0f4ff] placeholder:text-white/30"
            />
            <Button
              onClick={handleCreateRequest}
              disabled={createRequestMutation.isPending}
              className="h-12 rounded-full bg-gradient-to-r from-[#adc6ff] to-[#4d8eff] px-6 font-semibold text-[#0a0e1a] hover:opacity-95"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4 border border-white/8 bg-[#1b1f2c] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-white/8 pb-4">
            <div>
              <CardTitle className="text-[#f0f4ff]">Batch Management</CardTitle>
              <CardDescription className="text-white/50">Monthly and manual settlement batches.</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white/60 hover:bg-white/5 hover:text-white"
              onClick={() => setBatchSheetOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {isBatchesFetching &&
              Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl bg-white/5" />
              ))}

            {!isBatchesFetching &&
              normalizedBatches.map((batch) => (
                <button
                  key={batch.id}
                  className="w-full rounded-2xl border border-white/8 bg-white/4 p-4 text-left transition hover:border-[#adc6ff]/25 hover:bg-white/6"
                  onClick={() => {
                    setBatchSheetOpen(true);
                    toast({
                      title: batch.batchName,
                      description: `${batch.status} • ${batch.totalRequests} requests`,
                    });
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#f0f4ff]">{batch.batchName}</div>
                      <div className="mt-1 text-[11px] text-white/45">ID: {shortId(batch.id)}</div>
                    </div>
                    <Badge className={`border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${statusTone[batch.status] || statusTone.DRAFT}`}>
                      {batch.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-white/60">
                    <div className="flex -space-x-2">
                      <div className="h-6 w-6 rounded-full border border-[#0a0e1a] bg-[#adc6ff]/20" />
                      <div className="h-6 w-6 rounded-full border border-[#0a0e1a] bg-[#4edea3]/20" />
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0a0e1a] bg-white/10 text-[10px] text-white/70">
                        +{Math.max(batch.totalRequests - 2, 0)}
                      </div>
                    </div>
                    <span>{batch.totalRequests} requests</span>
                    <span>•</span>
                    <span>{formatCurrency(batch.totalAmount)}</span>
                  </div>
                </button>
              ))}

            {!isBatchesFetching && normalizedBatches.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-5 text-sm text-white/45">
                Chưa có payout batch nào.
              </div>
            )}

            <Button
              variant="outline"
              className="w-full rounded-2xl border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => setBatchSheetOpen(true)}
            >
              + View All Batches
            </Button>

            <div className="rounded-2xl border border-[#ffb4ab]/20 bg-[#ffb4ab]/8 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#ffb4ab]">
                <AlertTriangle className="h-4 w-4" />
                Attention Required
              </div>
              <p className="text-sm leading-6 text-white/75">
                {summary.pendingRequests} payout request(s) are pending review. Please process manually to avoid instructor friction.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-8 border border-white/8 bg-[#1b1f2c] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col gap-4 border-b border-white/8 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-[#f0f4ff]">Payout Queue</CardTitle>
              <CardDescription className="text-white/50">Review requests, approve, reject, and mark paid.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={queueFilter === "ALL" ? "default" : "outline"}
                className={
                  queueFilter === "ALL"
                    ? "rounded-full bg-[#adc6ff] text-[#0a0e1a]"
                    : "rounded-full border-white/10 bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
                }
                onClick={() => setQueueFilter("ALL")}
              >
                All Requests
              </Button>
              <Button
                variant={queueFilter === "PENDING" ? "default" : "outline"}
                className={
                  queueFilter === "PENDING"
                    ? "rounded-full bg-[#4edea3] text-[#0a0e1a]"
                    : "rounded-full border-white/10 bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
                }
                onClick={() => setQueueFilter("PENDING")}
              >
                Pending Only
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.22em] text-white/40">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Instructor</th>
                    <th className="px-4 py-4 font-semibold">Requested</th>
                    <th className="px-4 py-4 font-semibold">Batch</th>
                    <th className="px-4 py-4 font-semibold">Date</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-white/75">
                  {isRequestsFetching &&
                    Array.from({ length: 4 }).map((_, index) => (
                      <tr key={index}>
                        <td colSpan={6} className="px-4 py-4">
                          <Skeleton className="h-7 rounded-full bg-white/5" />
                        </td>
                      </tr>
                    ))}

                  {!isRequestsFetching && visibleRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/45">
                        No payout requests for the current filter.
                      </td>
                    </tr>
                  )}

                  {!isRequestsFetching &&
                    visibleRequests.map((request) => (
                      <tr key={request.id} className="group hover:bg-white/[0.03]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-xs font-bold text-[#adc6ff]">
                              {shortId(request.instructorId).slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-[#f0f4ff]">Instructor {shortId(request.instructorId)}</div>
                              <div className="text-[11px] text-white/45">{request.note || "No note provided"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-[#f0f4ff]">{formatCurrency(request.amount)}</td>
                        <td className="px-4 py-4 text-white/50">{request.batchId ? shortId(request.batchId) : "Unassigned"}</td>
                        <td className="px-4 py-4 text-white/50">{formatDateShort(request.created || request.updated)}</td>
                        <td className="px-4 py-4">
                          <Badge className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${statusTone[request.status] || statusTone.REQUESTED}`}>
                            {request.status.replaceAll("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-90 transition group-hover:opacity-100">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-white/55 hover:bg-white/5 hover:text-white"
                              onClick={() => openRequestDetail(request.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-full text-white/55 hover:bg-white/5 hover:text-white"
                              onClick={() => handleCopyRequestId(request.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-12 border border-white/8 bg-[#1b1f2c] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col gap-3 border-b border-white/8 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#f0f4ff]">
                <FileText className="h-4 w-4 text-[#adc6ff]" />
                Transaction Ledger
              </CardTitle>
              <CardDescription className="text-white/50">Payout events from requests and batches.</CardDescription>
            </div>
            <Button
              variant="ghost"
              className="rounded-full text-white/60 hover:bg-white/5 hover:text-white"
              onClick={refreshAll}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isBalanceFetching || isRequestsFetching || isBatchesFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.22em] text-white/40">
                  <tr>
                    <th className="px-4 py-4 font-semibold">Ref</th>
                    <th className="px-4 py-4 font-semibold">Type</th>
                    <th className="px-4 py-4 font-semibold">Description</th>
                    <th className="px-4 py-4 font-semibold">Amount</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 text-right font-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-white/75">
                  {ledgerRows.map((row) => (
                    <tr key={`${row.type}-${row.ref}-${row.timestamp}`} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-4 font-mono text-xs text-white/55">{row.ref}</td>
                      <td className="px-4 py-4">
                        <Badge className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${typeTone[row.type] || typeTone.BATCH}`}>
                          {row.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-white/75">{row.description}</td>
                      <td className="px-4 py-4 font-semibold text-[#f0f4ff]">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-4 text-[11px] uppercase tracking-[0.2em] text-white/45">{row.status}</td>
                      <td className="px-4 py-4 text-right font-mono text-xs text-white/50">{formatDateTime(row.timestamp)}</td>
                    </tr>
                  ))}

                  {ledgerRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-white/45">
                        No ledger rows yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Sheet open={batchSheetOpen} onOpenChange={setBatchSheetOpen}>
        <SheetContent side="right" className="w-full border-l border-white/10 bg-[#0f131f] text-[#dfe2f3] sm:max-w-2xl">
          <SheetHeader className="space-y-3 border-b border-white/10 pb-4 text-left">
            <SheetTitle className="text-[#f0f4ff]">Batch Builder</SheetTitle>
            <SheetDescription className="text-white/55">
              Create monthly or manual payout batches in sandbox mode.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            <Card className="border border-white/8 bg-[#1b1f2c]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#f0f4ff]">Monthly Batch</CardTitle>
                <CardDescription className="text-white/50">Auto-create a batch for the current month.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-white/70">
                  Period: <span className="font-semibold text-[#f0f4ff]">{format(new Date(), "yyyy-MM")}</span>
                </div>
                <Button
                  className="w-full rounded-full bg-gradient-to-r from-[#adc6ff] to-[#4d8eff] text-[#0a0e1a] hover:opacity-95"
                  onClick={handleMonthlyBatch}
                  disabled={createMonthlyBatchMutation.isPending}
                >
                  <Layers3 className="mr-2 h-4 w-4" />
                  {createMonthlyBatchMutation.isPending ? "Creating..." : "Create Monthly Batch"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-white/8 bg-[#1b1f2c]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#f0f4ff]">Manual Batch</CardTitle>
                <CardDescription className="text-white/50">Choose a custom date range for ad-hoc settlement.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={manualBatchName}
                  onChange={(event) => setManualBatchName(event.target.value)}
                  placeholder="Batch name"
                  className="border-white/10 bg-white/5 text-[#f0f4ff] placeholder:text-white/30"
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    type="date"
                    value={manualBatchFromDate}
                    onChange={(event) => setManualBatchFromDate(event.target.value)}
                    className="border-white/10 bg-white/5 text-[#f0f4ff] dark:[color-scheme:dark]"
                  />
                  <Input
                    type="date"
                    value={manualBatchToDate}
                    onChange={(event) => setManualBatchToDate(event.target.value)}
                    className="border-white/10 bg-white/5 text-[#f0f4ff] dark:[color-scheme:dark]"
                  />
                </div>
                <Button
                  className="w-full rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={handleManualBatch}
                  disabled={createManualBatchMutation.isPending}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createManualBatchMutation.isPending ? "Creating..." : "Create Manual Batch"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) {
            setSelectedRequestId("");
            setReviewNote("");
            setPaymentReference("");
          }
        }}
      >
        <SheetContent side="right" className="w-full border-l border-white/10 bg-[#0f131f] text-[#dfe2f3] sm:max-w-xl">
          <SheetHeader className="space-y-3 border-b border-white/10 pb-4 text-left">
            <div className="flex items-center gap-2">
              <Badge className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${statusTone[detail?.status || "REQUESTED"] || statusTone.REQUESTED}`}>
                {(detail?.status || "REQUESTED").replaceAll("_", " ")}
              </Badge>
              <button
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/55 hover:bg-white/5 hover:text-white"
                onClick={() => handleCopyRequestId(detail?.id)}
              >
                {shortId(detail?.id)}
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <SheetTitle className="text-[#f0f4ff]">Payout Request Detail</SheetTitle>
            <SheetDescription className="text-white/55">
              Review request, approval note, and payout reference.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <Card className="border border-white/8 bg-[#1b1f2c]">
              <CardContent className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                    <div className="text-white/45">Created</div>
                    <div className="mt-1 font-semibold text-[#f0f4ff]">{formatDateTime(detail?.created)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                    <div className="text-white/45">Approved</div>
                    <div className="mt-1 font-semibold text-[#f0f4ff]">{formatDateTime(detail?.approvedAt)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                    <div className="text-white/45">Paid</div>
                    <div className="mt-1 font-semibold text-[#f0f4ff]">{formatDateTime(detail?.markedPaidAt)}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Method</div>
                      <div className="mt-1 flex items-center gap-2 text-[#f0f4ff]"><Landmark className="h-4 w-4 text-[#4edea3]" />Sandbox Wire</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Type</div>
                      <div className="mt-1 text-[#f0f4ff]">Manual Settlement</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 border-t border-white/8 pt-4 text-sm">
                    <div className="flex items-center justify-between text-white/60">
                      <span>Requested Amount</span>
                      <span className="font-semibold text-[#f0f4ff]">{formatCurrency(detail?.amount || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Review Note</span>
                      <span className="max-w-[70%] text-right text-white/75">{detail?.reviewNote || "No review note"}</span>
                    </div>
                    <div className="flex items-center justify-between text-white/60">
                      <span>Payment Reference</span>
                      <span className="max-w-[70%] text-right font-mono text-white/75">{detail?.paymentReference || "—"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-white/8 bg-[#1b1f2c]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-[#f0f4ff]">Request Notes</CardTitle>
                <CardDescription className="text-white/50">Review and settlement note from the payout workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4 text-sm text-white/75">
                  {detail?.note || "No request note provided."}
                </div>
                <Input
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Add review note"
                  className="border-white/10 bg-white/5 text-[#f0f4ff] placeholder:text-white/30"
                />
                <Input
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  placeholder="Payment reference for mark paid"
                  className="border-white/10 bg-white/5 text-[#f0f4ff] placeholder:text-white/30"
                />
              </CardContent>
            </Card>
          </div>

          <SheetFooter className="mt-6 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-3 sm:justify-stretch">
            <Button
              variant="outline"
              className="rounded-full border-[#ffb4ab]/30 bg-transparent text-[#ffb4ab] hover:bg-[#ffb4ab]/8"
              onClick={handleReject}
              disabled={rejectRequestMutation.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-[#adc6ff]/30 bg-transparent text-[#adc6ff] hover:bg-[#adc6ff]/8"
              onClick={handleApprove}
              disabled={approveRequestMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              className="rounded-full bg-gradient-to-r from-[#adc6ff] to-[#4d8eff] text-[#0a0e1a] hover:opacity-95"
              onClick={handleMarkPaid}
              disabled={markPaidMutation.isPending}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Mark Paid
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <section className="mt-6 grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-12 border border-white/8 bg-[#1b1f2c] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
          <CardHeader className="flex flex-col gap-3 border-b border-white/8 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-[#f0f4ff]">Overview Stats</CardTitle>
              <CardDescription className="text-white/50">Quick operational status for the current payout workflow.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <MessageSquareText className="h-4 w-4 text-[#adc6ff]" />
              {summary.approvedRequests} approved request(s)
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Requested Sum</div>
              <div className="mt-2 text-2xl font-bold text-[#f0f4ff]">{formatCurrency(summary.totalRequested)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Loaded Requests</div>
              <div className="mt-2 text-2xl font-bold text-[#f0f4ff]">{visibleRequests.length}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Batch Count</div>
              <div className="mt-2 text-2xl font-bold text-[#f0f4ff]">{normalizedBatches.length}</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/8 bg-[#1b1f2c] px-4 py-3 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-[#adc6ff]" />
          Settlement runs in sandbox mode. Mark paid is an audit action only.
        </div>
        <Button
          variant="ghost"
          className="rounded-full text-white/60 hover:bg-white/5 hover:text-white"
          onClick={refreshAll}
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${isBalanceFetching || isRequestsFetching || isBatchesFetching || isDetailFetching ? "animate-spin" : ""}`} />
          Refresh all
        </Button>
      </div>
    </main>
  );
}
