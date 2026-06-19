import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/seat-config',
    dbName: process.env.MONGODB_DB_NAME || 'seat-config',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  exportDir: process.env.EXPORT_DIR || './data/exports',
} as const;
