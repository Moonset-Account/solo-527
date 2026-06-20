import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [remix()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:3002",
      "/uploads": "http://localhost:3002"
    }
  }
});
