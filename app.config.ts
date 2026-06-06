import { defineConfig } from "@solidjs/start/config";

const fixConditionsPlugin = () => ({
  name: "fix-conditions",
  configEnvironment(name: string, config: any) {
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.conditions) {
      if (name === "client") {
        config.resolve.conditions = ["module", "browser", "development", "production"];
      } else {
        config.resolve.conditions = ["node", "module", "development", "production"];
      }
    }
  },
});

export default defineConfig({
  ssr: true,
  server: {
    preset: "node-server",
  },
  vite: {
    plugins: [fixConditionsPlugin()],
  },
});
