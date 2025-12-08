import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "@/lib/utils";
import { Role } from "@/constants/type";
import { RoleType } from "@/types/jwt.types";

const guestPath = ["/guest"];
const unAuthPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/oauth2"];
const managePaths = ["/manage"];
const authRequiredPaths = ["/courses", "/learning-paths", "/blog"];
const privatePaths = [...managePaths, ...guestPath];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Debug logs
  console.log("🔐 Middleware - pathname:", pathname);
  console.log("🔐 Middleware - accessToken exists:", !!accessToken);
  console.log("🔐 Middleware - refreshToken exists:", !!refreshToken);

  // Check if refresh token is expired
  let isRefreshTokenExpired = false;
  let isAccessTokenExpired = false;
  
  if (refreshToken) {
    try {
      const decodedRefresh = decodeToken(refreshToken);
      const now = Math.round(new Date().getTime() / 1000);
      isRefreshTokenExpired = decodedRefresh.exp <= now;
      console.log("🔐 Middleware - Refresh token:", {
        expired: isRefreshTokenExpired,
        exp: decodedRefresh.exp,
        expDate: new Date(decodedRefresh.exp * 1000).toISOString(),
        now: now,
        nowDate: new Date(now * 1000).toISOString(),
        timeLeftSeconds: decodedRefresh.exp - now,
      });
    } catch (error) {
      console.log("🔐 Middleware - Failed to decode refresh token:", error);
      isRefreshTokenExpired = true;
    }
  }
  
  if (accessToken) {
    try {
      const decodedAccess = decodeToken(accessToken);
      const now = Math.round(new Date().getTime() / 1000);
      isAccessTokenExpired = decodedAccess.exp <= now;
      console.log("🔐 Middleware - Access token:", {
        expired: isAccessTokenExpired,
        exp: decodedAccess.exp,
        expDate: new Date(decodedAccess.exp * 1000).toISOString(),
        now: now,
        nowDate: new Date(now * 1000).toISOString(),
        timeLeftSeconds: decodedAccess.exp - now,
        role: decodedAccess.role,
      });
    } catch (error) {
      console.log("🔐 Middleware - Failed to decode access token:", error);
      isAccessTokenExpired = true;
    }
  }
  
  // If refresh token is expired, redirect to logout
  if (refreshToken && isRefreshTokenExpired && pathname !== "/login" && pathname !== "/logout") {
    console.log("🔐 Middleware - Refresh token expired, redirecting to logout");
    const response = NextResponse.redirect(new URL("/logout", request.url));
    response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
    response.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
    return response;
  }

  // Nếu có refreshToken còn hạn NHƯNG không có accessToken -> redirect về /logout
  // Vì không có accessToken thì không thể gọi API được
  if (refreshToken && !isRefreshTokenExpired && (!accessToken || isAccessTokenExpired)) {
    console.log("🔐 Middleware - Has refreshToken but accessToken missing/expired, redirecting to logout");
    // Nếu đang ở /login hoặc /logout thì cho qua
    if (pathname === "/login" || pathname === "/logout") {
      const response = NextResponse.next();
      response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
      response.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
      return response;
    }
    const response = NextResponse.redirect(new URL("/logout", request.url));
    response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
    response.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
    return response;
  }

  // isAuthenticated = có CẢ accessToken VÀ refreshToken còn hạn
  const isAuthenticated = accessToken && !isAccessTokenExpired && refreshToken && !isRefreshTokenExpired;
  console.log("🔐 Middleware - isAuthenticated:", isAuthenticated);

  // Redirect authenticated users from login/register pages to HOME
  if (isAuthenticated && unAuthPaths.some((path) => pathname.startsWith(path))) {
    console.log("🔐 Middleware - Redirecting authenticated user from auth page to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check auth for home page - nếu chưa login thì redirect về /logout
  if (pathname === "/" && !isAuthenticated) {
    console.log("🔐 Middleware - Redirecting unauthenticated user from home to /logout");
    return NextResponse.redirect(new URL("/logout", request.url));
  }

  // Check auth for protected public pages (courses, learning-paths, blog)
  if (
    authRequiredPaths.some((path) => pathname.startsWith(path)) &&
    !refreshToken
  ) {
    console.log("🔐 Middleware - Redirecting unauthenticated user to /logout with redirect:", pathname);
    const url = new URL("/logout", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Handle private paths - redirect to refresh if access token missing/expired but refresh token valid
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    (!accessToken || isAccessTokenExpired) &&
    refreshToken &&
    !isRefreshTokenExpired
  ) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  
  // If trying to access private path but no valid refresh token, redirect to login
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    (!refreshToken || isRefreshTokenExpired)
  ) {
    console.log("🔐 Middleware - No valid refresh token, redirecting to logout");
    return NextResponse.redirect(new URL("/logout", request.url));
  }

  // Role-based access control
  if (accessToken) {
    const decoded = decodeToken(accessToken);
    const role = decoded.role;
    const isGuestGoToManagePath =
      role === "GUEST" &&
      managePaths.some((path) => pathname.startsWith(path));
    const isNotGuestGoToGuestPath =
      role !== "GUEST" &&
      guestPath.some((path) => pathname.startsWith(path));

    if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/manage/:path*",
    "/login",
    "/logout",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/",
    "/guest/:path*",
    "/courses/:path*",
    "/learning-paths/:path*",
    "/blog/:path*",
  ],
};
