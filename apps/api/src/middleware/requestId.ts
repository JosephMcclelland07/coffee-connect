import type { RequestHandler } from "express";
import crypto from "node:crypto";

/**
 * Adds a request correlation ID to every incoming request.
 *
 * Priority:
 * 1) Respect a client-provided x-request-id when present.
 * 2) Otherwise generate a server-side UUID.
 */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const existing = req.header("x-request-id");
  req.requestId = existing && existing.trim().length > 0 ? existing : crypto.randomUUID();

  // Echo request ID so clients can include it in bug reports/support tickets.
  res.setHeader("x-request-id", req.requestId);
  next();
};
