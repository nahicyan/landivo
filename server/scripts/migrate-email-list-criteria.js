import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: "mongodb://127.0.0.1:27017/Landivo",
});

const buildCriteriaArrayUpdate = (field) => ({
  update: "EmailList",
  updates: [
    {
      q: { [`criteria.${field}`]: { $type: "string" } },
      u: [
        {
          $set: {
            [`criteria.${field}`]: {
              $cond: [
                { $eq: [`$criteria.${field}`, ""] },
                [],
                [`$criteria.${field}`],
              ],
            },
          },
        },
      ],
      multi: true,
    },
  ],
});

const buildTopLevelUnsetUpdate = (field) => ({
  update: "EmailList",
  updates: [
    {
      q: { [field]: { $exists: true } },
      u: { $unset: { [field]: "" } },
      multi: true,
    },
  ],
});

const runUpdate = async (label, command) => {
  const result = await prisma.$runCommandRaw(command);
  const modified =
    result?.nModified ??
    result?.nModifiedExisting ??
    result?.n ??
    result?.nMatched ??
    null;
  console.log(`[migrate-email-list-criteria] ${label}`, {
    modified,
    result,
  });
};

const runCount = async (label, query) => {
  const result = await prisma.$runCommandRaw({
    count: "EmailList",
    query,
  });
  const count = result?.n ?? result?.count ?? 0;
  console.log(`[migrate-email-list-criteria] ${label}`, { count });
  return count;
};

const main = async () => {
  console.log("[migrate-email-list-criteria] Starting normalization");

  await runUpdate(
    "criteria.areas string -> array",
    buildCriteriaArrayUpdate("areas")
  );
  await runUpdate(
    "criteria.city string -> array",
    buildCriteriaArrayUpdate("city")
  );
  await runUpdate(
    "criteria.county string -> array",
    buildCriteriaArrayUpdate("county")
  );
  await runUpdate(
    "criteria.buyerTypes string -> array",
    buildCriteriaArrayUpdate("buyerTypes")
  );

  await runCount("EmailList preferredCity present", {
    preferredCity: { $exists: true },
  });
  await runCount("EmailList preferredCounty present", {
    preferredCounty: { $exists: true },
  });
  await runCount("EmailList preferredCity or preferredCounty present", {
    $or: [
      { preferredCity: { $exists: true } },
      { preferredCounty: { $exists: true } },
    ],
  });

  await runUpdate(
    "preferredCity unset",
    buildTopLevelUnsetUpdate("preferredCity")
  );
  await runUpdate(
    "preferredCounty unset",
    buildTopLevelUnsetUpdate("preferredCounty")
  );

  console.log("[migrate-email-list-criteria] Done");
};

main()
  .catch((error) => {
    console.error("[migrate-email-list-criteria] Failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
