export default {
  appDirectory: "app",
  devServerPort: 8002,
  publicPath: "/build/",
  serverBuildPath: "build/index.js",
  serverPort: 399,
  ignoredRouteFiles: [".*"],
  postcss: true,
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
};
