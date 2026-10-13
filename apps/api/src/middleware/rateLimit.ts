import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter.
 *
 * Suitable for dev/single-instance deployments. For horizontally scaled services,
 * use a distributed store (e.g. Redis) so limits are shared across instances.
 */
export const createRateLimitMiddleware = ({ windowMs, max }: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, Bucket>();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.requestId;

    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(max - bucket.count, 0);
    res.setHeader("x-ratelimit-limit", String(max));
    res.setHeader("x-ratelimit-remaining", String(remaining));
    res.setHeader("x-ratelimit-reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      next(new AppError(429, "Too many requests. Please try again later."));
      return;
    }

    next();
  };
};
