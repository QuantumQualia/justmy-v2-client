import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/stripe-callback", // Stripe callback doesn't require auth (handles it internally)
];

/**
 * Protected single-segment routes that should never be treated as handles
 * These are routes that require authentication and are single segments
 * (e.g., /admin, /dashboard - not /api which is already excluded by matcher)
 */
const protectedSingleSegmentRoutes = [
  "/admin",
  "/dashboard",
  "/mycard"
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
  const isProtected = protectedSingleSegmentRoutes.includes(pathname);

  return !isProtected;
}

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  // Check explicit public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return true;
  }

  // Check if it's a handle route (dynamic profile page)
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

/**
 * Authentication Middleware
 * Protects routes except public/auth routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (isPublicRoute(pathname)) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    const token = getAuthToken(request);
    if (token && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
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
  return NextResponse.next();
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

