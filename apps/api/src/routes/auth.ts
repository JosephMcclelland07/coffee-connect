import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../lib/AppError";
import { database } from "../lib/database";
import { createToken } from "../lib/tokens";
import { createRateLimitMiddleware } from "../middleware/rateLimit";

function validateCredentials(body: unknown, registration: boolean) {
  if (!body || typeof body !== "object") throw new AppError(400, "Invalid request body.");
  const payload = body as Record<string, unknown>;
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = payload.password;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  if (email.length > 255 || !/^[^\s@]+@paconsulting\.com$/.test(email)) {
    throw new AppError(400, "Use your @paconsulting.com email address.");
  }
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new AppError(400, "Password must be at least 12 characters and at most 72 UTF-8 bytes.");
  }
  const [firstName = "", ...remainingNames] = name.split(/\s+/);
  const lastName = remainingNames.join(" ");
  if (registration && (!firstName || firstName.length > 100 || lastName.length > 100)) {
    throw new AppError(400, "Name is required. First and last names must each be at most 100 characters.");
  }
  return { email, password, firstName, lastName };
}

function publicAccount(employee: { employeeId: number; firstName: string; lastName: string; email: string }) {
  return {
    id: employee.employeeId,
    name: `${employee.firstName} ${employee.lastName}`.trim(),
    email: employee.email,
  };
}

const dummyHash = bcrypt.hash("unused-account-timing-padding", 12);

export function createAuthRouter(store: Pick<PrismaClient, "employee"> = database) {
  const authRouter = Router();
  authRouter.use(createRateLimitMiddleware({ windowMs: 60_000, max: 10 }));

  authRouter.post("/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = validateCredentials(req.body, true);
      const passwordHash = await bcrypt.hash(password, 12);
      const employee = await store.employee.create({
        data: { firstName, lastName, email, passwordHash },
        select: { employeeId: true, firstName: true, lastName: true, email: true },
      });
      res.status(201).json({ account: publicAccount(employee), message: "Account created. You can now log in." });
    } catch (error) {
      next(error);
    }
  });

  authRouter.post("/login", async (req, res, next) => {
    try {
      const { email, password } = validateCredentials(req.body, false);
      const employee = await store.employee.findUnique({ where: { email } });
      const matches = await bcrypt.compare(password, employee?.passwordHash ?? await dummyHash);
      if (!employee?.passwordHash || !employee.isActive || !matches) {
        throw new AppError(401, "Invalid email or password.");
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({ token: createToken(employee.employeeId), account: publicAccount(employee) });
    } catch (error) {
      next(error);
    }
  });
  return authRouter;
}

export const authRouter = createAuthRouter();