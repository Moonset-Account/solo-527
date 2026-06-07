import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import apiRoutes from "./server/routes/api.js";
import { initCache } from "./server/services/cache.js";

installGlobals();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exportDir = join(__dirname, "exports");
if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();
const PORT = process.env.PORT || 8787;

app.use(compression());

app.use(
  morgan("tiny", {
    skip: (req) => req.path.startsWith("/resources"),
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
app.use("/exports", express.static(exportDir));
app.use(express.json());

initCache().catch(console.error);

app.use("/api", apiRoutes);

app.get("/login", (req, res) => {
  res.redirect("/");
});

app.all("*", remixHandler);

app.listen(PORT, () => {
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
  console.log(`✅ 灌溉仪表盘: http://localhost:${PORT}`);
});

export default app;
