import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;

export const AUTH_COOKIE = "auth_token";

interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function signToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role } as TokenPayload,
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  // Try cookie first
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  // Fall back to Authorization header
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const token = cookieToken || headerToken;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true },
  });

  return user;
}

export async function requireAuth(
  req: NextRequest,
  options?: { roles?: Role[] }
): Promise<AuthUser> {
  const user = await getAuthUser(req);

  if (!user) {
    throw new AuthError("Authentication required", 401);
  }

  if (options?.roles && !options.roles.includes(user.role)) {
    throw new AuthError("Insufficient permissions", 403);
  }

  return user;
}

export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}
