import mongoose from "mongoose";
import { config } from "./config";

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
    console.error("[MongoDB] Failed to connect:", error);
    throw error;
  }
}

export { mongoose };
