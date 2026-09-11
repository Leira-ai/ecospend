import { ApiError } from "./http";

interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

/** Best-effort per-instance limiter; deployments should add a shared edge/store limiter. */
export function enforceRateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) throw new ApiError(429, "rate_limited", "Too many requests; try again later");
  bucket.count += 1;
  if (buckets.size > 10_000) {
    for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
  }
}

export function getRateLimitHeaders(key: string, limit: number): Record<string, string> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return {
      "RateLimit-Limit": String(limit),
      "RateLimit-Remaining": String(limit),
      "RateLimit-Reset": "0",
    };
  }
  const remaining = Math.max(0, limit - bucket.count);
  const resetSeconds = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
  return {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(remaining),
    "RateLimit-Reset": String(resetSeconds),
  };
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
