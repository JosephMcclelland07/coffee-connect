import express from "express";
import { AppError } from "./lib/AppError";
import { prisma } from "./lib/prisma";
import { authContextMiddleware, requireAuth } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { errorHandlerMiddleware } from "./middleware/errorHandler";
import { requestLoggerMiddleware } from "./middleware/logger";
import { notFoundMiddleware } from "./middleware/notFound";
import { createRateLimitMiddleware } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { requireRole } from "./middleware/requireRole";
import { validateBody } from "./middleware/validate";



const app = express();
const port = Number(process.env.PORT) || 4000;

// If deployed behind a proxy/load balancer, this helps express derive req.ip correctly.
app.set("trust proxy", true);

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
app.use(authContextMiddleware);

// 6) Basic rate limiting for all API routes.
app.use(createRateLimitMiddleware({ windowMs: 60_000, max: 120 }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

app.get("/me", requireAuth, (req, res) => {
  res.json({
    id: req.user?.id,
    role: req.user?.role,
    requestId: req.requestId,
  });
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

app.get("/employees", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const employees = await prisma.employee.findMany({
    orderBy: { employeeId: "asc" },
  });

  res.json({ employees, requestId: req.requestId });
});

app.get("/interests", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const interests = await prisma.interest.findMany({
    include: {
      employees: {
        include: {
          employee: {
            select: { employeeId: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
    orderBy: { interestId: "asc" },
    take: 100,
  });

  res.json({ interests, requestId: req.requestId });
});

app.get("/matches", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const matches = await prisma.match.findMany({
    include: {
      employeeOne: {
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      },
      employeeTwo: {
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      },
      meetings: true,
    },
    orderBy: { matchId: "asc" },
    take: 100,
  });

  res.json({ matches, requestId: req.requestId });
});

app.get("/employee-interests", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const employeeInterests = await prisma.employeeInterest.findMany({
    include: {
      employee: {
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      },
      interest: true,
    },
    orderBy: { employeeInterestId: "asc" },
    take: 100,
  });

  res.json({ employeeInterests, requestId: req.requestId });
});

app.get("/notifications", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const notifications = await prisma.notification.findMany({
    include: {
      employee: {
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { notificationId: "asc" },
    take: 100,
  });

  res.json({ notifications, requestId: req.requestId });
});

app.get("/hr-administrators", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const administrators = await prisma.hRAdministrator.findMany({
    include: {
      employee: {
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { adminId: "asc" },
    take: 100,
  });

  res.json({ administrators, requestId: req.requestId });
});

app.get("/meetings", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const meetings = await prisma.meeting.findMany({
    include: {
      match: {
        include: {
          employeeOne: {
            select: { employeeId: true, firstName: true, lastName: true, email: true },
          },
          employeeTwo: {
            select: { employeeId: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
    orderBy: { meetingId: "asc" },
    take: 100,
  });

  res.json({ meetings, requestId: req.requestId });
});

app.get("/employees/:employeeId", requireAuth, requireRole("hr_admin"), async (req, res) => {
  const employeeId = Number(req.params.employeeId);
  if (!Number.isSafeInteger(employeeId) || employeeId < 1) {
    throw new AppError(400, "employeeId must be a positive integer.");
  }

  const employee = await prisma.employee.findUnique({ where: { employeeId } });
  if (!employee) {
    throw new AppError(404, "Employee not found.");
  }

  res.json({ employee, requestId: req.requestId });
});

app.post("/employees", requireAuth, requireRole("hr_admin"), validateCreateEmployee, async (req, res) => {
  const employee = await prisma.employee.create({ data: req.body });
  res.status(201).json({
    employee,
    createdBy: req.user?.id,
    requestId: req.requestId,
  });
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
