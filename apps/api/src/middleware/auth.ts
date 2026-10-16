import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";
import { database } from "../lib/database";
import { verifyToken } from "../lib/tokens";
import type { PrismaClient } from "@prisma/client";

export function createAuthContextMiddleware(store?: Pick<PrismaClient, "employee">): RequestHandler {
  return async (req, _res, next) => {
    let employeeId = req.session?.employeeId;
    if (!employeeId && req.header("authorization")) {
      const authorization = req.header("authorization")!;
      if (!authorization.startsWith("Bearer ")) { next(new AppError(401, "Invalid authentication token.")); return; }
      try { employeeId = Number(verifyToken(authorization.slice(7)).id); }
      catch (error) { next(error instanceof AppError ? error : new AppError(401, "Invalid or expired authentication token.")); return; }
    }
    if (employeeId) {
      const employee = await (store ?? database()).employee.findUnique({ where: { employeeId },
        include: { hrAdministrator: true, microsoftAccount: { select: { connected: true } } } });
      if (employee?.isActive && (!req.session?.employeeId || employee.microsoftAccount?.connected)) {
        req.user = { id: String(employee.employeeId), role: employee.hrAdministrator ? "hr_admin" : "employee" };
      }
    }
    next();
  };
}

export const authContextMiddleware = createAuthContextMiddleware();

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
