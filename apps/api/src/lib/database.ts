import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { requiredEnv } from "./config";

let client: PrismaClient | undefined;

export function database(): PrismaClient {
  if (!client) {
    const url = new URL(requiredEnv("DATABASE_URL"));
    const adapter = new PrismaMariaDb({
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      connectionLimit: 5,
    });
    client = new PrismaClient({ adapter });
  }
  return client;
}