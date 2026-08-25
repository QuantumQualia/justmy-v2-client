import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isNewsHost } from "@/lib/hosts";
import { PROTECTED_SINGLE_SEGMENT_ROUTES } from "@/lib/mycard/handle-route";
import { isEmailVerificationExemptPath } from "@/lib/auth/email-verification";
import { isBusinessOs } from "@/lib/os-types";

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/stripe-callback",
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

/** Logged-in users are verified only when the cookie explicitly says so. */
function isEmailVerified(request: NextRequest): boolean {
  return readAuthUser(request)?.emailVerified === true;
}

function isBizCookieUser(request: NextRequest): boolean {
  const user = readAuthUser(request);
  return isBusinessOs(user?.osName || user?.profileType);
}

function readAuthUser(request: NextRequest): {
  emailVerified?: boolean;
  osName?: string;
  profileType?: string;
} | null {
  const raw = request.cookies.get("auth_user")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}

function redirectToVerifyEmail(request: NextRequest, explicitRedirect?: string | null) {
  const url = new URL("/verify-email", request.url);
  const { pathname, search } = request.nextUrl;
  let next = (explicitRedirect || "").trim();
  if (
    !next &&
    !isEmailVerificationExemptPath(pathname) &&
    pathname !== "/login" &&
    pathname !== "/register"
  ) {
    next = `${pathname}${search}`;
  }
  if (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/verify-email")) {
    url.searchParams.set("redirect", next);
  }
  return NextResponse.redirect(url);
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
 * App routes that must render even when the request Host is a news host.
 * Locally NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_NEWS_HOSTS can be the same
 * origin (127.0.0.1), so claim/verify/onboard would otherwise 302 to `/`.
 */
function isNewsHostAppPassthrough(pathname: string): boolean {
  const prefixes = [
    "/verify-email",
    "/biz-os",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/stripe-callback",
    "/dashboard",
    "/admin",
    "/account",
    "/lab",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * news.justmy.com: `/` and `/news` serve the dual-mode news page.
 * Legacy `/{slug}` and `/news/{slug}` redirect to `/`.
 * Returns null so the main proxy can auth-check app routes on this host.
 */
function handleNewsHost(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || pathname === "") {
    return rewriteWithPathname(request, "/news");
  }

  if (pathname === "/news" || pathname === "/news/") {
    return nextWithPathname(request, "/news");
  }

  // Legacy slug paths → home (zip preference lives in storage, not the URL)
  if (pathname.startsWith("/news/")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isNewsHostAppPassthrough(pathname)) {
    return null;
  }

  // Public myCARD / CMS handles (`/acme-coffee`). Legacy news slugs used this
  // path and now live at `/`; do not 302 those handles away.
  if (isHandleRoute(pathname)) {
    return null;
  }

  return NextResponse.redirect(new URL("/", request.url));
}

/**
 * Authentication proxy for the whole platform (City OS, Biz OS, admin).
 * News host only rewrites `/` → `/news`; app routes still use this gate.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (isNewsHost(host)) {
    const newsResponse = handleNewsHost(request);
    if (newsResponse) return newsResponse;
  }

  const { pathname } = request.nextUrl;
  const token = getAuthToken(request);
  const unverified = Boolean(token) && !isEmailVerified(request);

  if (unverified && !isPublicRoute(pathname) && !isEmailVerificationExemptPath(pathname)) {
    return redirectToVerifyEmail(request);
  }

  if (isPublicRoute(pathname)) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      if (unverified) {
        return redirectToVerifyEmail(request, request.nextUrl.searchParams.get("redirect"));
      }
      if (isBizCookieUser(request)) {
        return NextResponse.redirect(new URL("/biz-os", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return nextWithPathname(request);
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return nextWithPathname(request);
}

/**
 * Configure which routes the proxy should run on
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
