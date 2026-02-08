import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface FailedLoginEntry {
  attempts: number;
  lockedUntil: number | null;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const failedLoginMap = new Map<string, FailedLoginEntry>();

const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  options: { windowMs: number; maxAttempts: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxAttempts - 1 };
  }

  entry.count++;

  if (entry.count > options.maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: options.maxAttempts - entry.count };
}

export function recordFailedLogin(email: string): void {
  const entry = failedLoginMap.get(email) || { attempts: 0, lockedUntil: null };
  entry.attempts++;

  if (entry.attempts >= LOCKOUT_MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }

  failedLoginMap.set(email, entry);
}

export function isAccountLocked(email: string): boolean {
  const entry = failedLoginMap.get(email);
  if (!entry || !entry.lockedUntil) return false;

  if (Date.now() > entry.lockedUntil) {
    failedLoginMap.delete(email);
    return false;
  }

  return true;
}

export function clearFailedLogins(email: string): void {
  failedLoginMap.delete(email);
}
