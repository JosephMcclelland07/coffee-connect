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

const offices = ["Belfast", "Bristol", "Cardiff", "Edinburgh", "London", "Manchester"];
const nameSeeds = [
  ["Ava", "Mitchell"], ["Noah", "Patel"], ["Mia", "Thompson"], ["Liam", "Roberts"], ["Isla", "Campbell"],
  ["Oliver", "Nguyen"], ["Amelia", "Walker"], ["Jack", "Evans"], ["Freya", "Morgan"], ["Leo", "Hughes"],
  ["Grace", "Bennett"], ["Theo", "Reed"], ["Lily", "Foster"], ["Oscar", "Murphy"], ["Poppy", "Bailey"],
];
const departmentRoles = [
  ["Engineering", "Software Engineer"],
  ["People", "HR Business Partner"],
  ["Finance", "Financial Analyst"],
  ["Product", "Product Manager"],
  ["Design", "UX Designer"],
  ["Engineering", "Data Engineer"],
  ["Marketing", "Marketing Manager"],
  ["Sales", "Account Executive"],
  ["People", "Talent Specialist"],
  ["Engineering", "Frontend Developer"],
  ["Operations", "Operations Analyst"],
  ["Product", "Product Designer"],
  ["Customer Success", "Customer Success Manager"],
  ["Finance", "Management Accountant"],
  ["Engineering", "Backend Developer"],
];

const employees = offices.flatMap((officeLocation) =>
  nameSeeds.map(([firstName, lastName], index) => {
    const slugOffice = officeLocation.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const [department, role] = departmentRoles[index % departmentRoles.length];
    return {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${slugOffice}@example.com`,
      officeLocation,
      department,
      role,
    };
  }),
);

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

const matches = offices.flatMap((officeLocation) => {
  const officeEmails = employees.filter((employee) => employee.officeLocation === officeLocation).map((employee) => employee.email);
  return officeEmails.map((email, index) => [email, officeEmails[(index + 1) % officeEmails.length]]);
});

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

/** @param {any} client */
const upsertEmployeeInterests = async (client) => {
  for (const [index, employeeSeed] of employees.entries()) {
    const employee = await client.employee.findUnique({ where: { email: employeeSeed.email }, select: { employeeId: true } });
    if (!employee) continue;

    const assignedInterests = [
      interestNames[(index * 3) % interestNames.length],
      interestNames[(index * 3 + 7) % interestNames.length],
      interestNames[(index * 3 + 13) % interestNames.length],
    ];

    for (const interestName of assignedInterests) {
      const interest = await client.interest.findUnique({ where: { interestName }, select: { interestId: true } });
      if (!interest) continue;
      await client.employeeInterest.upsert({
        where: { employeeId_interestId: { employeeId: employee.employeeId, interestId: interest.interestId } },
        create: { employeeId: employee.employeeId, interestId: interest.interestId },
        update: {},
      });
    }
  }
};

try {
  const existingEmployeeCount = await prisma.employee.count();
  if (existingEmployeeCount > 0) {
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
      await upsertEmployeeInterests(transaction);
    });

    console.log("Employees (15 per office), interest categories, and employee interests synchronized for existing seed data.");
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
      await upsertEmployeeInterests(transaction);

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

    console.log("Database seeded successfully with 15 employees per office.");
  }
} finally {
  await prisma.$disconnect();
}