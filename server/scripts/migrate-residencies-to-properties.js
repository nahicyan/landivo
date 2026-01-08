import dotenv from "dotenv";
import mongoose, { connectMongo } from "../config/mongoose.js";

dotenv.config();

const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27017/Landivo";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || process.env.MONGODB_URI || DEFAULT_MONGO_URL;

const fromCollection = "residencies";
const toCollection = "properties";

const collectionExists = async (name) => {
  const result = await mongoose.connection.db
    .listCollections({ name })
    .toArray();
  return result.length > 0;
};

const main = async () => {
  console.log("[migrate-residencies-to-properties] Starting");
  await connectMongo();

  const hasResidencies = await collectionExists(fromCollection);
  const hasProperties = await collectionExists(toCollection);

  console.log("[migrate-residencies-to-properties] Found", {
    residencies: hasResidencies,
    properties: hasProperties,
  });

  if (!hasResidencies) {
    console.log(
      "[migrate-residencies-to-properties] No residencies collection found. Nothing to do."
    );
    return;
  }

  if (hasProperties) {
    console.log(
      "[migrate-residencies-to-properties] Properties collection already exists. Skipping rename."
    );
    return;
  }

  await mongoose.connection.db.renameCollection(fromCollection, toCollection);
  console.log(
    `[migrate-residencies-to-properties] Renamed ${fromCollection} -> ${toCollection}`
  );
};

main()
  .catch((error) => {
    console.error("[migrate-residencies-to-properties] Failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
