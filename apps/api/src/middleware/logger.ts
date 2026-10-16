import type { RequestHandler } from "express";

/**
 * Lightweight request logger.
 *
 * Logs method, path, status code, request ID and duration after response completes.
 * This keeps logs tied to actual outcomes instead of request start only.
 */
export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${durationMs}ms requestId=${req.requestId}`
    );
  });

  next();
};
