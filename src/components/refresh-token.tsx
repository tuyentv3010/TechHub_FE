"use client";

// import authApiRequest from "@/apiRequests/auth";
// import socket from "@/lib/socket";
import {
  checkAndRefreshToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  setAccessTokenToLocalStorage,
  setRefreshTokenToLocalStorage,
} from "@/lib/utils";
import jwt from "jsonwebtoken";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Nhung page sau se khong check refresh token
const UNAUTHENTICATED_PATH = ["/login", "logout", "refresh-token"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.log('[RefreshToken] useEffect triggered, pathname:', pathName);
    if (UNAUTHENTICATED_PATH.includes(pathName)) {
      console.log('[RefreshToken] Skipping - unauthenticated path');
      return;
    }
    
    const onRefreshToken = (force?: boolean) => {
      console.log('[RefreshToken] Checking token...', { force });
      checkAndRefreshToken({
        onError: () => {
          console.log('[RefreshToken] Token check failed, redirecting to login');
          // Force full page reload to clear cached user info
          window.location.href = "/login";
        },
        force,
      });
    };
    
    // Check immediately on mount
    console.log('[RefreshToken] Initial token check');
    onRefreshToken();
    
    // Check every 5 seconds (5000ms)
    console.log('[RefreshToken] Setting up interval check every 5 seconds');
    const interval = setInterval(() => {
      console.log('[RefreshToken] Interval check triggered');
      onRefreshToken();
    }, 5000);
    
    return () => {
      console.log('[RefreshToken] Cleanup - clearing interval');
      clearInterval(interval);
    };
  }, [pathName, router]);

  return null;
}
