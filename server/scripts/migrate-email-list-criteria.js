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

const buildCriteriaFlattenUpdate = (field) => ({
  update: "EmailList",
  updates: [
    {
      q: { [`criteria.${field}`]: { $elemMatch: { $type: "array" } } },
      u: [
        {
          $set: {
            [`criteria.${field}`]: {
              $let: {
                vars: {
                  input: { $ifNull: [`$criteria.${field}`, []] },
                },
                in: {
                  $reduce: {
                    input: "$$input",
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        {
                          $cond: [
                            { $isArray: "$$this" },
                            "$$this",
                            ["$$this"],
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      ],
      multi: true,
    },
  ],
});

const buildBuyerFlattenUpdate = (field) => ({
  update: "Buyer",
  updates: [
    {
      q: { [field]: { $elemMatch: { $type: "array" } } },
      u: [
        {
          $set: {
            [field]: {
              $let: {
                vars: { input: { $ifNull: [`$${field}`, []] } },
                in: {
                  $reduce: {
                    input: "$$input",
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        {
                          $cond: [
                            { $isArray: "$$this" },
                            "$$this",
                            ["$$this"],
                          ],
                        },
                      ],
                    },
                  },
                },
              },
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

  await runCount("criteria.areas nested arrays", {
    "criteria.areas": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.city nested arrays", {
    "criteria.city": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.county nested arrays", {
    "criteria.county": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.buyerTypes nested arrays", {
    "criteria.buyerTypes": { $elemMatch: { $type: "array" } },
  });

  await runUpdate(
    "criteria.areas flatten",
    buildCriteriaFlattenUpdate("areas")
  );
  await runUpdate(
    "criteria.city flatten",
    buildCriteriaFlattenUpdate("city")
  );
  await runUpdate(
    "criteria.county flatten",
    buildCriteriaFlattenUpdate("county")
  );
  await runUpdate(
    "criteria.buyerTypes flatten",
    buildCriteriaFlattenUpdate("buyerTypes")
  );

  await runCount("Buyer preferredAreas nested arrays", {
    preferredAreas: { $elemMatch: { $type: "array" } },
  });
  await runCount("Buyer preferredCity nested arrays", {
    preferredCity: { $elemMatch: { $type: "array" } },
  });
  await runCount("Buyer preferredCounty nested arrays", {
    preferredCounty: { $elemMatch: { $type: "array" } },
  });

  await runUpdate(
    "Buyer preferredAreas flatten",
    buildBuyerFlattenUpdate("preferredAreas")
  );
  await runUpdate(
    "Buyer preferredCity flatten",
    buildBuyerFlattenUpdate("preferredCity")
  );
  await runUpdate(
    "Buyer preferredCounty flatten",
    buildBuyerFlattenUpdate("preferredCounty")
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
