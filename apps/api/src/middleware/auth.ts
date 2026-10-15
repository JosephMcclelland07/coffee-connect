import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";
import { verifyToken } from "../lib/tokens";

export const authContextMiddleware: RequestHandler = (req, _res, next) => {
  const authorization = req.header("authorization");
  if (!authorization) {
    next();
    return;
  }
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  try {
    if (!match) throw new Error("Invalid authorization header.");
    req.user = verifyToken(match[1]);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token."));
  }
};

/**
 * Enforces that the request has an authenticated user context.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, "Authentication required."));
    return;
  }

  next();
};
