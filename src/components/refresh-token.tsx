"use client";

// import authApiRequest from "@/apiRequests/auth";
// import socket from "@/lib/socket";
import {
  checkAndRefreshToken,
  removeTokenFromLocalStorage,
} from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Nhung page sau se khong check refresh token
const UNAUTHENTICATED_PATH = ["/login", "/logout", "/refresh-token", "/register", "/forgot-password", "/verify-email"];
const AUTH_GATED_PATH = ["/manage", "/guest", "/courses", "/learning-paths", "/blog"];

const pathStartsWith = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export default function RefreshToken() {
  const pathName = usePathname();

  useEffect(() => {
    console.log('[RefreshToken] useEffect triggered, pathname:', pathName);
    if (pathStartsWith(pathName, UNAUTHENTICATED_PATH)) {
      console.log('[RefreshToken] Skipping - unauthenticated path');
      return;
    }

    const shouldRedirectToLogin = pathStartsWith(pathName, AUTH_GATED_PATH);
    
    const onRefreshToken = (force?: boolean) => {
      console.log('[RefreshToken] Checking token...', { force });
      checkAndRefreshToken({
        onError: () => {
          console.log('[RefreshToken] Token check failed');
          removeTokenFromLocalStorage();
          window.dispatchEvent(new Event("auth-logout"));

          if (shouldRedirectToLogin) {
            window.location.replace("/login");
          }
        },
        redirectOnError: shouldRedirectToLogin,
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
  }, [pathName]);

  return null;
}
