import "dotenv/config";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;
if (!secret || Buffer.byteLength(secret) < 32) {
  throw new Error("JWT_SECRET must contain at least 32 bytes.");
}

export function createToken(id: number) {
  return jwt.sign({ role: "employee" }, secret!, {
    algorithm: "HS256",
    subject: String(id),
    issuer: "coffee-connect-api",
    audience: "coffee-connect-web",
    expiresIn: "1h",
  });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, secret!, {
    algorithms: ["HS256"],
    issuer: "coffee-connect-api",
    audience: "coffee-connect-web",
  });
  if (typeof payload === "string" || !payload.sub || payload.role !== "employee") {
    throw new Error("Invalid token payload.");
  }
  return { id: payload.sub, role: "employee" as const };
}