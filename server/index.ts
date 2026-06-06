import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import morgan from "morgan";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from './routes/api';
import { corsMiddleware, errorHandler } from './middlewares/common';

installGlobals();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(__dirname, "..", "build");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

const app = express();

app.use(compression());
app.disable("x-powered-by");
app.use(express.json());
app.use(corsMiddleware);

const viteDevServer =
  process.env.NODE_ENV === "production"
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

app.use(express.static(PUBLIC_DIR, { maxAge: "1h" }));
app.use(morgan("tiny"));

app.use('/api', apiRoutes);

app.all(
  "*",
  createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : await import("../build/server/index.js"),
  })
);

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
