import { createRequestHandler } from "@remix-run/express";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUILD_DIR = path.join(process.cwd(), "build");

async function start() {
  const app = express();

  app.use(compression());

  app.disable("x-powered-by");

  if (process.env.NODE_ENV === "production") {
    app.use(
      "/assets",
      express.static("build/client/assets", {
        immutable: true,
        maxAge: "1y",
      })
    );
  }

  app.use(
    express.static("build/client", {
      maxAge: "1h",
    })
  );

  app.use(morgan("tiny"));

  app.use(express.json());

  app.all(
    "*",
    createRequestHandler({
      build: await import(BUILD_DIR),
      mode: process.env.NODE_ENV,
    })
  );

  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
