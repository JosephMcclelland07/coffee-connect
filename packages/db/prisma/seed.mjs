// @ts-check

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const prismaDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(prismaDirectory, "..");
loadEnv({ path: resolve(packageDirectory, "../../.env") });
loadEnv({ path: resolve(packageDirectory, ".env") });

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

const interestCategoryDefinitions = [
  { categoryName: "Sports", interests: ["Golf", "Football", "Basketball", "Tennis", "Swimming", "Running", "Cycling", "Cricket", "Rugby", "Fitness & sports"] },
  { categoryName: "Food & drink", interests: ["Coffee & cafes", "Food & cooking", "Baking", "Trying new restaurants"] },
  { categoryName: "Arts & culture", interests: ["Books & reading", "Live music", "Art & museums", "Films & cinema", "Photography", "Theatre"] },
  { categoryName: "Outdoors & travel", interests: ["Walking & hiking", "Travel", "Gardening", "Pets & animals", "Camping"] },
  { categoryName: "Games", interests: ["Board games", "Gaming", "Chess"] },
  { categoryName: "Technology & making", interests: ["Technology & AI", "Crafts & DIY", "Coding"] },
  { categoryName: "Community", interests: ["Volunteering", "Mentoring"] },
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

const legacyInterestAliases = [
  { legacyName: "Hiking", interestName: "Walking & hiking" },
  { legacyName: "Cooking", interestName: "Food & cooking" },
  { legacyName: "Reading", interestName: "Books & reading" },
  { legacyName: "Board Games", interestName: "Board games" },
  { legacyName: "Live Music", interestName: "Live music" },
  { legacyName: "Coffee", interestName: "Coffee & cafes" },
  { legacyName: "Technology", interestName: "Technology & AI" },
  { legacyName: "Art", interestName: "Art & museums" },
  { legacyName: "Yoga", interestName: "Fitness & sports" },
];

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

  for (const { legacyName, interestName } of legacyInterestAliases) {
  const [legacyInterest, currentInterest] = await Promise.all([
    client.interest.findUnique({ where: { interestName: legacyName } }),
    client.interest.findUnique({ where: { interestName } }),
  ]);
  if (!legacyInterest || !currentInterest) continue;
  if (legacyInterest.interestId === currentInterest.interestId) {
    if (legacyInterest.interestName !== interestName) {
      await client.interest.update({
        where: { interestId: legacyInterest.interestId },
        data: { interestName },
      });
    }
    continue;
  }

  const employeeInterests = await client.employeeInterest.findMany({
    where: { interestId: legacyInterest.interestId },
    select: { employeeId: true },
  });
  for (const { employeeId } of employeeInterests) {
    await client.employeeInterest.upsert({
      where: { employeeId_interestId: { employeeId, interestId: currentInterest.interestId } },
      create: { employeeId, interestId: currentInterest.interestId },
      update: {},
    });
  }
  await client.interest.delete({ where: { interestId: legacyInterest.interestId } });
  }
};

try {
  const existingEmployeeCount = await prisma.employee.count();
  if (existingEmployeeCount > 0) {
    const [employeeCount, matchCount] = await Promise.all([
      prisma.employee.count({ where: { email: { in: employees.map(({ email }) => email) } } }),
      prisma.match.count(),
    ]);

    const baseSeedIsComplete =
      employeeCount === employees.length &&
      matchCount >= matches.length;

    if (!baseSeedIsComplete) {
      throw new Error("Refusing to seed a non-empty database with incomplete or unrelated seed data.");
    }

    await prisma.$transaction(async (transaction) => {
      await upsertInterestCategoriesAndAssignments(transaction);
    });

    console.log("Interest categories synchronized for existing seed data.");
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