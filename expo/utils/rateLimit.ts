/**
 * Simple in-memory rate limiter for API routes.
 * Limits requests per IP using a fixed window.
 * State resets on server restart — acceptable for this use case.
 */

interface WindowEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, WindowEntry>();

// Clean up stale entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key);
  });
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in seconds */
  windowSec: number;
  /** Prefix to namespace different endpoints */
  prefix: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  ip: string,
  opts: RateLimitOptions
): RateLimitResult {
  cleanup();

  const key = `${opts.prefix}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  // No entry or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowSec * 1000;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.max - 1, resetAt };
  }

  // Within window
  if (entry.count < opts.max) {
    entry.count++;
    return { allowed: true, remaining: opts.max - entry.count, resetAt: entry.resetAt };
  }

  // Over limit
  return { allowed: false, remaining: 0, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    }
  );
}
