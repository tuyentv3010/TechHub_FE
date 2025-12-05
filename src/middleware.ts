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

// Helper function to check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    const now = Math.round(Date.now() / 1000);
    return decoded.exp <= now;
  } catch {
    return true; // If can't decode, treat as expired
  }
}

// Helper function to clear auth cookies and redirect to login
function clearAuthAndRedirect(request: NextRequest, redirectPath?: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  if (redirectPath) {
    loginUrl.searchParams.set("redirect", redirectPath);
  }
  
  const response = NextResponse.redirect(loginUrl);
  // Clear expired cookies
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // Debug logs
  console.log("🔐 Middleware - pathname:", pathname);
  console.log("🔐 Middleware - accessToken exists:", !!accessToken);
  console.log("🔐 Middleware - refreshToken exists:", !!refreshToken);

  // Check if tokens are expired
  const accessTokenExpired = accessToken ? isTokenExpired(accessToken) : true;
  const refreshTokenExpired = refreshToken ? isTokenExpired(refreshToken) : true;
  
  console.log("🔐 Middleware - accessToken expired:", accessTokenExpired);
  console.log("🔐 Middleware - refreshToken expired:", refreshTokenExpired);

  // If both tokens exist but refresh token is expired, clear everything and redirect
  if (refreshToken && refreshTokenExpired) {
    console.log("🔐 Middleware - Refresh token expired, clearing auth");
    // Don't redirect if already on unauth paths
    if (unAuthPaths.some((path) => pathname.startsWith(path))) {
      const response = NextResponse.next();
      response.cookies.delete("accessToken");
      response.cookies.delete("refreshToken");
      return response;
    }
    return clearAuthAndRedirect(request, pathname !== "/" ? pathname : undefined);
  }

  // Redirect authenticated users from login/register pages
  if (refreshToken && !refreshTokenExpired && unAuthPaths.some((path) => pathname.startsWith(path))) {
    console.log("🔐 Middleware - Redirecting authenticated user from auth page to /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check auth for home page
  if (pathname === "/" && !accessToken && !refreshToken) {
    console.log("🔐 Middleware - Redirecting unauthenticated user from home to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check auth for protected public pages (courses, learning-paths, blog)
  if (
    authRequiredPaths.some((path) => pathname.startsWith(path)) &&
    !accessToken &&
    !refreshToken
  ) {
    console.log("🔐 Middleware - Redirecting unauthenticated user to /login with redirect:", pathname);
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Handle private paths - if access token expired but refresh token valid, go to refresh
  if (privatePaths.some((path) => pathname.startsWith(path))) {
    if (!accessToken && !refreshToken) {
      return clearAuthAndRedirect(request, pathname);
    }
    if (accessTokenExpired && refreshToken && !refreshTokenExpired) {
      const url = new URL("/refresh-token", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Role-based access control
  if (accessToken && !accessTokenExpired) {
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
