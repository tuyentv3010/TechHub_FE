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
      console.log("🔐 Middleware - Refresh token expired:", isRefreshTokenExpired);
    } catch (error) {
      console.log("🔐 Middleware - Failed to decode refresh token");
      isRefreshTokenExpired = true;
    }
  }
  
  if (accessToken) {
    try {
      const decodedAccess = decodeToken(accessToken);
      const now = Math.round(new Date().getTime() / 1000);
      isAccessTokenExpired = decodedAccess.exp <= now;
      console.log("🔐 Middleware - Access token expired:", isAccessTokenExpired);
    } catch (error) {
      console.log("🔐 Middleware - Failed to decode access token");
      isAccessTokenExpired = true;
    }
  }
  
  // If refresh token is expired, clear cookies and redirect to login
  if (refreshToken && isRefreshTokenExpired && pathname !== "/login") {
    console.log("🔐 Middleware - Refresh token expired, clearing cookies and redirecting to login");
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear cookies when token is expired
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // Redirect authenticated users from login/register pages
  if (refreshToken && !isRefreshTokenExpired && unAuthPaths.some((path) => pathname.startsWith(path))) {
    console.log("🔐 Middleware - Redirecting authenticated user from auth page to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check auth for home page
  if (pathname === "/" && !refreshToken) {
    console.log("🔐 Middleware - Redirecting unauthenticated user from home to /login");
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear any invalid cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }

  // Check auth for protected public pages (courses, learning-paths, blog)
  if (
    authRequiredPaths.some((path) => pathname.startsWith(path)) &&
    !refreshToken
  ) {
    console.log("🔐 Middleware - Redirecting unauthenticated user to /login with redirect:", pathname);
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(url);
    // Clear any invalid cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
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
  
  // If trying to access private path but no valid refresh token, clear cookies and redirect to login
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    (!refreshToken || isRefreshTokenExpired)
  ) {
    console.log("🔐 Middleware - No valid refresh token, clearing cookies and redirecting to login");
    const response = NextResponse.redirect(new URL("/login", request.url));
    // Clear cookies when token is invalid
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
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
