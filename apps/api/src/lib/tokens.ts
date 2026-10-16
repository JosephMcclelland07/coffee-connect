import jwt from "jsonwebtoken";
import { requiredEnv } from "./config";
import { AppError } from "./AppError";

function tokenSecret() {
  const secret = requiredEnv("JWT_SECRET");
  if (Buffer.byteLength(secret) < 32) throw new AppError(503, "JWT_SECRET must contain at least 32 bytes.");
  return secret;
}

export function createToken(id: number) {
  return jwt.sign({ role: "employee" }, tokenSecret(), {
    algorithm: "HS256",
    subject: String(id),
    issuer: "coffee-connect-api",
    audience: "coffee-connect-web",
    expiresIn: "1h",
  });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, tokenSecret(), {
    algorithms: ["HS256"],
    issuer: "coffee-connect-api",
    audience: "coffee-connect-web",
  });
  if (typeof payload === "string" || !payload.sub || !/^[1-9]\d*$/.test(payload.sub) ||
      !Number.isSafeInteger(Number(payload.sub)) || payload.role !== "employee") {
    throw new Error("Invalid token payload.");
  }
  return { id: payload.sub, role: "employee" as const };
}