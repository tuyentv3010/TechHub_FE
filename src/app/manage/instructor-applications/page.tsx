"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import instructorApplicationApi, {
  InstructorApplication,
} from "@/apiRequests/instructor-application";

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
  PROCESSED: "bg-blue-100 text-blue-800",
  FAILED: "bg-rose-100 text-rose-800",
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
  const [items, setItems] = useState<InstructorApplication[]>([]);
  const [status, setStatus] = useState<string>("PENDING");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<InstructorApplication | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res: any = await instructorApplicationApi.listForAdmin(status, 0, 50);
      const data = res?.payload?.data || res?.payload;
      setItems(data?.content || []);
    } catch (e: any) {
      toast({ title: "Lỗi tải danh sách", variant: "destructive" });
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
    setNote("");
    try {
      const res: any = await instructorApplicationApi.getDetail(id);
      const data = res?.payload?.data || res?.payload;
      setDetail(data);
    } catch (e) {
      toast({ title: "Không lấy được chi tiết", variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    setActing(true);
    try {
      await instructorApplicationApi.approve(selectedId, note || undefined);
      toast({ title: "Đã duyệt — user nhận role INSTRUCTOR" });
      setOpen(false);
      await fetchList();
    } catch (e: any) {
      toast({ title: e?.payload?.message || "Lỗi duyệt", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    if (!note.trim()) {
      toast({ title: "Reject phải có lý do", variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      await instructorApplicationApi.reject(selectedId, note);
      toast({ title: "Đã từ chối đơn" });
      setOpen(false);
      await fetchList();
    } catch (e: any) {
      toast({ title: e?.payload?.message || "Lỗi từ chối", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const aiData = useMemo(() => safeParse(detail?.aiExtractedData), [detail]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đơn ứng tuyển giảng viên</h1>
          <p className="text-sm text-muted-foreground">
            Duyệt CV (AI scan) và phê duyệt giảng viên mới.
          </p>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Đang chờ</SelectItem>
            <SelectItem value="APPROVED">Đã duyệt</SelectItem>
            <SelectItem value="REJECTED">Đã từ chối</SelectItem>
            <SelectItem value="ALL">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr className="text-left">
                <th className="px-4 py-3">Người nộp</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ngày nộp</th>
                <th className="px-4 py-3">AI</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Chưa có đơn nào.
                  </td>
                </tr>
              )}
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium">{it.userName || it.userId.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{it.userEmail || "-"}</td>
                  <td className="px-4 py-3">{new Date(it.created).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[it.aiStatus] || ""}`}>
                      {it.aiStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[it.adminStatus] || ""}`}>
                      {it.adminStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetail(it.id)}>
                      Xem
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
            <SheetTitle>Chi tiết đơn</SheetTitle>
          </SheetHeader>
          {!detail ? (
            <p className="mt-6 text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Người nộp</div>
                <div className="font-semibold">
                  {detail.userName || detail.userEmail || detail.userId}
                </div>
                {detail.userEmail && <div className="text-muted-foreground">{detail.userEmail}</div>}
              </div>

              {detail.cvFileUrl && (
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">CV gốc</div>
                  <iframe src={detail.cvFileUrl} className="h-[400px] w-full rounded border" />
                  <a
                    href={detail.cvFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-blue-600 underline"
                  >
                    Mở CV trong tab mới
                  </a>
                </div>
              )}

              <div>
                <div className="text-xs uppercase text-muted-foreground">Trạng thái AI</div>
                <span className={`rounded px-2 py-1 text-xs ${STATUS_TONE[detail.aiStatus] || ""}`}>
                  {detail.aiStatus}
                </span>
                {detail.aiError && (
                  <p className="mt-1 text-rose-600">Lỗi AI: {detail.aiError}</p>
                )}
              </div>

              {aiData && (
                <div>
                  <div className="mb-2 text-xs uppercase text-muted-foreground">
                    Dữ liệu AI trích xuất
                  </div>
                  <pre className="max-h-[300px] overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-slate-900">
                    {JSON.stringify(aiData, null, 2)}
                  </pre>
                </div>
              )}

              {detail.adminStatus === "PENDING" ? (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    placeholder="Ghi chú duyệt / lý do từ chối"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={acting || detail.aiStatus !== "PROCESSED"}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve (cấp role INSTRUCTOR)
                    </Button>
                    <Button onClick={handleReject} disabled={acting} variant="destructive">
                      Reject
                    </Button>
                  </div>
                  {detail.aiStatus !== "PROCESSED" && (
                    <p className="text-xs text-amber-600">
                      Chưa thể duyệt khi AI chưa scan xong CV.
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-t pt-4 text-muted-foreground">
                  Đơn đã {detail.adminStatus}. Note: {detail.adminNote || "—"}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
