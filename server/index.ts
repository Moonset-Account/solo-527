import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
import { initNotificationQueue } from "./queue.js";
import { apiRouter } from "./api/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODE = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT) || 3000;

const app = express();

app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({ pool }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: MODE === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use("/api", apiRouter);

const viteDevServer =
  MODE !== "production"
    ? await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      )
    : null;

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("client/assets", { maxAge: "1y", immutable: true })
  );
}

app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : // @ts-ignore - build 产物在开发时不存在
        await import("../build/server/index.js"),
    mode: MODE,
  })
);

initNotificationQueue().catch(console.error);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${MODE}]`);
});
