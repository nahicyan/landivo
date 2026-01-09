import mongoose, { connectMongo } from "../config/mongoose.js";
import { Buyer, EmailList } from "../models/index.js";
import { getLogger } from "../utils/logger.js";

const log = getLogger("migrateEmailListCriteria");

const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27017/Landivo";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || process.env.MONGODB_URI || DEFAULT_MONGO_URL;

const buildCriteriaArrayUpdate = (field) => ({
  filter: { [`criteria.${field}`]: { $type: "string" } },
  update: [
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
});

const buildCriteriaFlattenUpdate = (field) => ({
  filter: { [`criteria.${field}`]: { $elemMatch: { $type: "array" } } },
  update: [
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
});

const buildBuyerFlattenUpdate = (field) => ({
  filter: { [field]: { $elemMatch: { $type: "array" } } },
  update: [
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
});

const buildTopLevelUnsetUpdate = (field) => ({
  filter: { [field]: { $exists: true } },
  update: { $unset: { [field]: "" } },
});

const runUpdate = async (label, collection, filter, update) => {
  const result = await collection.updateMany(filter, update);
  const modified = result?.modifiedCount ?? result?.nModified ?? result?.n ?? null;
  log.info(
    `[migrateEmailListCriteria:runUpdate] > [Response]: ${label}, modified=${modified}`
  );
};

const runCount = async (label, model, query) => {
  const count = await model.countDocuments(query);
  log.info(
    `[migrateEmailListCriteria:runCount] > [Response]: ${label}, count=${count}`
  );
  return count;
};

const main = async () => {
  log.info("[migrateEmailListCriteria:main] > [Request]: start");
  await connectMongo();

  const emailListCollection = EmailList.collection;
  const buyerCollection = Buyer.collection;

  const criteriaAreasUpdate = buildCriteriaArrayUpdate("areas");
  await runUpdate(
    "criteria.areas string -> array",
    emailListCollection,
    criteriaAreasUpdate.filter,
    criteriaAreasUpdate.update
  );
  const criteriaCityUpdate = buildCriteriaArrayUpdate("city");
  await runUpdate(
    "criteria.city string -> array",
    emailListCollection,
    criteriaCityUpdate.filter,
    criteriaCityUpdate.update
  );
  const criteriaCountyUpdate = buildCriteriaArrayUpdate("county");
  await runUpdate(
    "criteria.county string -> array",
    emailListCollection,
    criteriaCountyUpdate.filter,
    criteriaCountyUpdate.update
  );
  const criteriaBuyerTypesUpdate = buildCriteriaArrayUpdate("buyerTypes");
  await runUpdate(
    "criteria.buyerTypes string -> array",
    emailListCollection,
    criteriaBuyerTypesUpdate.filter,
    criteriaBuyerTypesUpdate.update
  );

  await runCount("criteria.areas nested arrays", EmailList, {
    "criteria.areas": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.city nested arrays", EmailList, {
    "criteria.city": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.county nested arrays", EmailList, {
    "criteria.county": { $elemMatch: { $type: "array" } },
  });
  await runCount("criteria.buyerTypes nested arrays", EmailList, {
    "criteria.buyerTypes": { $elemMatch: { $type: "array" } },
  });

  const criteriaAreasFlatten = buildCriteriaFlattenUpdate("areas");
  await runUpdate(
    "criteria.areas flatten",
    emailListCollection,
    criteriaAreasFlatten.filter,
    criteriaAreasFlatten.update
  );
  const criteriaCityFlatten = buildCriteriaFlattenUpdate("city");
  await runUpdate(
    "criteria.city flatten",
    emailListCollection,
    criteriaCityFlatten.filter,
    criteriaCityFlatten.update
  );
  const criteriaCountyFlatten = buildCriteriaFlattenUpdate("county");
  await runUpdate(
    "criteria.county flatten",
    emailListCollection,
    criteriaCountyFlatten.filter,
    criteriaCountyFlatten.update
  );
  const criteriaBuyerTypesFlatten = buildCriteriaFlattenUpdate("buyerTypes");
  await runUpdate(
    "criteria.buyerTypes flatten",
    emailListCollection,
    criteriaBuyerTypesFlatten.filter,
    criteriaBuyerTypesFlatten.update
  );

  await runCount("Buyer preferredAreas nested arrays", Buyer, {
    preferredAreas: { $elemMatch: { $type: "array" } },
  });
  await runCount("Buyer preferredCity nested arrays", Buyer, {
    preferredCity: { $elemMatch: { $type: "array" } },
  });
  await runCount("Buyer preferredCounty nested arrays", Buyer, {
    preferredCounty: { $elemMatch: { $type: "array" } },
  });

  const buyerAreasFlatten = buildBuyerFlattenUpdate("preferredAreas");
  await runUpdate(
    "Buyer preferredAreas flatten",
    buyerCollection,
    buyerAreasFlatten.filter,
    buyerAreasFlatten.update
  );
  const buyerCityFlatten = buildBuyerFlattenUpdate("preferredCity");
  await runUpdate(
    "Buyer preferredCity flatten",
    buyerCollection,
    buyerCityFlatten.filter,
    buyerCityFlatten.update
  );
  const buyerCountyFlatten = buildBuyerFlattenUpdate("preferredCounty");
  await runUpdate(
    "Buyer preferredCounty flatten",
    buyerCollection,
    buyerCountyFlatten.filter,
    buyerCountyFlatten.update
  );

  await runCount("EmailList preferredCity present", EmailList, {
    preferredCity: { $exists: true },
  });
  await runCount("EmailList preferredCounty present", EmailList, {
    preferredCounty: { $exists: true },
  });
  await runCount("EmailList preferredCity or preferredCounty present", EmailList, {
    $or: [
      { preferredCity: { $exists: true } },
      { preferredCounty: { $exists: true } },
    ],
  });

  const preferredCityUnset = buildTopLevelUnsetUpdate("preferredCity");
  await runUpdate(
    "preferredCity unset",
    emailListCollection,
    preferredCityUnset.filter,
    preferredCityUnset.update
  );
  const preferredCountyUnset = buildTopLevelUnsetUpdate("preferredCounty");
  await runUpdate(
    "preferredCounty unset",
    emailListCollection,
    preferredCountyUnset.filter,
    preferredCountyUnset.update
  );

  log.info("[migrateEmailListCriteria:main] > [Response]: done");
};

main()
  .catch((error) => {
    log.error(
      `[migrateEmailListCriteria:main] > [Error]: ${error?.message || error}`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
