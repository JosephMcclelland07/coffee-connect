import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { createConnection } from "mysql2/promise";

const prismaDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(prismaDirectory, "..");
loadEnv({ path: resolve(packageDirectory, "../../.env") });

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const parsedUrl = new URL(databaseUrl);
const connection = await createConnection({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: decodeURIComponent(parsedUrl.pathname.slice(1)),
  multipleStatements: true,
});

try {
  const [employees] = await connection.query("SELECT COUNT(*) AS count FROM Employee");
  if (Number(employees[0].count) > 0) {
    const employeeEmails = [
      "ava.mitchell@example.com",
      "noah.patel@example.com",
      "mia.thompson@example.com",
      "liam.roberts@example.com",
      "isla.campbell@example.com",
      "oliver.nguyen@example.com",
      "amelia.walker@example.com",
      "jack.evans@example.com",
      "freya.morgan@example.com",
      "leo.hughes@example.com",
      "grace.bennett@example.com",
      "theo.reed@example.com",
      "lily.foster@example.com",
      "oscar.murphy@example.com",
      "poppy.bailey@example.com",
    ];
    const interestNames = [
      "Hiking",
      "Cooking",
      "Reading",
      "Photography",
      "Cycling",
      "Running",
      "Board Games",
      "Gardening",
      "Travel",
      "Live Music",
      "Yoga",
      "Coffee",
      "Technology",
      "Art",
      "Volunteering",
    ];
    const adminEmails = ["noah.patel@example.com", "freya.morgan@example.com"];
    const placeholders = (values) => values.map(() => "?").join(", ");
    const [seedStateRows] = await connection.query(
      `SELECT
        (SELECT COUNT(*) FROM Employee WHERE Email IN (${placeholders(employeeEmails)})) AS employeeCount,
        (SELECT COUNT(*) FROM Interest WHERE InterestName IN (${placeholders(interestNames)})) AS interestCount,
        (SELECT COUNT(*) FROM HR_Administrator h
          JOIN Employee e ON e.EmployeeID = h.EmployeeID
          WHERE e.Email IN (${placeholders(adminEmails)})) AS administratorCount,
        (SELECT COUNT(*) FROM \`Match\`) AS matchCount,
        (SELECT COUNT(*) FROM Meeting) AS meetingCount`,
      [...employeeEmails, ...interestNames, ...adminEmails],
    );

    const seedState = seedStateRows[0];
    const seedIsComplete =
      Number(seedState.employeeCount) === employeeEmails.length &&
      Number(seedState.interestCount) === interestNames.length &&
      Number(seedState.administratorCount) === adminEmails.length &&
      Number(seedState.matchCount) >= 20 &&
      Number(seedState.meetingCount) >= 20;

    if (!seedIsComplete) {
      throw new Error("Refusing to seed a non-empty database with incomplete or unrelated seed data.");
    }

    console.log("Seed data already exists; skipping.");
  } else {
    const seedSql = await readFile(resolve(packageDirectory, "Migrations/seeding.sql"), "utf8");
    await connection.beginTransaction();
    try {
      await connection.query(seedSql);
      await connection.commit();
      console.log("Database seeded successfully.");
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}