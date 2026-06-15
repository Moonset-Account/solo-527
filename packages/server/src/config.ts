import "dotenv/config";

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/qinghe-inventory",
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  sessionSecret:
    process.env.SESSION_SECRET || "change-me-in-production-please-use-a-long-random-string",
};
