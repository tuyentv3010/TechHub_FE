"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import instructorApplicationApi, {
  InstructorApplication,
} from "@/apiRequests/instructor-application";
import instructorProfileApi, {
  InstructorProfile,
} from "@/apiRequests/instructor-profile";
import InstructorProfileView from "@/components/instructor-profile-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  FAILED: "bg-rose-100 text-rose-800",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  ALL: "StatusAll",
  PENDING: "StatusPending",
  APPROVED: "StatusApproved",
  REJECTED: "StatusRejected",
  PROCESSED: "StatusProcessed",
  FAILED: "StatusFailed",
};

function safeParse(json?: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ManageInstructorApplicationsPage() {
  const { toast } = useToast();
  const t = useTranslations("ManageInstructorApplication");
  const locale = useLocale();
  const [items, setItems] = useState<InstructorApplication[]>([]);
  const [status, setStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InstructorApplication | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

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
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res: any = await instructorApplicationApi.listForAdmin(status, 0, 50);
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
  }, [status]);

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

  const aiData = useMemo(() => safeParse(detail?.aiExtractedData), [detail]);
  const cccdFrontData = useMemo(() => safeParse(detail?.cccdFrontData), [detail]);
  const cccdBackData = useMemo(() => safeParse(detail?.cccdBackData), [detail]);
  const [rescanning, setRescanning] = useState<string | null>(null);
  const [profile, setProfile] = useState<InstructorProfile | null>(null);

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

  const refreshDetail = async () => {
    if (!selectedId) return;
    try {
      const res: any = await instructorApplicationApi.getDetail(selectedId);
      const data = res?.payload?.data || res?.payload;
      setDetail(data);
    } catch {
      /* ignore */
    }
  };

  const handleRescan = async (kind: "cv" | "cccdFront" | "cccdBack" | "cert", certId?: string) => {
    if (!selectedId && kind !== "cert") return;
    setRescanning(kind === "cert" ? `cert:${certId}` : kind);
    try {
      if (kind === "cv") await instructorApplicationApi.rescanCv(selectedId!);
      else if (kind === "cccdFront") await instructorApplicationApi.rescanCccdFront(selectedId!);
      else if (kind === "cccdBack") await instructorApplicationApi.rescanCccdBack(selectedId!);
      else if (kind === "cert" && certId) await instructorApplicationApi.rescanCertificate(certId);
      toast({ title: "Đã gửi lại quét. Đang xử lý..." });
      await refreshDetail();
    } catch (e: any) {
      toast({ title: e?.payload?.message || "Quét lại thất bại", variant: "destructive" });
    } finally {
      setRescanning(null);
    }
  };

  const PENDING_TIMEOUT_MS = 2 * 60 * 1000; // 2 phút

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
    let pendingTooLong = false;
    if (isPending && updatedAt) {
      const elapsed = Date.now() - new Date(updatedAt).getTime();
      pendingTooLong = elapsed > PENDING_TIMEOUT_MS;
    }
    const busy = rescanning === key || (isPending && !pendingTooLong);
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => handleRescan(kind, certId)}
        title={pendingTooLong ? "N8n không phản hồi sau 2 phút — bấm để quét lại" : undefined}
      >
        {rescanning === key
          ? "Đang gửi..."
          : pendingTooLong
            ? "Quét lại (timeout)"
            : isPending
              ? "Đang quét..."
              : "Quét n8n"}
      </Button>
    );
  };

  const StatusBadge = ({ value }: { value?: string | null }) => (
    <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[String(value || "").toUpperCase()] || "bg-slate-100 text-slate-700"}`}>
      {getStatusLabel(value)}
    </span>
  );

  const isImage = (url?: string | null) =>
    !!url && /\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url);

  const FilePreview = ({ url, label }: { url?: string | null; label: string }) => {
    if (!url) return <p className="text-xs text-muted-foreground">Chưa có file</p>;
    return (
      <div className="space-y-1">
        {isImage(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="max-h-[260px] w-full rounded border object-contain bg-slate-50"
          />
        ) : (
          <iframe src={url} title={label} className="h-[300px] w-full rounded border" />
        )}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs text-blue-600 underline"
        >
          Mở file trong tab mới
        </a>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("Title")}</h1>
          <p className="text-sm text-muted-foreground">{t("Description")}</p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">{t("StatusPending")}</SelectItem>
            <SelectItem value="APPROVED">{t("StatusApproved")}</SelectItem>
            <SelectItem value="REJECTED">{t("StatusRejected")}</SelectItem>
            <SelectItem value="ALL">{t("StatusAll")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
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
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    {t("Loading")}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    {t("NoApplications")}
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium">
                    {it.userName || it.userId?.slice(0, 8) || t("NotAvailable")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{it.userEmail || t("NotAvailable")}</td>
                  <td className="px-4 py-3">{formatDateTime(it.created)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[it.aiStatus] || ""}`}>
                      {getStatusLabel(it.aiStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[it.adminStatus] || ""}`}>
                      {getStatusLabel(it.adminStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetail(it.id)}>
                      {t("View")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{t("DetailTitle")}</SheetTitle>
          </SheetHeader>
          {!detail ? (
            <p className="mt-6 text-sm text-muted-foreground">{t("Loading")}</p>
          ) : (
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">{t("ApplicantLabel")}</div>
                <div className="font-semibold">
                  {detail.userName || detail.userEmail || detail.userId || t("NotAvailable")}
                </div>
                {detail.userEmail && <div className="text-muted-foreground">{detail.userEmail}</div>}
              </div>

              {/* CV */}
              <section className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">CV</h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={detail.aiStatus} />
                    <RescanButton kind="cv" status={detail.aiStatus} updatedAt={detail.updated} />
                  </div>
                </div>
                <FilePreview url={detail.cvFileUrl} label="CV" />
                {detail.aiError && (
                  <p className="mt-2 text-xs text-rose-600">Lỗi AI: {detail.aiError}</p>
                )}
                {aiData && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      Dữ liệu AI trích xuất
                    </summary>
                    <pre className="mt-2 max-h-[260px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                      {JSON.stringify(aiData, null, 2)}
                    </pre>
                  </details>
                )}
              </section>

              {/* CCCD */}
              {(detail.cccdFrontFileUrl || detail.cccdBackFileUrl) && (
                <section className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">CCCD</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Mặt trước</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge value={detail.cccdFrontStatus} />
                          {detail.cccdFrontFileUrl && (
                            <RescanButton kind="cccdFront" status={detail.cccdFrontStatus} updatedAt={detail.updated} />
                          )}
                        </div>
                      </div>
                      <FilePreview url={detail.cccdFrontFileUrl} label="CCCD mặt trước" />
                      {detail.cccdFrontError && (
                        <p className="mt-1 text-xs text-rose-600">{detail.cccdFrontError}</p>
                      )}
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Mặt sau</span>
                        <div className="flex items-center gap-2">
                          <StatusBadge value={detail.cccdBackStatus} />
                          {detail.cccdBackFileUrl && (
                            <RescanButton kind="cccdBack" status={detail.cccdBackStatus} updatedAt={detail.updated} />
                          )}
                        </div>
                      </div>
                      <FilePreview url={detail.cccdBackFileUrl} label="CCCD mặt sau" />
                      {detail.cccdBackError && (
                        <p className="mt-1 text-xs text-rose-600">{detail.cccdBackError}</p>
                      )}
                    </div>
                  </div>
                  {(cccdFrontData || cccdBackData) && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                        Dữ liệu AI trích xuất từ CCCD
                      </summary>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {cccdFrontData && (
                          <pre className="max-h-[220px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                            {JSON.stringify(cccdFrontData, null, 2)}
                          </pre>
                        )}
                        {cccdBackData && (
                          <pre className="max-h-[220px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                            {JSON.stringify(cccdBackData, null, 2)}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </section>
              )}

              {/* Certificates */}
              {detail.certificates && detail.certificates.length > 0 && (
                <section className="rounded-lg border p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
                    Chứng chỉ ({detail.certificates.length})
                  </h3>
                  <div className="space-y-4">
                    {detail.certificates.map((cert, idx) => {
                      const certData = safeParse(cert.aiData);
                      return (
                        <div key={cert.id} className="rounded border p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              Chứng chỉ #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <StatusBadge value={cert.aiStatus} />
                              <RescanButton kind="cert" certId={cert.id} status={cert.aiStatus} updatedAt={detail.updated} />
                            </div>
                          </div>
                          <FilePreview url={cert.fileUrl} label={`Chứng chỉ ${idx + 1}`} />
                          {cert.aiError && (
                            <p className="mt-1 text-xs text-rose-600">{cert.aiError}</p>
                          )}
                          {certData && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                Dữ liệu AI
                              </summary>
                              <pre className="mt-2 max-h-[200px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                                {JSON.stringify(certData, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {detail.adminStatus === "PENDING" ? (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder={t("ReviewNotePlaceholder")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={acting}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {t("ApproveButton")}
                    </Button>
                    <Button onClick={handleReject} disabled={acting} variant="destructive">
                      {t("Reject")}
                    </Button>
                  </div>
                  {detail.aiStatus !== "PROCESSED" && (
                    <p className="text-xs text-amber-600">
                      AI chưa xử lý xong / thất bại — bạn vẫn có thể duyệt thủ công sau khi xem CV gốc.
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 text-muted-foreground">
                  {t("AlreadyProcessed", {
                    status: getStatusLabel(detail.adminStatus),
                    note: detail.adminNote || t("NoNote"),
                  })}
                </div>
              )}

              {detail.adminStatus === "APPROVED" && profile && (
                <section className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    Profile giảng viên (đã sync)
                  </h3>
                  <InstructorProfileView profile={profile} variant="full" />
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
