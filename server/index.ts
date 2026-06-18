import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import mongoose from "mongoose";
import Redis from "ioredis";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beauty_salon";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const PORT = Number(process.env.PORT) || 3000;

export const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "build");

async function startServer() {
  await connectMongoDB();

  const app = express();

  app.use(compression());
  app.use(morgan("tiny"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const viteDevServer =
    MODE === "production"
      ? undefined
      : await import("vite").then((vite) =>
          vite.createServer({
            server: { middlewareMode: true },
          })
        );

  if (viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    app.use(
      "/build",
      express.static("public/build", { immutable: true, maxAge: "1y" })
    );
  }

  app.use(express.static("public", { maxAge: "1h" }));

  const apiRouter = await import("./routes/api.js").then((m) => m.default);
  app.use("/api", apiRouter);

  const build = viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import(BUILD_DIR + "/index.js");

  app.all(
    "*",
    createRequestHandler({
      build,
      mode: MODE,
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Mode: ${MODE}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
