import type { RequestHandler } from "express";

/**
 * Minimal CORS middleware for local development and simple deployments.
 *
 * For stricter production policies, switch to the `cors` package and explicitly
 * enumerate allowed origins per environment.
 */
export const corsMiddleware = (): RequestHandler => {
  const allowOrigin = process.env.CORS_ORIGIN || "*";

  return (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id, x-user-id, x-user-role");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  };
};
