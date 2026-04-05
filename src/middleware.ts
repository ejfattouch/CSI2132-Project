import { NextRequest, NextResponse } from "next/server";

// Define route protections
const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["admin"],
  "/employee": ["employee", "admin"],
  "/reports": ["customer", "employee", "admin"],
  "/browse-hotels": ["customer"],
  "/bookings": ["customer"],
  "/workflows": ["employee", "admin"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets
  if (
    pathname === "/auth/sign-in" ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next();
  }

  // Check if we have a session cookie (just check existence, not validation)
  const sessionCookie = request.cookies.get("ehotels_session");
  const hasSession = !!sessionCookie?.value;

  // Check if route is protected
  let isProtected = false;

  for (const protectedPath of Object.keys(PROTECTED_ROUTES)) {
    if (pathname.startsWith(protectedPath)) {
      isProtected = true;
      break;
    }
  }

  // Also protect API routes (except auth routes)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    isProtected = true;
  }

  if (!isProtected) {
    return NextResponse.next();
  }

  // No session - redirect to sign-in
  if (!hasSession) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url));
  }

  // Session exists, let the request through
  // Role validation happens at the page/API level
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
