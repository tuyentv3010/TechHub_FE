"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  BookOpen,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useGetCourseById } from "@/queries/useCourse";
import {
  extractIdFromSlug,
  formatPrice,
  calculateDiscountPercentage,
  formatDuration,
} from "@/lib/course";
import { useToast } from "@/hooks/use-toast";

type PaymentMethod = "vnpay" | "paypal" | null;

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params.slug as string;
  const courseId = extractIdFromSlug(slug);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: courseResponse, isLoading, error } = useGetCourseById(courseId);

  const course = courseResponse?.payload?.data;
  const courseSummary = course?.summary;

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Vui lòng chọn phương thức thanh toán",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Gọi API thanh toán tương ứng với method được chọn
      // Ví dụ: await processPayment(courseId, selectedMethod, finalPrice);

      toast({
        title: "Đang xử lý thanh toán...",
        description: `Chuyển hướng đến ${selectedMethod === "vnpay" ? "VNPay" : "PayPal"}`,
      });

      // Simulate payment processing
      setTimeout(() => {
        // Redirect to payment gateway or success page
        toast({
          title: "Thanh toán thành công!",
          description: "Bạn đã đăng ký khóa học thành công.",
        });
        router.push(`/courses/${slug}/learn`);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi thanh toán.";
      toast({
        title: "Thanh toán thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto max-w-6xl px-4">
          <Skeleton className="mb-8 h-12 w-64" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !courseSummary) {
    return (
      <main className="min-h-screen bg-background pb-20 pt-24">
        <div className="container mx-auto max-w-6xl px-4">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-12 text-center">
              <p className="text-destructive">
                Không thể tải thông tin khóa học. Vui lòng thử lại sau.
              </p>
              <Button
                onClick={() => router.push(`/courses/${slug}`)}
                className="mt-4"
                variant="outline"
              >
                Quay lại
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const discountPercentage = courseSummary.discountPrice
    ? calculateDiscountPercentage(courseSummary.price, courseSummary.discountPrice)
    : 0;

  const finalPrice = courseSummary.discountPrice || courseSummary.price;

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${slug}`)}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại khóa học
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">
            Thanh toán khóa học
          </h1>
          <p className="text-muted-foreground">
            Chọn phương thức thanh toán phù hợp để hoàn tất đăng ký
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left - Payment Methods */}
          <div className="space-y-6 lg:col-span-2">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Chọn phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* VNPay Option */}
                <button
                  onClick={() => setSelectedMethod("vnpay")}
                  className={`w-full rounded-lg border-2 p-6 text-left transition-all hover:border-purple-500 hover:shadow-md ${
                    selectedMethod === "vnpay"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                        <Wallet className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">VNPay</h3>
                        <p className="text-sm text-muted-foreground">
                          Thanh toán qua VNPay QR, thẻ ATM, visa, mastercard
                        </p>
                      </div>
                    </div>
                    {selectedMethod === "vnpay" && (
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                </button>

                {/* PayPal Option */}
                <button
                  onClick={() => setSelectedMethod("paypal")}
                  className={`w-full rounded-lg border-2 p-6 text-left transition-all hover:border-purple-500 hover:shadow-md ${
                    selectedMethod === "paypal"
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-950/30"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#003087]">
                        <span className="text-lg font-bold text-white">PP</span>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold">PayPal</h3>
                        <p className="text-sm text-muted-foreground">
                          Thanh toán quốc tế qua PayPal
                        </p>
                      </div>
                    </div>
                    {selectedMethod === "paypal" && (
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                </button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
              <CardContent className="flex items-start gap-3 p-6">
                <Shield className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="mb-1 font-semibold text-green-900 dark:text-green-100">
                    Thanh toán bảo mật
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Giao dịch của bạn được mã hóa và bảo mật tuyệt đối. Chúng tôi
                    không lưu trữ thông tin thẻ của bạn.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
              className="w-full bg-purple-600 py-6 text-lg font-semibold hover:bg-purple-700"
            >
              {isProcessing
                ? "Đang xử lý..."
                : `Thanh toán ${formatPrice(finalPrice)}`}
            </Button>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Thumbnail */}
                {courseSummary.thumbnail?.url && (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={courseSummary.thumbnail.url}
                      alt={courseSummary.title}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}

                {/* Course Info */}
                <div>
                  <h3 className="mb-2 font-semibold leading-tight">
                    {courseSummary.title}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {course.totalLessons && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.totalLessons} bài học</span>
                      </div>
                    )}
                    {course.totalEstimatedDurationMinutes && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDuration(course.totalEstimatedDurationMinutes)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Price Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Giá gốc</span>
                    <span
                      className={
                        courseSummary.discountPrice ? "line-through" : "font-semibold"
                      }
                    >
                      {formatPrice(courseSummary.price)}
                    </span>
                  </div>

                  {courseSummary.discountPrice && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Giảm giá</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            -{discountPercentage}%
                          </Badge>
                          <span className="font-semibold text-green-600">
                            -{formatPrice(courseSummary.price - courseSummary.discountPrice)}
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Tổng thanh toán</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {formatPrice(courseSummary.discountPrice)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Separator />

                {/* Benefits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Bạn sẽ nhận được:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>Truy cập trọn đời khóa học</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>Tất cả tài liệu và bài tập</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>Chứng chỉ hoàn thành</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>Hỗ trợ từ giảng viên</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
