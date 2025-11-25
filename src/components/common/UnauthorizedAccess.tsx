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
    <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-red-50/50 via-orange-50/50 to-yellow-50/50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 rounded-lg">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-full p-6 shadow-2xl">
              <ShieldX className="w-24 h-24 text-red-500" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-red-500 mb-2">403</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full"></div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {description}
        </p>

        {/* Additional Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Có thể do các lý do sau:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>Tài khoản của bạn chưa được cấp quyền truy cập</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>Vai trò của bạn không có quyền xem tài nguyên này</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
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
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg"
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
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Cần trợ giúp?{" "}
            <span className="text-red-500 hover:text-red-600 font-semibold cursor-pointer">
              Liên hệ bộ phận hỗ trợ
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
