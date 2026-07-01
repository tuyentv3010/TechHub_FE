'use client';

import Link from "next/link";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnauthorizedAccessProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

export default function UnauthorizedAccess({
  title = "Không có quyền truy cập",
  description = "Bạn không có quyền truy cập nguồn tài nguyên này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.",
  showBackButton = true,
  showHomeButton = true,
}: UnauthorizedAccessProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-lg bg-background">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="relative rounded-lg border border-border bg-card p-6 shadow-sm">
              <ShieldX className="w-24 h-24 text-destructive" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-destructive mb-2">403</h1>
          <div className="mx-auto h-1 w-32 rounded-full bg-destructive"></div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-foreground mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          {description}
        </p>

        {/* Additional Info */}
        <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Có thể do các lý do sau:
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>Tài khoản của bạn chưa được cấp quyền truy cập</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>Vai trò của bạn không có quyền xem tài nguyên này</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-destructive rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>Tài nguyên yêu cầu quyền đặc biệt từ quản trị viên</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {showHomeButton && (
            <Button
              asChild
              size="lg"
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Về trang chủ
              </Link>
            </Button>
          )}
          {showBackButton && (
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2"
            >
              <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Quay lại
              </Link>
            </Button>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Cần trợ giúp?{" "}
            <span className="text-destructive hover:text-destructive/80 font-semibold cursor-pointer">
              Liên hệ bộ phận hỗ trợ
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
