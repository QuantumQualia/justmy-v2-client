import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isNewsHost } from "@/lib/hosts";
import { PROTECTED_SINGLE_SEGMENT_ROUTES } from "@/lib/mycard/handle-route";

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/stripe-callback", // Stripe callback doesn't require auth (handles it internally)
];

/**
 * Check if a pathname is a dynamic handle route (e.g., /john, /jane)
 * Handle routes are single-segment paths that don't match protected routes
 */
function isHandleRoute(pathname: string): boolean {
  // Remove leading slash and check if it's a single segment
  const segments = pathname.split("/").filter(Boolean);

  // Must be exactly one segment (e.g., /john, not /john/something)
  if (segments.length !== 1) {
    return false;
  }

  // Check if it matches any protected single-segment route
  // (e.g., /admin, /dashboard should not be treated as handles)
  const isProtected = PROTECTED_SINGLE_SEGMENT_ROUTES.includes(
    pathname as (typeof PROTECTED_SINGLE_SEGMENT_ROUTES)[number],
  );

  return !isProtected;
}

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith("/embed/")) {
    return true;
  }

  if (pathname === "/news" || pathname.startsWith("/news/")) {
    return true;
  }

  // Check explicit public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  // Check if it's a handle route (dynamic profile page or CMS page)
  if (isHandleRoute(pathname)) {
    return true;
  }

  return false;
}

/**
 * Get the auth token from cookies
 */
function getAuthToken(request: NextRequest): string | null {
  return request.cookies.get("auth_access_token")?.value || null;
}

/** Pass pathname into Server Components via `headers().get("x-pathname")`. */
function nextWithPathname(request: NextRequest, pathname = request.nextUrl.pathname) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function rewriteWithPathname(request: NextRequest, internalPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = internalPath;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", internalPath);
  requestHeaders.set("x-news-host", "1");
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

/**
 * news.justmy.com: only `/` (landing) and `/{marketSlug}` (fallback).
 * Everything else redirects home. Internal App Router paths live under `/news`.
 */
function handleNewsHost(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Canonicalize accidental /news URLs on the news host to public paths
  if (pathname === "/news" || pathname === "/news/") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/news/")) {
    const rest = pathname.slice("/news/".length);
    const slug = rest.split("/").filter(Boolean)[0];
    if (slug) {
      return NextResponse.redirect(new URL(`/${slug}`, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" || pathname === "") {
    return rewriteWithPathname(request, "/news");
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && segments[0]) {
    return rewriteWithPathname(request, `/news/${segments[0]}`);
  }

  return NextResponse.redirect(new URL("/", request.url));
}

/**
 * Authentication Middleware
 * Protects routes except public/auth routes.
 * News host is gated separately and never uses main-app auth redirects.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (isNewsHost(host)) {
    return handleNewsHost(request);
  }

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    const token = getAuthToken(request);
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return nextWithPathname(request);
  }

  // Check authentication for protected routes (everything that's not public)
  const token = getAuthToken(request);

  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    // Add redirect parameter to return to the original page after login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated, allow the request
  return nextWithPathname(request);
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
