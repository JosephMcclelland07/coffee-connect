import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";
import type { AppRole } from "../types/auth";

const VALID_ROLES: AppRole[] = ["employee", "hr_admin"];

/**
 * Authentication stub.
 *
 * Reads user context from headers so the app can be exercised before real auth
 * integration (JWT/session/SSO). Replace this with token verification in prod.
 */
export const authContextMiddleware: RequestHandler = (req, _res, next) => {
  const userId = req.header("x-user-id");
  const userRole = req.header("x-user-role");

  if (!userId || !userRole) {
    next();
    return;
  }

  if (!VALID_ROLES.includes(userRole as AppRole)) {
    next(new AppError(400, `Invalid role '${userRole}'.`));
    return;
  }

  req.user = {
    id: userId,
    role: userRole as AppRole,
  };

  next();
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
