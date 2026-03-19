import { Request, Response, NextFunction } from "express";
import { tooMany } from "./rateLimit.responses";

// Simple in-memory sliding window rate limiter per IP+key.
// NOTE: For multi-instance deployments, replace with a Redis-backed store
// (e.g. ioredis + sliding-window-counter) to share state across processes.

type Bucket = { hits: number; windowStart: number };
const buckets: Map<string, Bucket> = new Map();

// Purge expired buckets every 10 minutes to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    // Keep the largest configured window (5 min) as the max TTL guard.
    if (now - bucket.windowStart > 10 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: (req: Request) => string;
}

export function rateLimit(options: RateLimitOptions) {
  const windowMs = Math.max(1000, options.windowMs);
  const max = Math.max(1, options.max);
  const keyFn = options.key ?? ((req) => `${req.ip}`);

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${keyFn(req)}:${req.path}`; // route-specific
    const bucket = buckets.get(key) ?? { hits: 0, windowStart: now };

    if (now - bucket.windowStart >= windowMs) {
      bucket.hits = 0;
      bucket.windowStart = now;
    }

    bucket.hits += 1;
    buckets.set(key, bucket);

    if (bucket.hits > max) {
      res.setHeader("Retry-After", Math.ceil((windowMs - (now - bucket.windowStart)) / 1000));
      return tooMany(res, "Too many requests, please try again later.");
    }

    next();
  };
}



