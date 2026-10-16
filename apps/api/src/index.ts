import express from "express";
import { microsoftConfigured } from "./lib/config";
import { sessionMiddleware } from "./lib/session";
import { microsoftAuthRouter } from "./routes/microsoft-auth";
import { calendarRouter } from "./routes/calendar";
import { AppError } from "./lib/AppError";
import { authContextMiddleware, requireAuth } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/logger";
import { notFoundMiddleware } from "./middleware/notFound";
import { createRateLimitMiddleware } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requireRole } from "./middleware/requireRole";
import { validateBody } from "./middleware/validate";
import { authRouter } from "./routes/auth";
import { database } from "./lib/database";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.set("trust proxy", false);

// 1) Attach correlation ID first so all downstream logs/errors include it.
app.use(requestIdMiddleware);

// 2) Log every request with status + latency.
app.use(requestLoggerMiddleware);

// 3) Security and browser integration baseline.
app.use(corsMiddleware());

// 4) Parse JSON/form payloads before route handlers.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// 5) Apply auth context parsing globally. Public routes can still remain unauthenticated.
if (microsoftConfigured()) app.use(sessionMiddleware());
app.use(authContextMiddleware);

// 6) Basic rate limiting for all API routes.
app.use(createRateLimitMiddleware({ windowMs: 60_000, max: 120 }));
app.use("/auth", authRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

app.get("/me", requireAuth, async (req, res, next) => {
  try {
    const employee = await database.employee.findUnique({
      where: { employeeId: Number(req.user!.id) },
      select: { employeeId: true, firstName: true, lastName: true, email: true, isActive: true },
    });
    if (!employee?.isActive) throw new AppError(401, "Account unavailable.");
    res.setHeader("Cache-Control", "no-store");
    res.json({
      account: {
        id: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`.trim(),
        email: employee.email,
      },
      role: req.user!.role,
    });
  } catch (error) {
    next(error);
  }
});

const validateCreateEmployee = validateBody((input) => {
  if (typeof input !== "object" || input === null) {
    throw new Error("Body must be an object.");
  }

  const payload = input as Record<string, unknown>;
  const firstName = payload.firstName;
  const lastName = payload.lastName;
  const email = payload.email;

  if (typeof firstName !== "string" || firstName.trim().length === 0) {
    throw new Error("firstName is required.");
  }

  if (typeof lastName !== "string" || lastName.trim().length === 0) {
    throw new Error("lastName is required.");
  }

  if (typeof email !== "string" || !email.includes("@")) {
    throw new Error("email must be valid.");
  }

  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
  };
});

// Example protected admin route shape for your Employee table flow.
app.post("/employees", requireAuth, requireRole("hr_admin"), validateCreateEmployee, async (req, res, next) => {
  try {
    // TODO: Persist with Prisma once API <-> DB package wiring is completed.
    res.status(201).json({
      employee: req.body,
      createdBy: req.user?.id,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

// Throwing AppError demonstrates controlled error response format.
app.get("/admin/ping", requireAuth, requireRole("hr_admin"), (_req, res) => {
  res.json({ ok: true, scope: "admin" });
});

app.get("/error-demo", () => {
  throw new AppError(400, "Intentional error demo.");
});

// Route miss handler should run after all route registrations.
app.use(notFoundMiddleware);

// Error handler must be registered last.
app.use(errorHandlerMiddleware);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
