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

/** @param {string} value */
const parseBoolean = (value) => ["1", "true", "yes", "on"].includes(value.toLowerCase());

const connectTimeoutParam = parsedUrl.searchParams.get("connectTimeout");
const acquireTimeoutParam = parsedUrl.searchParams.get("acquireTimeout");
const connectionLimitParam = parsedUrl.searchParams.get("connectionLimit");
const allowPublicKeyRetrievalParam = parsedUrl.searchParams.get("allowPublicKeyRetrieval");

const adapter = new PrismaMariaDb({
  host: parsedUrl.hostname,
  port: Number(parsedUrl.port || 3306),
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  database: decodeURIComponent(parsedUrl.pathname.slice(1)),
  ...(connectTimeoutParam ? { connectTimeout: Number(connectTimeoutParam) } : {}),
  ...(acquireTimeoutParam ? { acquireTimeout: Number(acquireTimeoutParam) } : {}),
  ...(connectionLimitParam ? { connectionLimit: Number(connectionLimitParam) } : {}),
  ...(allowPublicKeyRetrievalParam ? { allowPublicKeyRetrieval: parseBoolean(allowPublicKeyRetrievalParam) } : {}),
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

const interestCategoryDefinitions = [
  { categoryName: "Outdoors", interests: ["Hiking", "Cycling", "Running", "Gardening"] },
  { categoryName: "Food & Drink", interests: ["Cooking", "Coffee"] },
  { categoryName: "Creative", interests: ["Reading", "Photography", "Live Music", "Art"] },
  { categoryName: "Social", interests: ["Board Games", "Travel", "Volunteering"] },
  { categoryName: "Wellness", interests: ["Yoga"] },
  { categoryName: "Technology", interests: ["Technology"] },
];

const interestNames = interestCategoryDefinitions.flatMap(({ interests }) => interests);
const interestCategoryNames = interestCategoryDefinitions.map(({ categoryName }) => categoryName);
const interestToCategoryName = new Map(
  interestCategoryDefinitions.flatMap(({ categoryName, interests }) =>
    interests.map((interestName) => [interestName, categoryName]),
  ),
);


const matches = [
  ["ava.mitchell@example.com", "noah.patel@example.com"],
  ["mia.thompson@example.com", "liam.roberts@example.com"],
  ["isla.campbell@example.com", "oliver.nguyen@example.com"],
  ["amelia.walker@example.com", "jack.evans@example.com"],
  ["freya.morgan@example.com", "leo.hughes@example.com"],
  ["grace.bennett@example.com", "theo.reed@example.com"],
  ["lily.foster@example.com", "oscar.murphy@example.com"],
  ["poppy.bailey@example.com", "ava.mitchell@example.com"],
  ["noah.patel@example.com", "mia.thompson@example.com"],
  ["liam.roberts@example.com", "isla.campbell@example.com"],
  ["oliver.nguyen@example.com", "amelia.walker@example.com"],
  ["jack.evans@example.com", "freya.morgan@example.com"],
  ["leo.hughes@example.com", "grace.bennett@example.com"],
  ["theo.reed@example.com", "lily.foster@example.com"],
  ["oscar.murphy@example.com", "poppy.bailey@example.com"],
  ["ava.mitchell@example.com", "mia.thompson@example.com"],
  ["noah.patel@example.com", "isla.campbell@example.com"],
  ["liam.roberts@example.com", "oliver.nguyen@example.com"],
  ["amelia.walker@example.com", "freya.morgan@example.com"],
  ["jack.evans@example.com", "leo.hughes@example.com"],
];

const prisma = new PrismaClient({ adapter });
const prismaWithCategories = /** @type {any} */ (prisma);

/** @param {any} client */
const upsertInterestCategoriesAndAssignments = async (client) => {
  await Promise.all(
    interestCategoryNames.map((categoryName) =>
      client.interestCategory.upsert({
        where: { categoryName },
        create: { categoryName },
        update: {},
      }),
    ),
  );

  await Promise.all(
    interestNames.map((interestName) => {
      const categoryName = interestToCategoryName.get(interestName);
      if (!categoryName) {
        throw new Error(`Missing category mapping for interest: ${interestName}`);
      }

      return client.interest.upsert({
        where: { interestName },
        create: {
          interestName,
          category: { connect: { categoryName } },
        },
        update: {
          category: { connect: { categoryName } },
        },
      });
    }),
  );
};

try {
  const existingEmployeeCount = await prisma.employee.count();
  if (existingEmployeeCount > 0) {
    const [employeeCount, interestCount, matchCount, interestCategoryCount, categorizedInterestCount] = await Promise.all([
      prisma.employee.count({ where: { email: { in: employees.map(({ email }) => email) } } }),
      prisma.interest.count({ where: { interestName: { in: interestNames } } }),
      prisma.match.count(),
      prismaWithCategories.interestCategory.count({ where: { categoryName: { in: interestCategoryNames } } }),
      prismaWithCategories.interest.count({ where: { interestName: { in: interestNames }, category: { isNot: null } } }),
    ]);

    const baseSeedIsComplete =
      employeeCount === employees.length &&
      interestCount === interestNames.length &&
      matchCount >= matches.length;

    if (!baseSeedIsComplete) {
      throw new Error("Refusing to seed a non-empty database with incomplete or unrelated seed data.");
    }

    const interestCategoriesAreComplete =
      interestCategoryCount === interestCategoryNames.length &&
      categorizedInterestCount === interestNames.length;

    if (interestCategoriesAreComplete) {
      console.log("Seed data already exists; skipping.");
    } else {
      await prisma.$transaction(async (transaction) => {
        await upsertInterestCategoriesAndAssignments(transaction);
      });

      console.log("Interest categories synchronized for existing seed data.");
    }
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

      await upsertInterestCategoriesAndAssignments(transaction);


      const now = Date.now();
      await Promise.all(
        matches.map(async ([employeeOneEmail, employeeTwoEmail], matchOffset) => {
          const matchDate = new Date(now - (matches.length - 1 - matchOffset) * 24 * 60 * 60 * 1000);

          await transaction.match.create({
            data: {
              matchDate,
              matchType: "Interest-Based",
              matchStatus: "Completed",
              generatedByWheelSpin: false,
              employeeOne: { connect: { email: employeeOneEmail } },
              employeeTwo: { connect: { email: employeeTwoEmail } },
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