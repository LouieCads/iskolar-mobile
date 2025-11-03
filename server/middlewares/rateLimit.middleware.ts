import { Request, Response, NextFunction } from "express";
import { tooMany } from "./rateLimit.responses";

// Simple in-memory sliding window rate limiter per IP+key
// Not for multi-instance production without a shared store.

type Bucket = { hits: number; windowStart: number };
const buckets: Map<string, Bucket> = new Map();

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



