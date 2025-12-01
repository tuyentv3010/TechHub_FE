import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "@/lib/utils";
import { Role } from "@/constants/type";
import { RoleType } from "@/types/jwt.types";

const guestPath = ["/guest"];
const unAuthPaths = ["/login", "/register", "/forgot-password", "/verify-email"];
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

  // Redirect authenticated users from login/register pages
  if (refreshToken && unAuthPaths.some((path) => pathname.startsWith(path))) {
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

  // Handle private paths
  if (
    privatePaths.some((path) => pathname.startsWith(path)) &&
    !accessToken &&
    refreshToken
  ) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
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
