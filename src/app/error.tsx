"use client";

/**
 * Route-level error boundary. Catches any error thrown in a server
 * or client component inside this segment tree and shows a calm
 * branded fallback instead of "missing required error components".
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="th-card-elevated w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Đã có lỗi xảy ra
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Một sự cố không mong muốn vừa xảy ra. Bạn có thể thử lại hoặc quay
          về trang chủ.
        </p>
        {error?.digest ? (
          <p className="mt-3 inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
            ref: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
