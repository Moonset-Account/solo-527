import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { config } from "./config";
import { connectMongoDB } from "./db/mongo";
import { connectRedis } from "./db/redis";
import { notFoundHandler, errorHandler } from "./middleware/error";
import { requestLogger } from "./middleware/validate";

import batchesRouter from "./routes/batches";
import inventoryRouter from "./routes/inventory";
import locationsRouter from "./routes/locations";
import safetyStockRouter from "./routes/safety-stock";
import transfersRouter from "./routes/transfers";
import receiptDiffsRouter from "./routes/receipt-diffs";
import statusHistoryRouter from "./routes/status-history";
import reportsRouter from "./routes/reports";

async function bootstrap() {
  await connectMongoDB();
  await connectRedis();

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      data: {
        service: "青禾库存追溯台 API",
        version: "1.0.0",
        status: "running",
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use("/api/batches", batchesRouter);
  app.use("/api/inventory", inventoryRouter);
  app.use("/api/locations", locationsRouter);
  app.use("/api/safety-stock", safetyStockRouter);
  app.use("/api/transfers", transfersRouter);
  app.use("/api/receipt-diffs", receiptDiffsRouter);
  app.use("/api/status-history", statusHistoryRouter);
  app.use("/api/reports", reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`[Server] 青禾库存追溯台 API 已启动: http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error("[Server] 启动失败:", err);
  process.exit(1);
});
