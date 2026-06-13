import mongoose from "mongoose";

let cachedConnection: typeof mongoose | null = null;
let _connected = false;

export async function connectMongo(uri?: string) {
  if (cachedConnection) return cachedConnection;
  const mongoUri = uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/beiqiao_scheduling";
  try {
    cachedConnection = await mongoose.connect(mongoUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 1500,
      bufferCommands: false,
    });
    _connected = true;
    console.log("[MongoDB] Connected successfully");
    return cachedConnection;
  } catch (err) {
    _connected = false;
    console.error("[MongoDB] Connection failed:", err);
    throw err;
  }
}

export function isMongoReady() {
  return _connected && mongoose.connection.readyState === 1;
}

export { mongoose };
