require('dotenv').config();

const config = {
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || '.txt,.pdf,.docx').split(','),
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'contract_risk_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    pool: {
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
      min: parseInt(process.env.DB_POOL_MIN, 10) || 0,
      acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
      idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    timeout: parseInt(process.env.OPENAI_API_TIMEOUT, 10) || 60000,
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES, 10) || 3,
  },
  vector: {
    dimension: parseInt(process.env.VECTOR_DIMENSION, 10) || 1536,
    searchLimit: parseInt(process.env.VECTOR_SEARCH_LIMIT, 10) || 5,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  risk: {
    lowConfidenceThreshold: parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD) || 0.7,
    types: (process.env.RISK_TYPES || 'payment,breach,confidentiality,auto_renewal').split(','),
  },
  alerts: {
    webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    emailTo: process.env.ALERT_EMAIL_TO || '',
    modelDriftThreshold: parseFloat(process.env.MODEL_DRIFT_THRESHOLD) || 0.15,
  },
};

module.exports = config;
