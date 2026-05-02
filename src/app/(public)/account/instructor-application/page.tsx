"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import instructorApplicationApi, {
  InstructorApplication,
} from "@/apiRequests/instructor-application";
import fileApiRequest from "@/apiRequests/file";
import { decodeToken, getAccessTokenFromLocalStorage } from "@/lib/utils";
import {
  CloudUpload,
  ShieldCheck,
  Zap,
  Coins,
  Lightbulb,
  TrendingUp,
  Globe2,
  Sparkles,
  Handshake,
  CheckCircle2,
  Brain,
  ClipboardCheck,
  BadgeCheck,
  ArrowRight,
  FileText,
  RefreshCw,
  X,
  AlertTriangle,
} from "lucide-react";

function safeParse(json?: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const TIPS = [
  "Cập nhật kinh nghiệm làm việc mới nhất.",
  "Đính kèm link Portfolio hoặc GitHub cá nhân.",
  "Liệt kê các kỹ năng công nghệ cốt lõi bạn nắm vững.",
];

const WHY = [
  {
    icon: TrendingUp,
    title: "Nâng tầm thương hiệu",
    desc: "Xây dựng uy tín cá nhân trong cộng đồng công nghệ.",
  },
  {
    icon: Globe2,
    title: "Tiếp cận 1M+ học viên",
    desc: "Kiến thức của bạn sẽ được lan tỏa tới hàng triệu người.",
  },
  {
    icon: Sparkles,
    title: "Hỗ trợ bởi AI",
    desc: "Công cụ AI giúp bạn biên soạn nội dung khóa học nhanh hơn.",
  },
  {
    icon: Handshake,
    title: "Cộng đồng chuyên gia",
    desc: "Kết nối với mạng lưới giảng viên toàn cầu.",
  },
];

export default function InstructorApplicationPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apps, setApps] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const res: any = await instructorApplicationApi.getMine();
      const data = res?.payload?.data || res?.payload || [];
      setApps(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const latest = apps[0];
  const aiData = useMemo(() => safeParse(latest?.aiExtractedData), [latest]);
  const isAiPending = latest?.aiStatus === "PENDING";
  const isAiProcessed = latest?.aiStatus === "PROCESSED";
  const isApproved = latest?.adminStatus === "APPROVED";
  const isRejected = latest?.adminStatus === "REJECTED";
  const isAdminPending = latest?.adminStatus === "PENDING";
  const canApply = !latest || isRejected;

  // Auto-poll khi AI đang processing.
  useEffect(() => {
    if (!isAiPending || !isAdminPending) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [isAiPending, isAdminPending]);

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "File quá lớn", description: "Tối đa 10MB", variant: "destructive" });
      return;
    }
    const ok = ["application/pdf", "image/png", "image/jpeg"].includes(f.type);
    if (!ok) {
      toast({ title: "Định dạng không hỗ trợ", description: "Chỉ PDF/JPG/PNG", variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ title: "Chọn CV trước", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const token = getAccessTokenFromLocalStorage();
      const decoded: any = token ? decodeToken(token) : null;
      const userId = decoded?.userId || decoded?.sub || "";

      const formData = new FormData();
      formData.append("file", file);
      if (userId) formData.append("userId", userId);
      const upRes: any = await fileApiRequest.uploadFile(formData);
      const fileData = upRes?.payload?.data || upRes?.payload;
      const cvFileId: string = fileData?.id;
      const cvFileUrl: string =
        fileData?.secureUrl || fileData?.publicUrl || fileData?.cloudinarySecureUrl || "";
      if (!cvFileId) throw new Error("Upload CV thất bại");

      setSubmitting(true);
      await instructorApplicationApi.submit(cvFileId, cvFileUrl);
      toast({ title: "Đã gửi đơn ứng tuyển", description: "AI đang phân tích CV..." });
      setFile(null);
      await refresh();
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e?.payload?.message || e?.message || "Gửi đơn thất bại",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="mx-auto max-w-[1100px] px-4 py-12 md:py-16">
        {/* HERO */}
        <section className="mb-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30">
              <BadgeCheck className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h1 className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
                Trở thành Giảng viên TechHub
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
                Chia sẻ kiến thức, tạo thu nhập từ khóa học của bạn. Tham gia cộng đồng chuyên gia
                công nghệ hàng đầu.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
            <Badge icon={<ShieldCheck className="h-4 w-4" />} text="AI scan CV trong 30 giây" />
            <Badge icon={<Zap className="h-4 w-4" />} text="Phê duyệt nhanh trong 24h" />
            <Badge icon={<Coins className="h-4 w-4" />} text="70% doanh thu thuộc về bạn" />
          </div>
        </section>

        {/* STATUS BANNER */}
        {latest && (
          <div className="mb-8">
            {isApproved && (
              <Banner
                color="emerald"
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="🎉 Chúc mừng! Bạn đã chính thức là giảng viên"
                desc="Bắt đầu xây dựng khóa học đầu tiên ngay hôm nay."
                action={
                  <a
                    href="/manage/courses"
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Tạo khóa học
                  </a>
                }
              />
            )}
            {isRejected && (
              <Banner
                color="rose"
                icon={<X className="h-7 w-7" />}
                title="❌ Đơn ứng tuyển bị từ chối"
                desc={latest.adminNote || "Vui lòng cập nhật CV và nộp lại."}
              />
            )}
            {!isApproved && !isRejected && isAiPending && (
              <Banner
                color="amber"
                icon={<RefreshCw className="h-7 w-7 animate-spin" />}
                title="⏳ AI đang đọc CV của bạn..."
                desc="Chúng tôi đang trích xuất kỹ năng và kinh nghiệm để khớp với lộ trình giảng dạy."
                tag="TRẠNG THÁI: CHỜ AI"
              />
            )}
            {!isApproved && !isRejected && isAiProcessed && (
              <Banner
                color="blue"
                icon={<ClipboardCheck className="h-7 w-7" />}
                title="✅ AI đã phân tích xong"
                desc="Đơn của bạn đang chờ admin duyệt. Thường mất 24-48h."
                tag="TRẠNG THÁI: CHỜ DUYỆT"
              />
            )}
            {!isApproved && !isRejected && latest.aiStatus === "FAILED" && (
              <Banner
                color="rose"
                icon={<AlertTriangle className="h-7 w-7" />}
                title="AI scan thất bại"
                desc={latest.aiError || "Vui lòng thử lại với file CV khác."}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: form / detail */}
          <div className="space-y-8 lg:col-span-8">
            {/* UPLOAD CARD */}
            {canApply && (
              <GlassCard>
                <div className="flex items-center gap-4 border-b border-slate-200 pb-5 dark:border-slate-700">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-sm font-bold text-white">
                    1
                  </span>
                  <h3 className="text-xl font-bold">Tải lên hồ sơ của bạn</h3>
                </div>
                <div className="mt-6">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFileSelect(e.dataTransfer.files?.[0] || null);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                      dragOver
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                        : "border-slate-300 bg-white/50 hover:border-purple-400 hover:bg-purple-50/50 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:bg-purple-950/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 transition-transform group-hover:scale-110 dark:from-purple-900/40 dark:to-blue-900/40">
                        <CloudUpload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold">
                          {file ? file.name : "Kéo thả CV của bạn vào đây"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {file
                            ? `${(file.size / 1024).toFixed(1)} KB · click để chọn lại`
                            : "hoặc click để chọn file (PDF, JPG, PNG · tối đa 10MB)"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="flex items-center gap-2 text-xs italic text-slate-500">
                      <ShieldCheck className="h-4 w-4" />
                      Thông tin của bạn được bảo mật theo tiêu chuẩn TechHub
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={uploading || submitting || !file}
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-7 py-3 font-semibold text-white shadow-md shadow-purple-500/30 transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading || submitting ? "Đang xử lý..." : "Gửi đơn ứng tuyển"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* AI EXTRACTED DATA */}
            {latest && aiData?.data && (
              <GlassCard className="overflow-hidden p-0">
                <div className="relative h-28 bg-gradient-to-r from-purple-600 to-blue-600">
                  <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-800">
                    <FileText className="h-7 w-7 text-purple-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Hồ sơ đã tải
                      </p>
                      <p className="font-semibold">
                        {latest.cvFileUrl ? latest.cvFileUrl.split("/").pop() : "cv.pdf"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 p-8 pt-12 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Thông tin cá nhân
                    </p>
                    <Row label="Họ và tên" value={aiData.data.fullName} />
                    <Row label="Email" value={aiData.data.email} />
                    <Row label="Số điện thoại" value={aiData.data.phone} />
                    <Row label="Địa chỉ" value={aiData.data.location} />
                    <Row
                      label="Kinh nghiệm"
                      value={aiData.data.yearsOfExperience != null ? `${aiData.data.yearsOfExperience} năm` : "-"}
                    />
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      AI Insights
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(aiData.data.skills || []).slice(0, 12).map((s: string) => (
                        <span
                          key={s}
                          className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {aiData.data.summary && (
                      <p className="rounded-lg bg-slate-100 p-3 text-xs italic leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        "{aiData.data.summary}"
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* EMPTY STATE */}
            {!latest && !loading && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-10 text-center dark:border-slate-700 dark:bg-slate-900/30">
                <Brain className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
                  Chưa có đơn ứng tuyển nào
                </p>
                <p className="text-sm text-slate-500">
                  Sau khi gửi CV, bạn có thể theo dõi tiến trình duyệt tại đây.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6 lg:col-span-4">
            {/* TIMELINE (chỉ khi có application) */}
            {latest && (
              <GlassCard>
                <h4 className="mb-6 border-b border-slate-200 pb-4 text-lg font-bold dark:border-slate-700">
                  Tiến trình hồ sơ
                </h4>
                <div className="relative space-y-0">
                  <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  <Step
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Đã tải CV"
                    desc={`Hệ thống đã nhận file`}
                    time={new Date(latest.created).toLocaleString("vi-VN")}
                    state="done"
                  />
                  <Step
                    icon={<Brain className="h-5 w-5" />}
                    title={isAiProcessed ? "AI đã phân tích xong" : "AI đang phân tích..."}
                    desc={
                      isAiProcessed
                        ? "Trích xuất kỹ năng & kinh nghiệm hoàn tất"
                        : "Đang trích xuất kỹ năng từ CV"
                    }
                    state={isAiProcessed ? "done" : isAiPending ? "current" : "done"}
                  />
                  <Step
                    icon={<ClipboardCheck className="h-5 w-5" />}
                    title="Admin xem xét"
                    desc={
                      isApproved || isRejected
                        ? `Đã ${isApproved ? "duyệt" : "từ chối"}`
                        : "Dự kiến hoàn thành trong 24-48h"
                    }
                    state={
                      isApproved || isRejected
                        ? "done"
                        : isAiProcessed
                        ? "current"
                        : "pending"
                    }
                  />
                  <Step
                    icon={<BadgeCheck className="h-5 w-5" />}
                    title="Hoàn tất"
                    desc="Kích hoạt tài khoản Instructor"
                    state={isApproved ? "done" : "pending"}
                    last
                  />
                </div>
              </GlassCard>
            )}

            {/* WHY US */}
            <GlassCard>
              <h4 className="mb-6 border-b border-slate-200 pb-4 text-lg font-bold dark:border-slate-700">
                Tại sao trở thành giảng viên?
              </h4>
              <ul className="space-y-5">
                {WHY.map((w) => {
                  const Icon = w.icon;
                  return (
                    <li key={w.title} className="flex gap-4">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold">{w.title}</p>
                        <p className="text-xs text-slate-500">{w.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </GlassCard>

            {/* TIPS */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
              <h4 className="mb-4 flex items-center gap-2 text-base font-bold">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                Tips để được duyệt nhanh
              </h4>
              <ul className="space-y-3">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-1.5 text-sm font-medium text-purple-700 dark:border-purple-800 dark:bg-slate-900 dark:text-purple-300">
      {icon}
      {text}
    </span>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/60 md:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function Banner({
  color,
  icon,
  title,
  desc,
  tag,
  action,
}: {
  color: "emerald" | "rose" | "amber" | "blue";
  icon: React.ReactNode;
  title: string;
  desc: string;
  tag?: string;
  action?: React.ReactNode;
}) {
  const map: Record<string, string> = {
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100",
    rose: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100",
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100",
    blue: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100",
  };
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 shadow-sm md:p-6 ${map[color]}`}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-white/60 p-3 dark:bg-black/20">{icon}</div>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm opacity-80">{desc}</p>
        </div>
      </div>
      {tag && (
        <span className="hidden rounded-lg border border-current/30 bg-white/40 px-3 py-1.5 text-xs font-bold dark:bg-black/20 md:inline-block">
          {tag}
        </span>
      )}
      {action}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between border-b border-slate-200 pb-1.5 text-sm dark:border-slate-700">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value || "-"}</span>
    </div>
  );
}

function Step({
  icon,
  title,
  desc,
  time,
  state,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  time?: string;
  state: "done" | "current" | "pending";
  last?: boolean;
}) {
  const circle =
    state === "done"
      ? "bg-emerald-500 text-white"
      : state === "current"
      ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 animate-pulse"
      : "bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500";
  const text =
    state === "current"
      ? "text-purple-600 dark:text-purple-300"
      : state === "done"
      ? "text-slate-900 dark:text-slate-100"
      : "text-slate-400";
  return (
    <div className={`relative flex gap-5 ${last ? "" : "pb-8"}`}>
      <div
        className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${circle}`}
      >
        {icon}
      </div>
      <div>
        <h5 className={`font-semibold ${text}`}>{title}</h5>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
        {time && <p className="mt-0.5 text-[11px] font-medium text-slate-400">{time}</p>}
      </div>
    </div>
  );
}
