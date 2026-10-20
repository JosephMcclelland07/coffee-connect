import { config } from "dotenv";
import { resolve } from "node:path";
import { AppError } from "./AppError";

config({ path: resolve(__dirname, "../../../../.env"), quiet: true });
config({ path: resolve(__dirname, "../../../../packages/db/.env"), quiet: true });

export function microsoftConfigured(): boolean {
  return ["MICROSOFT_TENANT_ID", "MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_REDIRECT_URI",
    "SESSION_SECRET", "TOKEN_ENCRYPTION_KEY", "DATABASE_URL"].every((key) => Boolean(process.env[key]));
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new AppError(503, `Server configuration is missing ${name}.`);
  return value;
}

export const webOrigin = () => new URL(process.env.WEB_ORIGIN ?? "http://localhost:3000").origin;