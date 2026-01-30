import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("__session");

  // Protect /journal and /app routes
  if (
    request.nextUrl.pathname.startsWith("/journal") ||
    request.nextUrl.pathname.startsWith("/app")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  // Redirect /signin and /signup to /app if already logged in
  if (
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/signup")
  ) {
    if (session) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/journal/:path*", "/app/:path*", "/signin", "/signup"],
};
