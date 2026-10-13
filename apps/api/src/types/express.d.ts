import type { AuthUser } from "./auth";

declare global {
  namespace Express {
    interface Request {
      /**
       * Correlation ID attached at the edge of the request lifecycle.
       * Used to join app logs, errors, and client reports for the same request.
       */
      requestId: string;

      /**
       * Authenticated user context set by auth middleware.
       * Optional because public routes will not always have a user.
       */
      user?: AuthUser;
    }
  }
}

export {};
