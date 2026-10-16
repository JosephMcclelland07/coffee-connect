import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";
import { database } from "../lib/database";

export const authContextMiddleware: RequestHandler = async (req, _res, next) => {
  if (req.session?.employeeId) {
    const employee = await database().employee.findUnique({ where: { employeeId: req.session.employeeId },
      include: { hrAdministrator: true, microsoftAccount: { select: { connected: true } } } });
    if (employee?.isActive && employee.microsoftAccount?.connected) {
      req.user = { id: String(employee.employeeId), role: employee.hrAdministrator ? "hr_admin" : "employee" };
    }
  }
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
