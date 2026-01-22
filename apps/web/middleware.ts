import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  "/",
  "/login",
  "/register",
];

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
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
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Checking route: ${pathname}`);
  }

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
  
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Protected route ${pathname}, token:`, token ? "exists" : "missing");
  }
  
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    // Add redirect parameter to return to the original page after login
    loginUrl.searchParams.set("redirect", pathname);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] Redirecting to login from ${pathname}`);
    }
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

