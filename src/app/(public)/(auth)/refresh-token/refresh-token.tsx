"use client";
import { checkAndRefreshToken } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RefreshTokenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPathname = searchParams.get("redirect");
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;

    console.log('[RefreshTokenPage] Starting refresh, redirect to:', redirectPathname);

    checkAndRefreshToken({
      force: true, // Force refresh regardless of token expiry time
      onSuccess: () => {
        console.log('[RefreshTokenPage] Refresh successful, redirecting to:', redirectPathname || "/");
        router.push(redirectPathname || "/");
      },
      onError: () => {
        console.log('[RefreshTokenPage] Refresh failed, redirecting to login');
        // Force full page reload to clear cached user info
        window.location.href = "/login";
      },
    });
  }, [router, redirectPathname]);

  return null; // Don't show anything during refresh
}
