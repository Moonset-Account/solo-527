import mongoose from "mongoose";
import { config } from "../config";

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log(`[MongoDB] Connected to: ${config.mongodbUri}`);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
      isConnected = false;
    });
  } catch (error) {
    console.warn(
      "[MongoDB] Failed to connect, running in degraded mode without database:",
      (error as Error).message
    );
    console.warn("[MongoDB] API endpoints requiring database will return errors");
    isConnected = false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected;
}

export default mongoose;
