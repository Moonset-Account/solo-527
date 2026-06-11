import "source-map-support/register";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import cron from "node-cron";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals, type ServerBuild } from "@remix-run/node";
import { connectMongo } from "@/server/db/mongo";
import { getRedis } from "@/server/db/redis";
import { getUserBySession } from "@/server/services/authService";
import { flushAuditBuffer, writeAudit } from "@/server/services/auditService";
import { runReminderCron } from "@/server/services/noticeService";
import type { User } from "@/shared/types";

installGlobals();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD_DIR = path.join(process.cwd(), "build");
const MODE = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT || 3000);

declare global {
  namespace Express {
    interface Request {
      currentUser?: User | null;
      sessionId?: string;
    }
  }
}

async function main() {
  const app = express();

  try {
    await connectMongo();
  } catch (e) {
    console.warn("[Mongo] Failed to connect, using memory fallback:", (e as Error).message);
  }
  getRedis();

  app.use(compression());
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(express.json({ limit: "10mb" }));

  app.use(
    morgan(MODE === "production" ? "combined" : "dev", {
      skip: (req) => req.path.startsWith("/resources") || req.path.endsWith(".map"),
    })
  );

  app.use(async (req, _res, next) => {
    const sid =
      req.cookies?.sid ||
      req.headers["x-session-id"] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : undefined) ||
      (req.query._sid as string) ||
      undefined;
    req.sessionId = sid;
    req.currentUser = sid ? await getUserBySession(sid) : null;
    next();
  });

  app.use((req, _res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && req.currentUser) {
      const url = req.path;
      if (!url.startsWith("/resources") && !url.includes("__vite")) {
        const method = req.method.toLowerCase();
        let action: any = "adjust_hours";
        let targetType: any = "student";
        if (url.includes("/consumption") || url.includes("/dashboard")) {
          action = "create_consumption";
          targetType = "consumption";
        } else if (url.includes("/schedule")) {
          action = "update_schedule";
          targetType = "schedule";
        } else if (url.includes("/notice")) {
          action = "publish_notice";
          targetType = "notice";
        }
        const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
        writeAudit(req.currentUser, action, targetType, `in-url-${Date.now()}`, {
          method,
          url,
          bodySize: JSON.stringify(req.body || {}).length,
        }, ip).catch(() => {});
      }
    }
    next();
  });

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
      "/assets",
      express.static("build/client/assets", { immutable: true, maxAge: "1y" })
    );
  }

  app.use(express.static("build/client", { maxAge: "1h" }));

  async function getBuild(): Promise<ServerBuild> {
    if (viteDevServer) {
      return viteDevServer.ssrLoadModule("virtual:remix/server-build") as Promise<ServerBuild>;
    }
    return import(`${BUILD_DIR}/server/index.js`);
  }

  app.all(
    "*",
    createRequestHandler({
      build: getBuild,
      mode: MODE as any,
      getLoadContext: (req) => ({
        user: req.currentUser,
        sessionId: req.sessionId,
        ip: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
      }),
    })
  );

  cron.schedule("*/30 * * * *", () => {
    flushAuditBuffer().catch((e) => console.error("[Audit] Scheduled flush error:", e));
  });

  cron.schedule("0 9,18 * * *", () => {
    runReminderCron().catch((e) => console.error("[Cron] Reminder error:", e));
  });

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 北桥排课消课台 服务启动成功`);
    console.log(`   环境: ${MODE}  端口: ${PORT}`);
    console.log(`   地址: http://localhost:${PORT}\n`);
  });

  process.on("SIGTERM", async () => {
    await flushAuditBuffer().catch(() => {});
    server.close(() => process.exit(0));
  });
}

main().catch((e) => {
  console.error("Server failed to start:", e);
  process.exit(1);
});
