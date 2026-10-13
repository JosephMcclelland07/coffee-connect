import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";
import type { AppRole } from "../types/auth";

/**
 * Authorization guard for role-based routes.
 */
export const requireRole = (...allowedRoles: AppRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "Authentication required."));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission to access this resource."));
      return;
    }

    next();
  };
};
