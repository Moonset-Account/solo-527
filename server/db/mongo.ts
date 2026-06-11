import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;

export async function connectMongo(uri?: string) {
  if (cachedConnection) return cachedConnection;
  const mongoUri = uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/beiqiao_scheduling";
  try {
    cachedConnection = await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("[MongoDB] Connected successfully");
    return cachedConnection;
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err);
    throw err;
  }
}

export { mongoose };
