import mongoose from "mongoose";

const defaultOptions = {
  autoIndex: true,
  maxPoolSize: 10,
};

export const connectMongo = async () => {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("DATABASE_URL (or MONGODB_URI) is required to connect MongoDB");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(uri, defaultOptions);
  return mongoose.connection;
};

export default mongoose;
