/**
 * Root 404 page. Without this file, Next.js falls back to a default
 * not-found that doesn't match the rest of the brand.
 */

import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="th-card-elevated w-full max-w-lg rounded-2xl p-10 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Compass className="h-8 w-8" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          404 · Không tìm thấy
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Trang bạn tìm không tồn tại
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Đường dẫn có thể đã thay đổi hoặc nội dung đã được gỡ. Hãy quay về
          trang chủ hoặc khám phá các khóa học của chúng tôi.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/courses">
              <Search className="h-4 w-4" />
              Khám phá khóa học
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
