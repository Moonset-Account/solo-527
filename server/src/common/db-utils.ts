import mongoose from 'mongoose';
import { ServiceUnavailableException } from '@nestjs/common';

export function isDbReady(): boolean {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

export function ensureDb() {
  if (!isDbReady()) {
    throw new ServiceUnavailableException(
      '数据库暂不可用 (Database not ready). 请设置 MONGODB_URI 或稍后重试。',
    );
  }
}

export function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isDbReady()) {
    return Promise.resolve(fallback);
  }
  return fn().catch((err) => {
    console.warn('[DB Query Error]', err.message);
    return fallback;
  });
}
