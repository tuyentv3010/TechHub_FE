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
    console.log(pathName);
    if (UNAUTHENTICATED_PATH.includes(pathName)) return;
    
    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          // Force full page reload to clear cached user info
          window.location.href = "/login";
        },
        force,
      });
    };
    
    // Check immediately on mount
    onRefreshToken();
    
    // Check every 5 seconds (5000ms)
    const interval = setInterval(() => {
      onRefreshToken();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pathName, router]);

  return null;
}
