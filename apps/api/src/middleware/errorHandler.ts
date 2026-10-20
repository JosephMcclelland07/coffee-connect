import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/AppError";

type DatabaseLikeError = Error & {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  type?: string;
};

/**
 * Maps known DB/framework errors to stable API responses.
 *
 * Includes:
 * - Prisma error codes when Prisma client is used (e.g. P2002/P2003)
 * - Native MySQL driver codes (e.g. ER_DUP_ENTRY / FK errors)
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, req, res, _next) => {
  const error = err as DatabaseLikeError;

  if (error.type === "entity.parse.failed" || error.type === "entity.too.large") {
    res.status(error.type === "entity.too.large" ? 413 : 400).json({
      error: error.type === "entity.too.large" ? "Request body is too large." : "Invalid JSON request body.",
      requestId: req.requestId,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      requestId: req.requestId,
      details: error.details,
    });
    return;
  }

  // Prisma unique constraint failure.
  if (error.code === "P2002") {
    res.status(409).json({
      error: "A unique constraint would be violated by this request.",
      requestId: req.requestId,
    });
    return;
  }

  // Prisma foreign-key failure.
  if (error.code === "P2003") {
    res.status(400).json({
      error: "Foreign key constraint failed.",
      requestId: req.requestId,
    });
    return;
  }

  // MySQL duplicate entry.
  if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
    res.status(409).json({
      error: "A record with the same unique value already exists.",
      requestId: req.requestId,
    });
    return;
  }

  // MySQL foreign key violations.
  if (error.code === "ER_NO_REFERENCED_ROW_2" || error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1452 || error.errno === 1451) {
    res.status(400).json({
      error: "Request violates a foreign key constraint.",
      requestId: req.requestId,
    });
    return;
  }

  console.error("Unhandled error", {
    requestId: req.requestId,
    message: error?.message,
    code: error?.code,
    stack: error?.stack,
  });

  res.status(500).json({
    error: "Internal server error.",
    requestId: req.requestId,
  });
};
