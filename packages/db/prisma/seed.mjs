// @ts-check

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const prismaDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(prismaDirectory, "..");
loadEnv({ path: resolve(packageDirectory, "../../.env") });

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const parsedUrl = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: decodeURIComponent(parsedUrl.pathname.slice(1)),
});

const employees = [
  { firstName: "Ava", lastName: "Mitchell", email: "ava.mitchell@example.com", officeLocation: "London", department: "Engineering", role: "Software Engineer" },
  { firstName: "Noah", lastName: "Patel", email: "noah.patel@example.com", officeLocation: "Manchester", department: "People", role: "HR Business Partner" },
  { firstName: "Mia", lastName: "Thompson", email: "mia.thompson@example.com", officeLocation: "Bristol", department: "Finance", role: "Financial Analyst" },
  { firstName: "Liam", lastName: "Roberts", email: "liam.roberts@example.com", officeLocation: "London", department: "Product", role: "Product Manager" },
  { firstName: "Isla", lastName: "Campbell", email: "isla.campbell@example.com", officeLocation: "Edinburgh", department: "Design", role: "UX Designer" },
  { firstName: "Oliver", lastName: "Nguyen", email: "oliver.nguyen@example.com", officeLocation: "Manchester", department: "Engineering", role: "Data Engineer" },
  { firstName: "Amelia", lastName: "Walker", email: "amelia.walker@example.com", officeLocation: "Bristol", department: "Marketing", role: "Marketing Manager" },
  { firstName: "Jack", lastName: "Evans", email: "jack.evans@example.com", officeLocation: "London", department: "Sales", role: "Account Executive" },
  { firstName: "Freya", lastName: "Morgan", email: "freya.morgan@example.com", officeLocation: "Cardiff", department: "People", role: "Talent Specialist" },
  { firstName: "Leo", lastName: "Hughes", email: "leo.hughes@example.com", officeLocation: "Edinburgh", department: "Engineering", role: "Frontend Developer" },
  { firstName: "Grace", lastName: "Bennett", email: "grace.bennett@example.com", officeLocation: "London", department: "Operations", role: "Operations Analyst" },
  { firstName: "Theo", lastName: "Reed", email: "theo.reed@example.com", officeLocation: "Manchester", department: "Product", role: "Product Designer" },
  { firstName: "Lily", lastName: "Foster", email: "lily.foster@example.com", officeLocation: "Bristol", department: "Customer Success", role: "Customer Success Manager" },
  { firstName: "Oscar", lastName: "Murphy", email: "oscar.murphy@example.com", officeLocation: "Cardiff", department: "Finance", role: "Management Accountant" },
  { firstName: "Poppy", lastName: "Bailey", email: "poppy.bailey@example.com", officeLocation: "London", department: "Engineering", role: "Backend Developer" },
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

const matches = [
  ["ava.mitchell@example.com", "noah.patel@example.com", "Virtual - Reading"],
  ["mia.thompson@example.com", "liam.roberts@example.com", "Virtual - Hiking"],
  ["isla.campbell@example.com", "oliver.nguyen@example.com", "Virtual - Cooking"],
  ["amelia.walker@example.com", "jack.evans@example.com", "Virtual - Cycling and Technology"],
  ["freya.morgan@example.com", "leo.hughes@example.com", "Virtual - Photography"],
  ["grace.bennett@example.com", "theo.reed@example.com", "Virtual - Running"],
  ["lily.foster@example.com", "oscar.murphy@example.com", "Virtual - Gardening"],
  ["poppy.bailey@example.com", "ava.mitchell@example.com", "Virtual - Reading"],
  ["noah.patel@example.com", "mia.thompson@example.com", "Virtual - Board Games"],
  ["liam.roberts@example.com", "isla.campbell@example.com", "Virtual - Travel"],
  ["oliver.nguyen@example.com", "amelia.walker@example.com", "Virtual - Volunteering"],
  ["jack.evans@example.com", "freya.morgan@example.com", "Virtual - Live Music"],
  ["leo.hughes@example.com", "grace.bennett@example.com", "Virtual - Technology"],
  ["theo.reed@example.com", "lily.foster@example.com", "Virtual - Technology"],
  ["oscar.murphy@example.com", "poppy.bailey@example.com", "Virtual - Yoga"],
  ["ava.mitchell@example.com", "mia.thompson@example.com", "Virtual - Reading"],
  ["noah.patel@example.com", "isla.campbell@example.com", "Virtual - Board Games"],
  ["liam.roberts@example.com", "oliver.nguyen@example.com", "Virtual - Photography"],
  ["amelia.walker@example.com", "freya.morgan@example.com", "Virtual - Coffee"],
  ["jack.evans@example.com", "leo.hughes@example.com", "Virtual - Volunteering"],
];

const prisma = new PrismaClient({ adapter });

try {
  const existingEmployeeCount = await prisma.employee.count();
  if (existingEmployeeCount > 0) {
    const [employeeCount, interestCount, administratorCount, matchCount, meetingCount] = await Promise.all([
      prisma.employee.count({ where: { email: { in: employees.map(({ email }) => email) } } }),
      prisma.interest.count({ where: { interestName: { in: interestNames } } }),
      prisma.hRAdministrator.count({ where: { employee: { email: { in: adminEmails } } } }),
      prisma.match.count(),
      prisma.meeting.count(),
    ]);

    const seedIsComplete =
      employeeCount === employees.length &&
      interestCount === interestNames.length &&
      administratorCount === adminEmails.length &&
      matchCount >= matches.length &&
      meetingCount >= matches.length;

    if (!seedIsComplete) {
      throw new Error("Refusing to seed a non-empty database with incomplete or unrelated seed data.");
    }

    console.log("Seed data already exists; skipping.");
  } else {
    await prisma.$transaction(async (transaction) => {
      await Promise.all(
        employees.map((employee) =>
          transaction.employee.upsert({
            where: { email: employee.email },
            create: employee,
            update: employee,
          }),
        ),
      );

      await Promise.all(
        interestNames.map((interestName) =>
          transaction.interest.upsert({
            where: { interestName },
            create: { interestName },
            update: {},
          }),
        ),
      );

      await Promise.all(
        adminEmails.map(async (email) => {
          const employee = await transaction.employee.findUniqueOrThrow({
            where: { email },
            select: { employeeId: true },
          });

          await transaction.hRAdministrator.upsert({
            where: { employeeId: employee.employeeId },
            create: {
              employeeId: employee.employeeId,
              permissionLevel: "Full Access",
            },
            update: { permissionLevel: "Full Access" },
          });
        }),
      );

      const now = Date.now();
      await Promise.all(
        matches.map(async ([employeeOneEmail, employeeTwoEmail, location], matchOffset) => {
          const matchDate = new Date(now - (matches.length - 1 - matchOffset) * 24 * 60 * 60 * 1000);
          const meetingDate = new Date(matchDate);
          meetingDate.setUTCHours(0, 0, 0, 0);
          const startTime = new Date(Date.UTC(1970, 0, 1, 9, matchOffset * 30));
          const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

          await transaction.match.create({
            data: {
              matchDate,
              matchType: "Interest-Based",
              matchStatus: "Completed",
              generatedByWheelSpin: false,
              employeeOne: { connect: { email: employeeOneEmail } },
              employeeTwo: { connect: { email: employeeTwoEmail } },
              meetings: {
                create: {
                  meetingDate,
                  startTime,
                  endTime,
                  location,
                  status: "Completed",
                },
              },
            },
          });
        }),
      );
    });

    console.log("Database seeded successfully.");
  }
} finally {
  await prisma.$disconnect();
}