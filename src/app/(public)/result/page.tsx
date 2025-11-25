"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [courseInfo, setCourseInfo] = useState<{
    courseId: string;
    slug: string;
    title: string;
  } | null>(null);

  const status = searchParams.get("status");
  const txnRef = searchParams.get("txnRef");
  const amount = searchParams.get("amount");
  const paymentMethod = searchParams.get("paymentMethod");

  useEffect(() => {
    // Lấy thông tin khóa học từ localStorage
    if (typeof window !== "undefined") {
      const savedCourse = localStorage.getItem("pendingPaymentCourse");
      if (savedCourse) {
        try {
          const parsed = JSON.parse(savedCourse);
          setCourseInfo(parsed);
          // Xóa sau khi đã lấy
          localStorage.removeItem("pendingPaymentCourse");
        } catch (error) {
          console.error("Failed to parse course info:", error);
        }
      }
    }

    // Simulate loading state
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const formatAmount = (amountStr: string | null, method: string | null) => {
    if (!amountStr || amountStr === "N/A") return "N/A";

    // Nếu là PayPal, amount có thể là N/A hoặc không có
    if (method === "PayPal") {
      return "N/A";
    }

    // Nếu là VNPay - amount đã là số tiền thực (VND), không cần chia 100
    const numAmount = parseInt(amountStr);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numAmount);
  };

  const getPaymentMethodDisplay = (method: string | null) => {
    if (method === "PayPal") return "PayPal";
    return "VNPay";
  };

  const handleViewCourse = () => {
    if (courseInfo?.slug) {
      // Chuyển đến trang học của khóa học đã thanh toán
      router.push(`/courses/${courseInfo.slug}/learn`);
    } else {
      // Fallback: chuyển đến danh sách khóa học
      router.push("/courses");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto max-w-2xl px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
              <p className="mt-4 text-lg text-muted-foreground">
                Đang xác nhận thanh toán...
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const isSuccess = status === "success";

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="container mx-auto max-w-2xl px-4">
        <Card className={isSuccess ? "border-green-200" : "border-red-200"}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
              {isSuccess ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isSuccess
                ? `Cảm ơn bạn đã đăng ký khóa học${courseInfo?.title ? ` "${courseInfo.title}"` : ""}. Bạn có thể bắt đầu học ngay bây giờ.`
                : "Giao dịch của bạn không thành công. Vui lòng thử lại."}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Transaction Details */}
            <div className="rounded-lg bg-muted/50 p-6">
              <h3 className="mb-4 font-semibold">Thông tin giao dịch</h3>
              <div className="space-y-3">
                {courseInfo && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Khóa học</span>
                      <span className="font-semibold text-right max-w-[60%]">
                        {courseInfo.title}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Phương thức thanh toán
                  </span>
                  <span className="font-semibold">
                    {getPaymentMethodDisplay(paymentMethod)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch</span>
                  <span className="font-mono font-semibold">
                    {txnRef || "N/A"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold">
                    {formatAmount(amount, paymentMethod)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span
                    className={`font-semibold ${
                      isSuccess ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isSuccess ? "Thành công" : "Thất bại"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-semibold">
                    {new Date().toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Actions */}
            {isSuccess && (
              <div className="space-y-3">
                <Button
                  onClick={handleViewCourse}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {courseInfo ? "Vào học ngay" : "Xem khóa học của tôi"}
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Về trang chủ
                </Button>
              </div>
            )}

            {/* Failure Actions */}
            {!isSuccess && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    if (courseInfo?.slug) {
                      router.push(`/payment/${courseInfo.slug}`);
                    } else {
                      router.back();
                    }
                  }}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  Thử lại
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Về trang chủ
                </Button>
              </div>
            )}

            {/* Support Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Lưu ý:</strong> Nếu bạn có bất kỳ thắc mắc nào về giao dịch,
                vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi với mã giao dịch{" "}
                <span className="font-mono font-semibold">{txnRef}</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
