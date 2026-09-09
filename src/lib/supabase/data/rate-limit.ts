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

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
