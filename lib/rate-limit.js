// Best-effort, per-instance rate limiter for serverless functions. Each warm
// instance has its own memory, so treat this as abuse damping, not a quota.

export function createRateLimiter({ windowMs, max }) {
  const log = new Map();

  /** Returns true when `key` has used up its allowance in the current window. */
  return function isLimited(key, now = Date.now()) {
    for (const [k, times] of log) {
      if (times.every((t) => now - t >= windowMs)) log.delete(k);
    }
    const recent = (log.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) return true; // rejected calls don't extend the block
    log.set(key, [...recent, now]);
    return false;
  };
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
}
