"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function VNPayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Lấy các tham số từ VNPay callback
    const status = searchParams.get("status");
    const txnRef = searchParams.get("txnRef");
    const amount = searchParams.get("amount");
    const paymentMethod = searchParams.get("paymentMethod");

    // Redirect sang trang result với các params
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (txnRef) params.append("txnRef", txnRef);
    if (amount) params.append("amount", amount);
    if (paymentMethod) params.append("paymentMethod", paymentMethod);

    router.push(`/result?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-background pb-20 pt-24">
      <div className="container mx-auto max-w-2xl px-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
            <p className="mt-4 text-lg text-muted-foreground">
              Đang xử lý kết quả thanh toán...
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

