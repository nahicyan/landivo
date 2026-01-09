import dotenv from "dotenv";
import mongoose, { connectMongo } from "../config/mongoose.js";
import { getLogger } from "../utils/logger.js";

dotenv.config();

const DEFAULT_MONGO_URL = "mongodb://127.0.0.1:27017/Landivo";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || process.env.MONGODB_URI || DEFAULT_MONGO_URL;

const fromCollection = "residencies";
const toCollection = "properties";
const log = getLogger("migrateResidenciesToProperties");

const collectionExists = async (name) => {
  const result = await mongoose.connection.db
    .listCollections({ name })
    .toArray();
  return result.length > 0;
};

const main = async () => {
  log.info("[migrateResidenciesToProperties:main] > [Request]: start");
  await connectMongo();

  const hasResidencies = await collectionExists(fromCollection);
  const hasProperties = await collectionExists(toCollection);

  log.info(
    `[migrateResidenciesToProperties:main] > [Response]: residencies=${hasResidencies}, properties=${hasProperties}`
  );

  if (!hasResidencies) {
    log.info(
      "[migrateResidenciesToProperties:main] > [Response]: no residencies collection found"
    );
    return;
  }

  if (hasProperties) {
    log.info(
      "[migrateResidenciesToProperties:main] > [Response]: properties collection exists, skipping rename"
    );
    return;
  }

  await mongoose.connection.db.renameCollection(fromCollection, toCollection);
  log.info(
    `[migrateResidenciesToProperties:main] > [Response]: renamed ${fromCollection} -> ${toCollection}`
  );
};

main()
  .catch((error) => {
    log.error(
      `[migrateResidenciesToProperties:main] > [Error]: ${error?.message || error}`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
