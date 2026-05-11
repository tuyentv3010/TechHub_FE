"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import instructorApplicationApi, {
  InstructorApplication,
} from "@/apiRequests/instructor-application";
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

              {detail.cvFileUrl && (
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">{t("OriginalCvLabel")}</div>
                  <iframe
                    src={detail.cvFileUrl}
                    title={t("OriginalCvLabel")}
                    className="h-[400px] w-full rounded border"
                  />
                  <a
                    href={detail.cvFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-blue-600 underline"
                  >
                    {t("OpenCv")}
                  </a>
                </div>
              )}

              <div>
                <div className="text-xs uppercase text-muted-foreground">{t("AiStatusLabel")}</div>
                <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[detail.aiStatus] || ""}`}>
                  {getStatusLabel(detail.aiStatus)}
                </span>
                {detail.aiError && (
                  <p className="mt-1 text-rose-600">{t("AiErrorPrefix", { error: detail.aiError })}</p>
                )}
              </div>

              {aiData && (
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">
                    {t("AiExtractedDataLabel")}
                  </div>
                  <pre className="max-h-[300px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                    {JSON.stringify(aiData, null, 2)}
                  </pre>
                </div>
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
                      disabled={acting || detail.aiStatus !== "PROCESSED"}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {t("ApproveButton")}
                    </Button>
                    <Button onClick={handleReject} disabled={acting} variant="destructive">
                      {t("Reject")}
                    </Button>
                  </div>
                  {detail.aiStatus !== "PROCESSED" && (
                    <p className="text-xs text-amber-600">{t("ApproveBlockedByAi")}</p>
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
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
