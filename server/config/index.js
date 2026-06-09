/**
 * 配置加载模块
 * 统一管理所有环境变量和系统配置
 */
const dotenv = require('dotenv');
const path = require('path');

const envPath = process.env.NODE_ENV === 'test' 
  ? path.resolve(__dirname, '../../.env.test')
  : path.resolve(__dirname, '../../.env');

try {
  dotenv.config({ path: envPath });
} catch (e) {
  console.warn('[config] No .env file found, using environment variables');
}

const toBool = (val, def = false) => {
  if (val === undefined) return def;
  return val === 'true' || val === '1' || val === 'yes';
};

const toInt = (val, def) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? def : n;
};

const toFloat = (val, def) => {
  const n = parseFloat(val);
  return isNaN(n) ? def : n;
};

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  db: {
    path: path.resolve(process.env.DB_PATH || './data/app.db'),
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: toInt(process.env.REDIS_PORT, 6379),
    db: toInt(process.env.REDIS_DB, 0),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: toFloat(process.env.OPENAI_TEMPERATURE, 0.2),
    maxTokens: toInt(process.env.OPENAI_MAX_TOKENS, 4096),
  },

  thresholds: {
    assignee: toFloat(process.env.CONFIDENCE_THRESHOLD_ASSIGNEE, 0.75),
    deadline: toFloat(process.env.CONFIDENCE_THRESHOLD_DEADLINE, 0.70),
    milestone: toFloat(process.env.CONFIDENCE_THRESHOLD_MILESTONE, 0.80),
  },

  upload: {
    path: path.resolve(process.env.UPLOAD_PATH || './uploads'),
    maxSize: toInt(process.env.MAX_FILE_SIZE, 52428800),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  },

  metrics: {
    enabled: toBool(process.env.METRICS_ENABLED, true),
    path: process.env.METRICS_PATH || '/metrics',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
