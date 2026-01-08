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

const buildTopLevelArrayToStringUpdate = (field) => ({
  update: "EmailList",
  updates: [
    {
      q: { [field]: { $type: "array" } },
      u: [
        {
          $set: {
            [field]: {
              $cond: [
                { $gt: [{ $size: `$${field}` }, 0] },
                { $arrayElemAt: [`$${field}`, 0] },
                "",
              ],
            },
          },
        },
      ],
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

  await runUpdate(
    "preferredCity array -> string",
    buildTopLevelArrayToStringUpdate("preferredCity")
  );
  await runUpdate(
    "preferredCounty array -> string",
    buildTopLevelArrayToStringUpdate("preferredCounty")
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
