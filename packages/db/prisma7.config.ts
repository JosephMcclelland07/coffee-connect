import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env"), quiet: true });
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), ".env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: `node ${resolve(dirname(fileURLToPath(import.meta.url)), "prisma/seed.mjs")}`,
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
