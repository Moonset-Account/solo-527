import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    });

    redisClient.on('connect', () => {
      console.log(`🔴 Redis connected: ${REDIS_HOST}:${REDIS_PORT}`);
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err);
    });
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = getRedisClient().duplicate();
  }
  return redisSubscriber;
}

export const CACHE_KEYS = {
  PRICE_FLUCTUATION: 'price:fluctuation:',
  APPROVAL_BOARD: 'approval:board:',
  ALERT_UNREAD: 'alert:unread:',
  DAILY_REPORT: 'report:daily:',
  MATERIAL_PRICE_TREND: 'material:price:trend:',
};

export const NOTIFICATION_CHANNELS = {
  PRICE_ALERT: 'channel:price_alert',
  QUALIFICATION_ALERT: 'channel:qualification_alert',
  QUOTE_SUBMITTED: 'channel:quote_submitted',
  STATUS_CHANGE: 'channel:status_change',
};

export const CACHE_TTL = {
  FIVE_MINUTES: 300,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
};
