import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decodeToken } from "@/lib/utils";

const guestPaths = ["/guest"];
const unAuthPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/oauth2"];
const managePaths = ["/manage"];
const privatePaths = [...managePaths, ...guestPaths];

const pathStartsWith = (pathname: string, paths: string[]) =>
  paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

// Only genuinely private areas require login. Public browsing (home, course
// listing, learning paths, blog, about/contact, legal) stays open for SEO,
// sharing and the sign-up funnel. Personalised pages stay gated:
//   - /manage, /guest (role areas)
//   - /courses/{id}/learn (actual lesson content)
//   - /my-learning, /recommendations (per-user)
const isAuthRequiredPath = (pathname: string) =>
  pathStartsWith(pathname, privatePaths) ||
  /^\/courses\/[^/]+\/learn(?:\/.*)?$/.test(pathname) ||
  pathname === "/my-learning" ||
  pathname.startsWith("/my-learning/") ||
  pathname === "/recommendations" ||
  pathname.startsWith("/recommendations/");

const isTokenExpired = (token?: string) => {
  if (!token) return false;

  try {
    const decoded = decodeToken(token);
    const now = Math.round(Date.now() / 1000);
    return !decoded?.exp || decoded.exp <= now;
  } catch {
    return true;
  }
};

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
  response.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
  response.cookies.set("authStorageMode", "", { path: "/", maxAge: 0 });
  return response;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const isRefreshTokenExpired = isTokenExpired(refreshToken);
  const isAccessTokenExpired = isTokenExpired(accessToken);
  const authRequired = isAuthRequiredPath(pathname);

  if (refreshToken && isRefreshTokenExpired && pathname !== "/login") {
    const response = authRequired
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();
    return clearAuthCookies(response);
  }

  if (refreshToken && !isRefreshTokenExpired && (!accessToken || isAccessTokenExpired)) {
    if (
      pathStartsWith(pathname, unAuthPaths) ||
      pathname === "/refresh-token"
    ) {
      return NextResponse.next();
    }

    if (!authRequired) {
      return NextResponse.next();
    }

    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthenticated = Boolean(
    accessToken && !isAccessTokenExpired && refreshToken && !isRefreshTokenExpired
  );

  if (isAuthenticated && pathStartsWith(pathname, unAuthPaths)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    authRequired &&
    (!accessToken || isAccessTokenExpired) &&
    refreshToken &&
    !isRefreshTokenExpired
  ) {
    const url = new URL("/refresh-token", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (
    authRequired &&
    (!refreshToken || isRefreshTokenExpired)
  ) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return clearAuthCookies(NextResponse.redirect(url));
  }

  if (accessToken) {
    try {
      const decoded = decodeToken(accessToken);
      const roles = decoded?.roles ?? (decoded?.role ? [decoded.role] : []);
      const isGuest = roles.includes("GUEST");
      const isGuestGoToManagePath =
        isGuest && pathStartsWith(pathname, managePaths);
      const isNotGuestGoToGuestPath =
        !isGuest && pathStartsWith(pathname, guestPaths);

      if (isGuestGoToManagePath || isNotGuestGoToGuestPath) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return clearAuthCookies(NextResponse.redirect(new URL("/login", request.url)));
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
    "/guest/:path*",
    "/courses/:path*",
    "/my-learning/:path*",
    "/recommendations/:path*",
    "/learning-paths/:path*",
    "/blog/:path*",
  ],
};
