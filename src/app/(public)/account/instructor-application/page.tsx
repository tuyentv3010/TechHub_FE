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

type SlotKey = "cv" | "cccdFront" | "cccdBack";

export default function InstructorApplicationPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [cccdFront, setCccdFront] = useState<File | null>(null);
  const [cccdBack, setCccdBack] = useState<File | null>(null);
  const [certs, setCerts] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apps, setApps] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<SlotKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cccdFrontRef = useRef<HTMLInputElement>(null);
  const cccdBackRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

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
  const isAiFailed = latest?.aiStatus === "FAILED";
  const isApproved = latest?.adminStatus === "APPROVED";
  const isRejected = latest?.adminStatus === "REJECTED";
  const isAdminPending = latest?.adminStatus === "PENDING";
  // Cho nộp lại khi: chưa nộp đơn nào, đã bị admin reject, hoặc AI scan fail.
  const canApply = !loading && (!latest || isRejected || isAiFailed);

  // Auto-poll khi AI đang processing.
  useEffect(() => {
    if (!isAiPending || !isAdminPending) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [isAiPending, isAdminPending]);

  const validateFile = (f: File, allowPdf = true): string | null => {
    if (f.size > 10 * 1024 * 1024) return "Tối đa 10MB";
    const types = allowPdf
      ? ["application/pdf", "image/png", "image/jpeg"]
      : ["image/png", "image/jpeg"];
    if (!types.includes(f.type)) {
      return allowPdf ? "Chỉ PDF/JPG/PNG" : "Chỉ JPG/PNG";
    }
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f, true);
    if (err) {
      toast({ title: "File không hợp lệ", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
  };

  const handleCccdSelect = (which: "front" | "back", f: File | null) => {
    if (!f) return;
    const err = validateFile(f, false);
    if (err) {
      toast({ title: "Ảnh CCCD không hợp lệ", description: err, variant: "destructive" });
      return;
    }
    if (which === "front") setCccdFront(f);
    else setCccdBack(f);
  };

  const handleCertsSelect = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: File[] = [];
    for (const f of Array.from(list)) {
      const err = validateFile(f, true);
      if (err) {
        toast({ title: `Bỏ qua ${f.name}`, description: err, variant: "destructive" });
        continue;
      }
      next.push(f);
    }
    if (next.length > 0) setCerts((prev) => [...prev, ...next]);
  };

  const uploadOne = async (f: File, userId: string) => {
    const fd = new FormData();
    fd.append("file", f);
    if (userId) fd.append("userId", userId);
    const res: any = await fileApiRequest.uploadFile(fd);
    const data = res?.payload?.data || res?.payload;
    const id: string | undefined = data?.id;
    const url: string =
      data?.secureUrl || data?.publicUrl || data?.cloudinarySecureUrl || "";
    if (!id) throw new Error(`Upload ${f.name} thất bại`);
    return { id, url };
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

      const [cvUp, frontUp, backUp, certUps] = await Promise.all([
        uploadOne(file, userId),
        cccdFront ? uploadOne(cccdFront, userId) : Promise.resolve(null),
        cccdBack ? uploadOne(cccdBack, userId) : Promise.resolve(null),
        certs.length > 0
          ? Promise.all(certs.map((c) => uploadOne(c, userId)))
          : Promise.resolve([] as { id: string; url: string }[]),
      ]);

      setSubmitting(true);
      await instructorApplicationApi.submit({
        cvFileId: cvUp.id,
        cvFileUrl: cvUp.url,
        cccdFrontFileId: frontUp?.id,
        cccdFrontFileUrl: frontUp?.url,
        cccdBackFileId: backUp?.id,
        cccdBackFileUrl: backUp?.url,
        certificates: certUps.map((c) => ({ fileId: c.id, fileUrl: c.url })),
      });
      toast({ title: "Đã gửi đơn ứng tuyển", description: "AI đang phân tích hồ sơ..." });
      setFile(null);
      setCccdFront(null);
      setCccdBack(null);
      setCerts([]);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="mx-auto max-w-[1100px] px-4 py-12 md:py-16">
        {/* HERO */}
        <section className="mb-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
            <div className="shrink-0 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/30">
              <BadgeCheck className="h-10 w-10 text-white" />
            </div>
            <div className="space-y-3">
              <h1 className="bg-gradient-to-r from-primary to-primary bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
                Trở thành Giảng viên TechHub
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
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
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
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
                <div className="flex items-center gap-4 border-b border-border pb-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">Tải lên hồ sơ của bạn</h3>
                    <p className="text-xs text-muted-foreground">
                      CV và CCCD là bắt buộc. Chứng chỉ giúp được duyệt nhanh hơn.
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-8">
                  {/* 1. CV */}
                  <SubSection num="1" title="CV / Resume" required hint="PDF / DOC / JPG / PNG · tối đa 10MB">
                    {!file ? (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver("cv");
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(null);
                          handleFileSelect(e.dataTransfer.files?.[0] || null);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                          dragOver === "cv"
                            ? "border-primary bg-primary/5"
                            : "border-input bg-muted hover:border-primary/70 hover:bg-primary/5"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                            <CloudUpload className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="text-base font-semibold">Kéo thả CV vào đây</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              hoặc click để chọn file (PDF, DOC, JPG, PNG · tối đa 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FileChip
                        kind={file.type.includes("pdf") ? "pdf" : "img"}
                        name={file.name}
                        sizeKB={file.size / 1024}
                        onRemove={() => setFile(null)}
                      />
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />
                  </SubSection>

                  {/* 2. CCCD */}
                  <SubSection
                    num="2"
                    title="Căn cước công dân"
                    required
                    hint="Ảnh chụp rõ nét 2 mặt · JPG/PNG, tối đa 10MB / ảnh"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <CccdTile
                        side="MẶT TRƯỚC"
                        file={cccdFront}
                        active={dragOver === "cccdFront"}
                        onPick={() => cccdFrontRef.current?.click()}
                        onClear={() => setCccdFront(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver("cccdFront");
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(null);
                          handleCccdSelect("front", e.dataTransfer.files?.[0] || null);
                        }}
                      />
                      <CccdTile
                        side="MẶT SAU"
                        file={cccdBack}
                        active={dragOver === "cccdBack"}
                        onPick={() => cccdBackRef.current?.click()}
                        onClear={() => setCccdBack(null)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver("cccdBack");
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(null);
                          handleCccdSelect("back", e.dataTransfer.files?.[0] || null);
                        }}
                      />
                      <input
                        ref={cccdFrontRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => handleCccdSelect("front", e.target.files?.[0] || null)}
                      />
                      <input
                        ref={cccdBackRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => handleCccdSelect("back", e.target.files?.[0] || null)}
                      />
                    </div>
                  </SubSection>

                  {/* 3. Certificates */}
                  <SubSection
                    num="3"
                    title="Chứng chỉ"
                    hint="Tuỳ chọn · AWS / GCP / Coursera / FPT Academy ... PDF/JPG/PNG"
                  >
                    {certs.length > 0 && (
                      <ul className="mb-3 space-y-2">
                        {certs.map((c, i) => (
                          <li key={`${c.name}-${i}`}>
                            <FileChip
                              kind={c.type.includes("pdf") ? "pdf" : "img"}
                              name={c.name}
                              sizeKB={c.size / 1024}
                              onRemove={() =>
                                setCerts((prev) => prev.filter((_, j) => j !== i))
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    <button
                      type="button"
                      onClick={() => certInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-transparent py-3 text-sm font-semibold text-primary transition-all hover:border-primary/70 hover:bg-primary/5"
                    >
                      <span className="text-base leading-none">+</span>
                      Thêm chứng chỉ
                    </button>
                    <input
                      ref={certInputRef}
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleCertsSelect(e.target.files);
                        if (certInputRef.current) certInputRef.current.value = "";
                      }}
                    />
                  </SubSection>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                    <p className="flex items-center gap-2 text-xs italic text-muted-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      Thông tin của bạn được bảo mật theo tiêu chuẩn TechHub
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={uploading || submitting || !file || !cccdFront || !cccdBack}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
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
                <div className="relative h-28 bg-gradient-to-r from-primary to-primary">
                  <div className="absolute -bottom-5 left-6 flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
                    <FileText className="h-7 w-7 text-primary" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      AI Insights
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(aiData.data.skills || []).slice(0, 12).map((s: string) => (
                        <span
                          key={s}
                          className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    {aiData.data.summary && (
                      <p className="rounded-lg bg-muted p-3 text-xs italic leading-relaxed text-muted-foreground">
                        "{aiData.data.summary}"
                      </p>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* EMPTY STATE */}
            {!latest && !loading && (
              <div className="rounded-xl border border-dashed border-input bg-muted p-10 text-center">
                <Brain className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-semibold text-muted-foreground">
                  Chưa có đơn ứng tuyển nào
                </p>
                <p className="text-sm text-muted-foreground">
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
                <h4 className="mb-6 border-b border-border pb-4 text-lg font-bold">
                  Tiến trình hồ sơ
                </h4>
                <div className="relative space-y-0">
                  <div className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-border" />
                  <Step
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    title="Đã tải CV"
                    desc={`Hệ thống đã nhận file`}
                    time={new Date(latest.created).toLocaleString("vi-VN")}
                    state="done"
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
                      isApproved || isRejected ? "done" : "current"
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
              <h4 className="mb-6 border-b border-border pb-4 text-lg font-bold">
                Tại sao trở thành giảng viên?
              </h4>
              <ul className="space-y-5">
                {WHY.map((w) => {
                  const Icon = w.icon;
                  return (
                    <li key={w.title} className="flex gap-4">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{w.title}</p>
                        <p className="text-xs text-muted-foreground">{w.desc}</p>
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
    <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-card px-4 py-1.5 text-sm font-medium text-primary">
      {icon}
      {text}
    </span>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur-md md:p-8 ${className}`}
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
    blue: "border-border bg-muted text-foreground",
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

function SubSection({
  num,
  title,
  hint,
  required,
  children,
}: {
  num: string;
  title: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          {num}
        </span>
        <div>
          <p className="text-base font-semibold">
            {title}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FileChip({
  kind,
  name,
  sizeKB,
  onRemove,
}: {
  kind: "pdf" | "img";
  name: string;
  sizeKB: number;
  onRemove: () => void;
}) {
  const thumb =
    kind === "pdf"
      ? "bg-gradient-to-br from-rose-500 to-rose-700"
      : "bg-gradient-to-br from-emerald-500 to-emerald-800";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${thumb}`}
      >
        {kind.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Sẵn sàng tải lên · {sizeKB.toFixed(1)} KB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        aria-label="Xoá"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function CccdTile({
  side,
  file,
  active,
  onPick,
  onClear,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  side: "MẶT TRƯỚC" | "MẶT SAU";
  file: File | null;
  active: boolean;
  onPick: () => void;
  onClear: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const previewUrl = file ? URL.createObjectURL(file) : null;
  return (
    <div className="relative">
      <span className="absolute left-3 top-3 z-10 rounded-full border border-border bg-card/95 px-2.5 py-1 text-[10px] font-bold tracking-wider text-muted-foreground shadow-sm">
        {side}
      </span>

      {file && previewUrl ? (
        <div className="relative aspect-[1.586/1] overflow-hidden rounded-xl border border-border">
          <img src={previewUrl} alt={side} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            aria-label="Xoá"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
            <span className="truncate font-semibold">{file.name}</span>
            <span className="ml-2 flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold">
              <CheckCircle2 className="h-3 w-3" />
              Đã chọn
            </span>
          </div>
        </div>
      ) : (
        <div
          onClick={onPick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative grid aspect-[1.586/1] cursor-pointer place-items-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
            active
              ? "border-primary bg-primary/5"
              : "border-input bg-muted hover:border-primary/70 hover:bg-primary/5"
          }`}
        >
          <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l-2 border-t-2 border-primary" />
          <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r-2 border-t-2 border-primary" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b-2 border-l-2 border-primary" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b-2 border-r-2 border-primary" />
          <div className="flex flex-col items-center gap-2">
            <CloudUpload className="h-7 w-7 text-primary" />
            <p className="text-xs font-semibold">Click hoặc kéo thả ảnh CCCD</p>
            <p className="text-[11px] text-muted-foreground">JPG / PNG · ≤ 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between border-b border-border pb-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
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
      ? "bg-gradient-to-br from-primary to-primary text-white shadow-lg shadow-primary/30 animate-pulse"
      : "bg-muted text-muted-foreground";
  const text =
    state === "current"
      ? "text-primary"
      : state === "done"
      ? "text-foreground"
      : "text-muted-foreground";
  return (
    <div className={`relative flex gap-5 ${last ? "" : "pb-8"}`}>
      <div
        className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${circle}`}
      >
        {icon}
      </div>
      <div>
        <h5 className={`font-semibold ${text}`}>{title}</h5>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        {time && <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{time}</p>}
      </div>
    </div>
  );
}
