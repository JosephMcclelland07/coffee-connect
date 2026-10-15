import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(__dirname, "../../../../.env") });
loadEnv({ path: resolve(__dirname, "../../../../packages/db/.env") });

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to start the API.");
}

const parsedUrl = new URL(databaseUrl);
if (parsedUrl.protocol !== "mysql:" || !parsedUrl.pathname.slice(1)) {
  throw new Error("DATABASE_URL must be a MySQL URL with a database name.");
}

const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: decodeURIComponent(parsedUrl.pathname.slice(1)),
});

export const prisma = new PrismaClient({ adapter });
