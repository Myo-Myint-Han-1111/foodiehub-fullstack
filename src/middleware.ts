import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/kitchen": ["KITCHEN", "ADMIN"],
  "/counter": ["COUNTER", "ADMIN"],
  "/server": ["SERVER", "ADMIN"],
};

function decodeJwtPayload(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Find matching protected route
  const matchedRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check expiry
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check role
  const allowedRoles = PROTECTED_ROUTES[matchedRoute];
  if (payload.role && !allowedRoles.includes(payload.role)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*", "/counter/:path*", "/server/:path*"],
};
