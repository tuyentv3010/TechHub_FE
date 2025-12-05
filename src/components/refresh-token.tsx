"use client";

import {
  checkAndRefreshToken,
  getAccessTokenFromLocalStorage,
  getRefreshTokenFromLocalStorage,
  removeTokenFromLocalStorage,
  decodeToken,
} from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

// Pages that don't require auth check
const UNAUTHENTICATED_PATH = ["/login", "/logout", "/refresh-token", "/register", "/forgot-password", "/verify-email"];

export default function RefreshToken() {
  const pathName = usePathname();
  const router = useRouter();

  const handleLogout = useCallback(() => {
    console.log("🔐 RefreshToken - Token expired, logging out");
    removeTokenFromLocalStorage();
    // Clear cookies by calling logout API or redirect
    router.push("/login");
    // Force page reload to clear any cached state
    window.location.href = "/login";
  }, [router]);

  useEffect(() => {
    // Skip check for unauthenticated paths
    if (UNAUTHENTICATED_PATH.some(path => pathName.startsWith(path))) {
      return;
    }

    // Check if tokens exist and are valid
    const accessToken = getAccessTokenFromLocalStorage();
    const refreshToken = getRefreshTokenFromLocalStorage();

    // If no tokens at all, redirect to login
    if (!accessToken && !refreshToken) {
      console.log("🔐 RefreshToken - No tokens found, redirecting to login");
      router.push("/login");
      return;
    }

    // Check if refresh token is expired
    if (refreshToken) {
      try {
        const decoded = decodeToken(refreshToken);
        const now = Math.round(Date.now() / 1000);
        if (decoded.exp <= now) {
          console.log("🔐 RefreshToken - Refresh token expired");
          handleLogout();
          return;
        }
      } catch (error) {
        console.log("🔐 RefreshToken - Error decoding refresh token:", error);
        handleLogout();
        return;
      }
    }

    // Call refresh token check
    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          console.log("🔐 RefreshToken - checkAndRefreshToken error");
          handleLogout();
        },
        force,
      });
    };

    // Initial check
    onRefreshToken();

    // Set up interval to periodically check token
    const interval = setInterval(() => {
      onRefreshToken();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [pathName, router, handleLogout]);

  return null;
}
