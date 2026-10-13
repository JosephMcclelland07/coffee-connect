import type { RequestHandler } from "express";
import { AppError } from "../lib/AppError";

/**
 * Generic body validation middleware.
 *
 * The validator should throw when invalid and return a sanitized payload when valid.
 */
export const validateBody = <T>(validator: (input: unknown) => T): RequestHandler => {
  return (req, _res, next) => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request body.";
      next(new AppError(400, message));
    }
  };
};
