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
    let interval: any = null;
    //Phai goi lan dau tien vi interval se chay sau thoi gian time out
    const onRefreshToken = (force?: boolean) => {
      checkAndRefreshToken({
        onError: () => {
          clearInterval(interval);
          router.push("/login");
        },
        force,
      });
    };
    onRefreshToken();
  }, [pathName, router]);

  return null;
}
