import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'vi', 'ja'],
  defaultLocale: 'vi'
});

// Routes that require authentication (without locale prefix)
const protectedRoutes = ['/home', '/admin/dashboard', '/instructor'];

// Routes that should redirect authenticated users (without locale prefix)  
const authRoutes = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extract locale from pathname
  const locale = pathname.split('/')[1];
  const isValidLocale = ['en', 'vi', 'ja'].includes(locale);
  
  // Remove locale from pathname for route checking
  const pathWithoutLocale = isValidLocale ? pathname.slice(3) : pathname;
  
  // Skip middleware for home page (with or without locale)
  if (pathWithoutLocale === '' || pathWithoutLocale === '/') {
    return intlMiddleware(request);
  }
  
  // Check if user is authenticated (has token)
  const token = request.cookies.get('auth-token')?.value;
  const isAuthenticated = !!token;

  // Handle protected routes
  if (protectedRoutes.some(route => pathWithoutLocale.startsWith(route))) {
    if (!isAuthenticated) {
      const signInUrl = new URL(`/${locale}/signin`, request.url);
      signInUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Handle auth routes - redirect authenticated users based on role
  if (authRoutes.some(route => pathWithoutLocale.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
    }
  }

  // Apply intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};