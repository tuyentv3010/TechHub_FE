"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  Award,
  Ban,
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  IdCard,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";

import instructorApplicationApi, {
  InstructorApplication,
  InstructorApplicationCertificate,
} from "@/apiRequests/instructor-application";
import instructorProfileApi, {
  InstructorProfile,
} from "@/apiRequests/instructor-profile";
import InstructorProfileView from "@/components/instructor-profile-view";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type AdminStatus = "PENDING" | "APPROVED" | "REJECTED";
type StatusFilter = AdminStatus | "ALL";

type PreviewState = {
  url: string;
  label: string;
} | null;

const STATUS_TONE: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  REJECTED: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  PROCESSED: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  FAILED: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  ALL: "StatusAll",
  PENDING: "StatusPending",
  APPROVED: "StatusApproved",
  REJECTED: "StatusRejected",
  PROCESSED: "StatusProcessed",
  FAILED: "StatusFailed",
};

function safeParse(json?: string | null): unknown {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isImage(url?: string | null) {
  return !!url && /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function getInitials(value?: string | null) {
  const source = value?.trim() || "Ứng viên";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function ManageInstructorApplicationsPage() {
  const { toast } = useToast();
  const t = useTranslations("ManageInstructorApplication");
  const locale = useLocale();

  const [items, setItems] = useState<InstructorApplication[]>([]);
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InstructorApplication | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [rescanning, setRescanning] = useState<string | null>(null);
  const [refreshingDetail, setRefreshingDetail] = useState(false);
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

  const getStatusLabel = (value?: string | null) => {
    const normalized = String(value || "").toUpperCase();
    const key = STATUS_LABEL_KEYS[normalized];
    return key ? t(key) : normalized || t("NotAvailable");
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return t("NotAvailable");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res: any = await instructorApplicationApi.listForAdmin("ALL", 0, 50);
      const data = res?.payload?.data || res?.payload;
      setItems(data?.content || []);
    } catch {
      toast({ title: t("ListLoadError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = status === "ALL" || item.adminStatus === status;
      const name = item.userName || "";
      const email = item.userEmail || "";
      const matchesQuery = !normalizedQuery || `${name} ${email}`.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [items, query, status]);

  const selectedIndex = useMemo(
    () => filteredItems.findIndex((item) => item.id === selectedId),
    [filteredItems, selectedId]
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((item) => item.adminStatus === "PENDING").length,
      approved: items.filter((item) => item.adminStatus === "APPROVED").length,
      rejected: items.filter((item) => item.adminStatus === "REJECTED").length,
      processed: items.filter((item) => item.aiStatus === "PROCESSED").length,
      failed: items.filter((item) => item.aiStatus === "FAILED").length,
    }),
    [items]
  );

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setOpen(true);
    setDetail(null);
    setNote("");
    try {
      const res: any = await instructorApplicationApi.getDetail(id);
      const data = res?.payload?.data || res?.payload;
      setDetail(data);
    } catch {
      toast({ title: t("DetailLoadError"), variant: "destructive" });
    }
  };

  const refreshDetail = async (options?: { silent?: boolean }) => {
    if (!selectedId) return;
    if (!options?.silent) setRefreshingDetail(true);
    try {
      const res: any = await instructorApplicationApi.getDetail(selectedId);
      const data = res?.payload?.data || res?.payload;
      setDetail(data);
    } catch {
      if (!options?.silent) {
        toast({ title: t("DetailLoadError"), variant: "destructive" });
      }
    } finally {
      if (!options?.silent) setRefreshingDetail(false);
    }
  };

  const openSibling = (direction: -1 | 1) => {
    const next = filteredItems[selectedIndex + direction];
    if (next) openDetail(next.id);
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    setActing(true);
    try {
      await instructorApplicationApi.approve(selectedId, note || undefined);
      toast({ title: t("ApproveSuccess") });
      setOpen(false);
      await fetchList();
    } catch (e: any) {
      toast({ title: e?.payload?.message || t("ApproveError"), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    if (!note.trim()) {
      toast({ title: t("RejectRequiresReason"), variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      await instructorApplicationApi.reject(selectedId, note);
      toast({ title: t("RejectSuccess") });
      setOpen(false);
      await fetchList();
    } catch (e: any) {
      toast({ title: e?.payload?.message || t("RejectError"), variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleRescan = async (kind: "cv" | "cccdFront" | "cccdBack" | "cert", certId?: string) => {
    if (!selectedId && kind !== "cert") return;
    const key = kind === "cert" ? `cert:${certId}` : kind;
    setRescanning(key);
    try {
      if (kind === "cv") await instructorApplicationApi.rescanCv(selectedId!);
      if (kind === "cccdFront") await instructorApplicationApi.rescanCccdFront(selectedId!);
      if (kind === "cccdBack") await instructorApplicationApi.rescanCccdBack(selectedId!);
      if (kind === "cert" && certId) await instructorApplicationApi.rescanCertificate(certId);
      toast({ title: "Đã gửi lại yêu cầu AI scan." });
      await refreshDetail();
    } catch (e: any) {
      toast({ title: e?.payload?.message || "Không thể gửi lại yêu cầu scan", variant: "destructive" });
    } finally {
      setRescanning(null);
    }
  };

  const aiData = useMemo(() => safeParse(detail?.aiExtractedData), [detail]);
  const cccdFrontData = useMemo(() => safeParse(detail?.cccdFrontData), [detail]);
  const cccdBackData = useMemo(() => safeParse(detail?.cccdBackData), [detail]);

  useEffect(() => {
    setProfile(null);
    if (detail?.adminStatus === "APPROVED" && detail.userId) {
      instructorProfileApi
        .getByUserId(detail.userId)
        .then((res: any) => {
          const data = res?.payload?.data || res?.payload;
          if (data) setProfile(data);
        })
        .catch(() => setProfile(null));
    }
  }, [detail?.adminStatus, detail?.userId]);

  const aiSummary = useMemo(() => {
    if (!detail) return { total: 0, processed: 0, pending: 0, failed: 0 };
    const statuses = [
      detail.aiStatus,
      detail.cccdFrontStatus,
      detail.cccdBackStatus,
      ...(detail.certificates || []).map((cert) => cert.aiStatus),
    ].filter(Boolean);

    return {
      total: statuses.length,
      processed: statuses.filter((value) => value === "PROCESSED").length,
      pending: statuses.filter((value) => value === "PENDING").length,
      failed: statuses.filter((value) => value === "FAILED").length,
    };
  }, [detail]);

  const hasPendingAiScan = useMemo(() => {
    if (!detail) return false;
    return [
      detail.aiStatus,
      detail.cccdFrontStatus,
      detail.cccdBackStatus,
      ...(detail.certificates || []).map((cert) => cert.aiStatus),
    ].some((value) => value === "PENDING");
  }, [detail]);

  useEffect(() => {
    if (!open || !selectedId || !hasPendingAiScan) return;

    const timer = window.setInterval(() => {
      refreshDetail({ silent: true });
    }, 5000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedId, hasPendingAiScan]);

  const StatusBadge = ({ value }: { value?: string | null }) => {
    const normalized = String(value || "").toUpperCase();
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[normalized] || "border-border bg-muted text-muted-foreground"}`}>
        {getStatusLabel(value)}
      </span>
    );
  };

  const RescanButton = ({
    kind,
    certId,
    status,
    updatedAt,
  }: {
    kind: "cv" | "cccdFront" | "cccdBack" | "cert";
    certId?: string;
    status?: string | null;
    updatedAt?: string | null;
  }) => {
    const key = kind === "cert" ? `cert:${certId}` : kind;
    const isPending = String(status || "").toUpperCase() === "PENDING";
    const pendingElapsedMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : 0;
    const pendingTimedOut = isPending && pendingElapsedMs > 72_000;
    const isBusy = rescanning === key || (isPending && !pendingTimedOut);

    return (
      <Button
        size="sm"
        variant="outline"
        disabled={isBusy}
        onClick={() => handleRescan(kind, certId)}
        className="h-8 gap-1.5"
      >
        {rescanning === key ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {rescanning === key ? "Đang gửi" : isPending && !pendingTimedOut ? "Đang scan" : "Scan lại"}
      </Button>
    );
  };

  const FilePreview = ({ url, label }: { url?: string | null; label: string }) => {
    if (!url) {
      return (
        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Chưa có file
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex h-[520px] items-center justify-center bg-muted">
          {isImage(url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-contain p-2" />
          ) : (
            <iframe
              src={url}
              title={label}
              className="h-full w-full bg-white"
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="truncate text-xs font-medium">{label}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreview({ url, label })}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              <Eye className="h-3.5 w-3.5" />
              Xem lớn
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-muted-foreground underline underline-offset-2"
            >
              Mở tab
            </a>
          </div>
        </div>
      </div>
    );
  };

  const DocumentSection = ({
    title,
    icon,
    status,
    rescanKind,
    children,
    aiData,
    aiError,
    certId,
  }: {
    title: string;
    icon: React.ReactNode;
    status?: string | null;
    rescanKind?: "cv" | "cccdFront" | "cccdBack" | "cert";
    children: React.ReactNode;
    aiData?: unknown;
    aiError?: string | null;
    certId?: string;
  }) => {
    const needsReview = status && status !== "PROCESSED";
    return (
      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              {needsReview && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  AI chưa hoàn tất hoặc cần kiểm tra thủ công
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge value={status} />
            {rescanKind && (
              <RescanButton kind={rescanKind} certId={certId} status={status} updatedAt={detail?.updated} />
            )}
          </div>
        </div>

        {children}

        {aiError && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            Lỗi AI: {aiError}
          </p>
        )}

        <AiDataPanel data={aiData} />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Admin Instructor Review
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("Title")}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("Description")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={fetchList} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Tải lại
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Tổng đơn" value={counts.total} icon={<Inbox className="h-4 w-4" />} />
          <Metric label="Chờ duyệt" value={counts.pending} icon={<Clock className="h-4 w-4" />} />
          <Metric label="AI đã xử lý" value={counts.processed} icon={<Sparkles className="h-4 w-4" />} />
          <Metric label="AI lỗi" value={counts.failed} icon={<AlertTriangle className="h-4 w-4" />} />
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <StatusTabs
              value={status}
              onChange={setStatus}
              counts={{
                ALL: counts.total,
                PENDING: counts.pending,
                APPROVED: counts.approved,
                REJECTED: counts.rejected,
              }}
              getStatusLabel={getStatusLabel}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="text-left">
                  <th className="px-4 py-3">{t("ApplicantColumn")}</th>
                  <th className="px-4 py-3">{t("EmailColumn")}</th>
                  <th className="px-4 py-3">{t("SubmittedAtColumn")}</th>
                  <th className="px-4 py-3">{t("AiColumn")}</th>
                  <th className="px-4 py-3">{t("AdminColumn")}</th>
                  <th className="px-4 py-3 text-right">{t("ActionColumn")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      {t("Loading")}
                    </td>
                  </tr>
                )}
                {!loading && filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Inbox className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p className="font-medium text-foreground">{t("NoApplications")}</p>
                      <p className="text-xs">Không có hồ sơ khớp bộ lọc hiện tại.</p>
                    </td>
                  </tr>
                )}
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer transition hover:bg-muted/50"
                    onClick={() => openDetail(item.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {getInitials(item.userName || item.userEmail)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.userName || item.userEmail || item.userId?.slice(0, 8) || t("NotAvailable")}
                          </p>
                          <p className="text-xs text-muted-foreground">ID: {item.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.userEmail || t("NotAvailable")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.created)}</td>
                    <td className="px-4 py-3"><StatusBadge value={item.aiStatus} /></td>
                    <td className="px-4 py-3"><StatusBadge value={item.adminStatus} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(item.id);
                        }}
                      >
                        {t("View")}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1120px,calc(100vw-32px))]">
          <SheetHeader className="border-b bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SheetTitle>{t("DetailTitle")}</SheetTitle>
                {detail ? (
                  <div className="mt-2">
                    <p className="font-medium">{detail.userName || detail.userEmail || detail.userId}</p>
                    {detail.userEmail && <p className="text-sm text-muted-foreground">{detail.userEmail}</p>}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!detail || refreshingDetail}
                  onClick={() => refreshDetail()}
                  className="mr-2 gap-1.5"
                >
                  {refreshingDetail ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  Làm mới
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={selectedIndex <= 0 || !detail}
                  onClick={() => openSibling(-1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-xs text-muted-foreground">
                  {selectedIndex >= 0 ? selectedIndex + 1 : 0}/{filteredItems.length}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={selectedIndex < 0 || selectedIndex >= filteredItems.length - 1 || !detail}
                  onClick={() => openSibling(1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {detail ? (
              <div className="mt-4 grid gap-2 rounded-xl border bg-muted p-3 text-xs sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>{aiSummary.processed}/{aiSummary.total} đã xử lý</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span>{aiSummary.pending} đang chờ{hasPendingAiScan ? " - tự cập nhật mỗi 5s" : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span>{aiSummary.failed} thất bại</span>
                </div>
              </div>
            ) : null}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
            {!detail ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("Loading")}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <DocumentSection
                  title="CV / Sơ yếu lý lịch"
                  icon={<FileText className="h-4 w-4" />}
                  status={detail.aiStatus}
                  rescanKind="cv"
                  aiData={aiData}
                  aiError={detail.aiError}
                >
                  <FilePreview url={detail.cvFileUrl} label="CV" />
                </DocumentSection>

                {(detail.cccdFrontFileUrl || detail.cccdBackFileUrl) && (
                  <DocumentSection
                    title="Căn cước công dân"
                    icon={<IdCard className="h-4 w-4" />}
                    status={detail.cccdFrontStatus || detail.cccdBackStatus || undefined}
                    aiData={cccdFrontData || cccdBackData ? { front: cccdFrontData, back: cccdBackData } : null}
                  >
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Mặt trước</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge value={detail.cccdFrontStatus} />
                            {detail.cccdFrontFileUrl && (
                              <RescanButton
                                kind="cccdFront"
                                status={detail.cccdFrontStatus}
                                updatedAt={detail.updated}
                              />
                            )}
                          </div>
                        </div>
                        <FilePreview url={detail.cccdFrontFileUrl} label="CCCD mặt trước" />
                        {detail.cccdFrontError && <p className="text-xs text-rose-600">{detail.cccdFrontError}</p>}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Mặt sau</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge value={detail.cccdBackStatus} />
                            {detail.cccdBackFileUrl && (
                              <RescanButton
                                kind="cccdBack"
                                status={detail.cccdBackStatus}
                                updatedAt={detail.updated}
                              />
                            )}
                          </div>
                        </div>
                        <FilePreview url={detail.cccdBackFileUrl} label="CCCD mặt sau" />
                        {detail.cccdBackError && <p className="text-xs text-rose-600">{detail.cccdBackError}</p>}
                      </div>
                    </div>
                  </DocumentSection>
                )}

                {detail.certificates?.length ? (
                  <section className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Chứng chỉ</h3>
                        <p className="text-xs text-muted-foreground">{detail.certificates.length} tài liệu</p>
                      </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-2">
                      {detail.certificates.map((cert, index) => (
                        <CertificateItem
                          key={cert.id}
                          cert={cert}
                          index={index}
                          StatusBadge={StatusBadge}
                          RescanButton={RescanButton}
                          FilePreview={FilePreview}
                          updatedAt={detail.updated}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {detail.adminStatus === "APPROVED" && profile && (
                  <section className="rounded-xl border bg-card p-4 shadow-sm">
                    <h3 className="mb-3 font-semibold">Hồ sơ giảng viên đã đồng bộ</h3>
                    <InstructorProfileView profile={profile} variant="full" />
                  </section>
                )}
              </div>
            )}
          </div>

          {detail ? (
            <div className="border-t bg-card p-4">
              {detail.adminStatus === "PENDING" ? (
                <div className="space-y-3">
                  {detail.aiStatus !== "PROCESSED" && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      AI chưa xử lý xong hoặc thất bại. Admin vẫn có thể duyệt thủ công sau khi xem file gốc.
                    </div>
                  )}
                  <Textarea
                    placeholder={t("ReviewNotePlaceholder")}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-20"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={acting}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {t("ApproveButton")}
                    </Button>
                    <Button onClick={handleReject} disabled={acting} variant="destructive" className="gap-2">
                      <Ban className="h-4 w-4" />
                      {t("Reject")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {t("AlreadyProcessed", {
                    status: getStatusLabel(detail.adminStatus),
                    note: detail.adminNote || t("NoNote"),
                  })}
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={!!preview} onOpenChange={(value) => !value && setPreview(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
          </DialogHeader>
          {preview?.url ? (
            <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted">
              {isImage(preview.url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.url} alt={preview.label} className="mx-auto max-h-[72vh] object-contain" />
              ) : (
                <iframe src={preview.url} title={preview.label} className="h-[72vh] w-full" />
              )}
            </div>
          ) : null}
          {preview?.url ? (
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-primary underline"
            >
              Mở file trong tab mới
            </a>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusTabs({
  value,
  onChange,
  counts,
  getStatusLabel,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  getStatusLabel: (value?: string | null) => string;
}) {
  const tabs: StatusFilter[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="inline-flex h-12 items-center gap-1 rounded-xl border border-border bg-muted p-1">
      {tabs.map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            {tab === "ALL" ? "Tất cả" : getStatusLabel(tab)}
            <span
              className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                active && tab === "PENDING"
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AiDataPanel({ data }: { data?: unknown }) {
  const parsed = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
  const entries = parsed ? Object.entries(parsed) : [];
  const previewEntries = entries
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .slice(0, 4);

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-orange-50 shadow-sm dark:border-sky-500/20 dark:from-sky-500/10 dark:via-slate-950 dark:to-orange-500/10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100/80 px-4 py-3 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Dữ liệu AI trích xuất</h4>
            <p className="text-xs text-muted-foreground">
              {entries.length > 0 ? `${entries.length} trường dữ liệu được nhận diện` : "Chưa có dữ liệu AI"}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-slate-900 dark:text-sky-300">
          <Braces className="h-3.5 w-3.5" />
          JSON
        </span>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-3 p-4">
          {previewEntries.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {previewEntries.map(([key, value]) => (
                <div key={key} className="rounded-lg border bg-white/80 px-3 py-2 dark:bg-slate-900/80">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{formatAiKey(key)}</p>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <details className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-200">
              <span className="inline-flex items-center gap-2">
                <Braces className="h-3.5 w-3.5 text-orange-300" />
                Xem JSON đầy đủ
              </span>
              <span className="text-slate-400 transition group-open:rotate-90">›</span>
            </summary>
            <pre className="max-h-80 overflow-auto border-t border-slate-800 p-4 text-xs leading-5 text-slate-100">
              <code dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(data, null, 2)) }} />
            </pre>
          </details>
        </div>
      ) : (
        <div className="p-4">
          <div className="rounded-lg border border-dashed bg-white/70 px-4 py-6 text-center text-sm text-muted-foreground dark:bg-slate-900/60">
            AI chưa trả dữ liệu trích xuất cho tài liệu này.
          </div>
        </div>
      )}
    </div>
  );
}

function formatAiKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function highlightJson(json: string) {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let color = "text-orange-300";
      if (/^"/.test(match)) color = /:$/.test(match) ? "text-sky-300" : "text-emerald-300";
      if (/true|false/.test(match)) color = "text-purple-300";
      if (/null/.test(match)) color = "text-slate-400";
      if (/^-?\d/.test(match)) color = "text-amber-300";
      return `<span class="${color}">${match}</span>`;
    }
  );
}

function CertificateItem({
  cert,
  index,
  StatusBadge,
  RescanButton,
  FilePreview,
  updatedAt,
}: {
  cert: InstructorApplicationCertificate;
  index: number;
  StatusBadge: (props: { value?: string | null }) => React.ReactNode;
  RescanButton: (props: {
    kind: "cv" | "cccdFront" | "cccdBack" | "cert";
    certId?: string;
    status?: string | null;
    updatedAt?: string | null;
  }) => React.ReactNode;
  FilePreview: (props: { url?: string | null; label: string }) => React.ReactNode;
  updatedAt?: string | null;
}) {
  const certData = safeParse(cert.aiData);

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Chứng chỉ #{index + 1}</span>
        <div className="flex items-center gap-2">
          <StatusBadge value={cert.aiStatus} />
          <RescanButton kind="cert" certId={cert.id} status={cert.aiStatus} updatedAt={updatedAt} />
        </div>
      </div>
      <FilePreview url={cert.fileUrl} label={`Chứng chỉ ${index + 1}`} />
      {cert.aiError && <p className="mt-2 text-xs text-rose-600">{cert.aiError}</p>}
      <AiDataPanel data={certData} />
    </div>
  );
}
